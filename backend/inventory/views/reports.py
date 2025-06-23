from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta
from django.utils.dateparse import parse_date
from django.http import HttpResponse
from django.conf import settings
import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from io import BytesIO
from ..models import Report, Procurement, StockMovement, Item, SendingStockRequest, DiscardedItem, User
from ..serializers import ReportSerializer


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.all()
    serializer_class = ReportSerializer

    def _get_generated_by_user(self, request):
        """Helper method to get the appropriate User instance for generated_by"""
        if hasattr(request, 'user') and request.user and not request.user.is_anonymous:
            # Try to find our custom User model instance
            try:
                # If request.user is our custom User model
                if isinstance(request.user, User):
                    return request.user
                # If request.user is Django auth User, try to find corresponding custom User
                elif hasattr(request.user, 'email'):
                    return User.objects.get(email=request.user.email)
                else:
                    return None
            except User.DoesNotExist:
                return None
        return None

    def _parse_date_filter(self, date_str):
        """Helper method to parse date strings and make them timezone-aware"""
        if not date_str:
            return None
        try:
            # Parse the date string
            parsed_date = parse_date(date_str)
            if parsed_date:
                # Make it timezone-aware by combining with current timezone
                return timezone.make_aware(
                    datetime.combine(parsed_date, datetime.min.time()),
                    timezone=timezone.get_current_timezone()
                )
        except (ValueError, TypeError):
            pass
        return None

    def _generate_pdf_content(self, report_data, report_type):
        """Generate PDF content based on report type and data"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        
        # Add title
        title = Paragraph(f"{report_type.replace('_', ' ').title()} Report", title_style)
        elements.append(title)
        elements.append(Spacer(1, 20))
        
        # Add report metadata
        metadata_style = styles['Normal']
        elements.append(Paragraph(f"Generated on: {report_data.get('generated_at', 'N/A')}", metadata_style))
        elements.append(Paragraph(f"Total Records: {report_data.get('total_records', report_data.get('total_items', 0))}", metadata_style))
        
        if report_data.get('total_amount'):
            elements.append(Paragraph(f"Total Amount: ${report_data['total_amount']:.2f}", metadata_style))
        if report_data.get('total_value'):
            elements.append(Paragraph(f"Total Value: ${report_data['total_value']:.2f}", metadata_style))
        if report_data.get('total_quantity_discarded'):
            elements.append(Paragraph(f"Total Quantity Discarded: {report_data['total_quantity_discarded']}", metadata_style))
        
        elements.append(Spacer(1, 20))
        
        # Generate table based on report type
        if report_data.get('data'):
            data = report_data['data']
            if data:
                # Get headers from first data item
                headers = list(data[0].keys())
                # Convert headers to readable format
                header_labels = [h.replace('_', ' ').title() for h in headers]
                
                # Prepare table data
                table_data = [header_labels]
                for item in data:
                    row = []
                    for header in headers:
                        value = item.get(header, '')
                        # Format dates
                        if isinstance(value, str) and 'date' in header.lower():
                            try:
                                parsed_date = datetime.fromisoformat(value.replace('Z', '+00:00'))
                                value = parsed_date.strftime('%Y-%m-%d')
                            except:
                                pass
                        # Format currency
                        elif isinstance(value, (int, float)) and any(currency_word in header.lower() for currency_word in ['price', 'amount', 'value']):
                            value = f"${value:.2f}"
                        row.append(str(value))
                    table_data.append(row)
                
                # Create table
                table = Table(table_data)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 10),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ]))
                
                elements.append(table)
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer

    @action(detail=False, methods=['post'])
    def generate_procurement_report(self, request):
        """Generate procurement report with filters"""
        try:
            filters = request.data.get('filters', {})
            
            # Build query based on filters
            queryset = Procurement.objects.all()
            
            start_date = self._parse_date_filter(filters.get('startDate'))
            end_date = self._parse_date_filter(filters.get('endDate'))
            
            if start_date:
                queryset = queryset.filter(created_at__gte=start_date)
            if end_date:
                # For end date, we want to include the entire day
                end_date = timezone.make_aware(
                    datetime.combine(end_date.date(), datetime.max.time()),
                    timezone=timezone.get_current_timezone()
                )
                queryset = queryset.filter(created_at__lte=end_date)
            if filters.get('item'):
                queryset = queryset.filter(item__id=filters['item'])
            
            # Create report record
            report = Report.objects.create(
                report_type='procurement',
                filters=filters,
                generated_by=self._get_generated_by_user(request)
            )
            
            # Prepare report data
            report_data = {
                'report_id': report.id,
                'report_type': 'procurement',
                'generated_at': report.generated_at,
                'filters': filters,
                'total_records': queryset.count(),
                'total_amount': sum(float(p.unit_price) * p.quantity for p in queryset),
                'data': []
            }
            
            for procurement in queryset:
                report_data['data'].append({
                    'order_number': procurement.order_number,
                    'item_name': procurement.item.name,
                    'quantity': procurement.quantity,
                    'unit_price': float(procurement.unit_price),
                    'total_amount': float(procurement.unit_price) * procurement.quantity,
                    'supplier': procurement.supplier,
                    'order_date': procurement.order_date,
                    'created_at': procurement.created_at
                })
            
            return Response(report_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate procurement report: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def generate_stock_movement_report(self, request):
        """Generate stock movement report with filters"""
        try:
            filters = request.data.get('filters', {})
            
            queryset = StockMovement.objects.all()
            
            start_date = self._parse_date_filter(filters.get('startDate'))
            end_date = self._parse_date_filter(filters.get('endDate'))
            
            if start_date:
                queryset = queryset.filter(movement_date__gte=start_date.date())
            if end_date:
                queryset = queryset.filter(movement_date__lte=end_date.date())
            if filters.get('user'):
                queryset = queryset.filter(received_by__id=filters['user'])
            if filters.get('item'):
                queryset = queryset.filter(item__id=filters['item'])
            
            report = Report.objects.create(
                report_type='stock_movement',
                filters=filters,
                generated_by=self._get_generated_by_user(request)
            )
            
            report_data = {
                'report_id': report.id,
                'report_type': 'stock_movement',
                'generated_at': report.generated_at,
                'filters': filters,
                'total_records': queryset.count(),
                'data': []
            }
            
            for movement in queryset:
                report_data['data'].append({
                    'item_name': movement.item.name,
                    'quantity': movement.quantity,
                    'from_location': movement.from_location.name,
                    'to_location': movement.to_location.name,
                    'movement_date': movement.movement_date,
                    'received_by': movement.received_by.name,
                    'notes': movement.notes
                })
            
            return Response(report_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate stock movement report: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def generate_inventory_report(self, request):
        """Generate inventory report with filters"""
        try:
            filters = request.data.get('filters', {})
            
            queryset = Item.objects.all()
            
            if filters.get('item'):
                queryset = queryset.filter(id=filters['item'])
            
            report = Report.objects.create(
                report_type='inventory',
                filters=filters,
                generated_by=self._get_generated_by_user(request)
            )
            
            report_data = {
                'report_id': report.id,
                'report_type': 'inventory',
                'generated_at': report.generated_at,
                'filters': filters,
                'total_items': queryset.count(),
                'total_value': sum(float(item.unit_price) * item.quantity for item in queryset),
                'data': []
            }
            
            for item in queryset:
                report_data['data'].append({
                    'item_name': item.name,
                    'category': item.category.name,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'total_value': float(item.unit_price) * item.quantity
                })
            
            return Response(report_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate inventory report: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def generate_stock_requests_report(self, request):
        """Generate stock requests report with filters"""
        try:
            filters = request.data.get('filters', {})
            
            queryset = SendingStockRequest.objects.all()
            
            start_date = self._parse_date_filter(filters.get('startDate'))
            end_date = self._parse_date_filter(filters.get('endDate'))
            
            if start_date:
                queryset = queryset.filter(created_at__gte=start_date)
            if end_date:
                # For end date, we want to include the entire day
                end_date = timezone.make_aware(
                    datetime.combine(end_date.date(), datetime.max.time()),
                    timezone=timezone.get_current_timezone()
                )
                queryset = queryset.filter(created_at__lte=end_date)
            if filters.get('status'):
                queryset = queryset.filter(status=filters['status'])
            if filters.get('user'):
                queryset = queryset.filter(requested_by__id=filters['user'])
            if filters.get('item'):
                queryset = queryset.filter(item__id=filters['item'])
            
            report = Report.objects.create(
                report_type='stock_requests',
                filters=filters,
                generated_by=self._get_generated_by_user(request)
            )
            
            report_data = {
                'report_id': report.id,
                'report_type': 'stock_requests',
                'generated_at': report.generated_at,
                'filters': filters,
                'total_records': queryset.count(),
                'pending_requests': queryset.filter(status='Pending').count(),
                'approved_requests': queryset.filter(status='Approved').count(),
                'rejected_requests': queryset.filter(status='Rejected').count(),
                'data': []
            }
            
            for request_item in queryset:
                report_data['data'].append({
                    'item_name': request_item.item.name,
                    'quantity': request_item.quantity,
                    'status': request_item.status,
                    'requested_by': str(request_item.requested_by) if request_item.requested_by else 'Unknown',
                    'created_at': request_item.created_at
                })
            
            return Response(report_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate stock requests report: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def generate_discarded_items_report(self, request):
        """Generate discarded items report with filters"""
        try:
            filters = request.data.get('filters', {})
            
            queryset = DiscardedItem.objects.all()
            
            start_date = self._parse_date_filter(filters.get('startDate'))
            end_date = self._parse_date_filter(filters.get('endDate'))
            
            if start_date:
                queryset = queryset.filter(date__gte=start_date.date())
            if end_date:
                queryset = queryset.filter(date__lte=end_date.date())
            if filters.get('reason'):
                queryset = queryset.filter(reason=filters['reason'])
            if filters.get('user'):
                queryset = queryset.filter(discarded_by__id=filters['user'])
            if filters.get('item'):
                queryset = queryset.filter(item__id=filters['item'])
            
            report = Report.objects.create(
                report_type='discarded_items',
                filters=filters,
                generated_by=self._get_generated_by_user(request)
            )
            
            report_data = {
                'report_id': report.id,
                'report_type': 'discarded_items',
                'generated_at': report.generated_at,
                'filters': filters,
                'total_records': queryset.count(),
                'total_quantity_discarded': sum(item.quantity for item in queryset),
                'data': []
            }
            
            for discarded_item in queryset:
                report_data['data'].append({
                    'item_name': discarded_item.item.name,
                    'quantity': discarded_item.quantity,
                    'reason': discarded_item.reason,
                    'date': discarded_item.date,
                    'discarded_by': discarded_item.discarded_by.name if discarded_item.discarded_by else 'Unknown',
                    'notes': discarded_item.notes
                })
            
            return Response(report_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate discarded items report: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def export_pdf(self, request, pk=None):
        """Export report as PDF"""
        try:
            report = self.get_object()
            
            # Get the report data based on report type
            report_data = None
            filters = report.filters or {}
            
            if report.report_type == 'procurement':
                queryset = Procurement.objects.all()
                if filters.get('startDate'):
                    start_date = self._parse_date_filter(filters['startDate'])
                    if start_date:
                        queryset = queryset.filter(created_at__gte=start_date)
                if filters.get('endDate'):
                    end_date = self._parse_date_filter(filters['endDate'])
                    if end_date:
                        end_date = timezone.make_aware(
                            datetime.combine(end_date.date(), datetime.max.time()),
                            timezone=timezone.get_current_timezone()
                        )
                        queryset = queryset.filter(created_at__lte=end_date)
                if filters.get('item'):
                    queryset = queryset.filter(item__id=filters['item'])
                
                report_data = {
                    'report_id': report.id,
                    'report_type': 'procurement',
                    'generated_at': report.generated_at,
                    'filters': filters,
                    'total_records': queryset.count(),
                    'total_amount': sum(float(p.unit_price) * p.quantity for p in queryset),
                    'data': []
                }
                
                for procurement in queryset:
                    report_data['data'].append({
                        'order_number': procurement.order_number,
                        'item_name': procurement.item.name,
                        'quantity': procurement.quantity,
                        'unit_price': float(procurement.unit_price),
                        'total_amount': float(procurement.unit_price) * procurement.quantity,
                        'supplier': procurement.supplier,
                        'order_date': procurement.order_date,
                        'created_at': procurement.created_at
                    })
            
            elif report.report_type == 'stock_movement':
                queryset = StockMovement.objects.all()
                if filters.get('startDate'):
                    start_date = self._parse_date_filter(filters['startDate'])
                    if start_date:
                        queryset = queryset.filter(movement_date__gte=start_date.date())
                if filters.get('endDate'):
                    end_date = self._parse_date_filter(filters['endDate'])
                    if end_date:
                        queryset = queryset.filter(movement_date__lte=end_date.date())
                if filters.get('user'):
                    queryset = queryset.filter(received_by__id=filters['user'])
                if filters.get('item'):
                    queryset = queryset.filter(item__id=filters['item'])
                
                report_data = {
                    'report_id': report.id,
                    'report_type': 'stock_movement',
                    'generated_at': report.generated_at,
                    'filters': filters,
                    'total_records': queryset.count(),
                    'data': []
                }
                
                for movement in queryset:
                    report_data['data'].append({
                        'item_name': movement.item.name,
                        'quantity': movement.quantity,
                        'from_location': movement.from_location.name,
                        'to_location': movement.to_location.name,
                        'movement_date': movement.movement_date,
                        'received_by': movement.received_by.name,
                        'notes': movement.notes
                    })
            
            elif report.report_type == 'inventory':
                queryset = Item.objects.all()
                if filters.get('item'):
                    queryset = queryset.filter(id=filters['item'])
                
                report_data = {
                    'report_id': report.id,
                    'report_type': 'inventory',
                    'generated_at': report.generated_at,
                    'filters': filters,
                    'total_items': queryset.count(),
                    'total_value': sum(float(item.unit_price) * item.quantity for item in queryset),
                    'data': []
                }
                
                for item in queryset:
                    report_data['data'].append({
                        'item_name': item.name,
                        'category': item.category.name,
                        'quantity': item.quantity,
                        'unit_price': float(item.unit_price),
                        'total_value': float(item.unit_price) * item.quantity
                    })
            
            elif report.report_type == 'stock_requests':
                queryset = SendingStockRequest.objects.all()
                if filters.get('startDate'):
                    start_date = self._parse_date_filter(filters['startDate'])
                    if start_date:
                        queryset = queryset.filter(created_at__gte=start_date)
                if filters.get('endDate'):
                    end_date = self._parse_date_filter(filters['endDate'])
                    if end_date:
                        end_date = timezone.make_aware(
                            datetime.combine(end_date.date(), datetime.max.time()),
                            timezone=timezone.get_current_timezone()
                        )
                        queryset = queryset.filter(created_at__lte=end_date)
                if filters.get('status'):
                    queryset = queryset.filter(status=filters['status'])
                if filters.get('user'):
                    queryset = queryset.filter(requested_by__id=filters['user'])
                if filters.get('item'):
                    queryset = queryset.filter(item__id=filters['item'])
                
                report_data = {
                    'report_id': report.id,
                    'report_type': 'stock_requests',
                    'generated_at': report.generated_at,
                    'filters': filters,
                    'total_records': queryset.count(),
                    'pending_requests': queryset.filter(status='Pending').count(),
                    'approved_requests': queryset.filter(status='Approved').count(),
                    'rejected_requests': queryset.filter(status='Rejected').count(),
                    'data': []
                }
                
                for request_item in queryset:
                    report_data['data'].append({
                        'item_name': request_item.item.name,
                        'quantity': request_item.quantity,
                        'status': request_item.status,
                        'requested_by': str(request_item.requested_by) if request_item.requested_by else 'Unknown',
                        'created_at': request_item.created_at
                    })
            
            elif report.report_type == 'discarded_items':
                queryset = DiscardedItem.objects.all()
                if filters.get('startDate'):
                    start_date = self._parse_date_filter(filters['startDate'])
                    if start_date:
                        queryset = queryset.filter(date__gte=start_date.date())
                if filters.get('endDate'):
                    end_date = self._parse_date_filter(filters['endDate'])
                    if end_date:
                        queryset = queryset.filter(date__lte=end_date.date())
                if filters.get('reason'):
                    queryset = queryset.filter(reason=filters['reason'])
                if filters.get('user'):
                    queryset = queryset.filter(discarded_by__id=filters['user'])
                if filters.get('item'):
                    queryset = queryset.filter(item__id=filters['item'])
                
                report_data = {
                    'report_id': report.id,
                    'report_type': 'discarded_items',
                    'generated_at': report.generated_at,
                    'filters': filters,
                    'total_records': queryset.count(),
                    'total_quantity_discarded': sum(item.quantity for item in queryset),
                    'data': []
                }
                
                for discarded_item in queryset:
                    report_data['data'].append({
                        'item_name': discarded_item.item.name,
                        'quantity': discarded_item.quantity,
                        'reason': discarded_item.reason,
                        'date': discarded_item.date,
                        'discarded_by': discarded_item.discarded_by.name if discarded_item.discarded_by else 'Unknown',
                        'notes': discarded_item.notes
                    })
            
            if not report_data:
                return Response(
                    {'error': 'Report data not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Generate PDF
            pdf_buffer = self._generate_pdf_content(report_data, report.report_type)
            
            # Create filename
            filename = f"{report.report_type}_report_{report.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            
            # Create HTTP response with PDF
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Failed to export PDF: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def export_excel(self, request, pk=None):
        """Export report as Excel"""
        try:
            report = self.get_object()
            # Here you would implement Excel generation logic
            # For now, we'll just return a success message
            return Response({
                'message': f'Excel export for report {report.id} initiated',
                'report_id': report.id
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Failed to export Excel: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 