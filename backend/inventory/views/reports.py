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
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from io import BytesIO
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
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
        """Generate professional PDF content based on report type and data"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=0.75*inch,
            rightMargin=0.75*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        elements = []
        
        # Custom styles
        styles = getSampleStyleSheet()
        
        # Add custom styles
        styles.add(ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#2E5984')
        ))
        
        styles.add(ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            spaceBefore=20,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#1E3F66')
        ))
        
        styles.add(ParagraphStyle(
            'Metadata',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            fontName='Helvetica'
        ))
        
        styles.add(ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            spaceBefore=20,
            alignment=TA_CENTER,
            textColor=colors.grey
        ))
        
        # Add company logo and header
        try:
            # Try multiple possible paths for the logo
            logo_paths = [
                "nedlogo.jpeg",
                "inventory/views/nedlogo.jpeg",
                os.path.join(os.path.dirname(__file__), "nedlogo.jpeg"),
                os.path.join(settings.BASE_DIR, "inventory", "views", "nedlogo.jpeg")
            ]
            
            logo_found = False
            for logo_path in logo_paths:
                if os.path.exists(logo_path):
                    logo = Image(logo_path, width=2*inch, height=0.75*inch)
                    elements.append(logo)
                    elements.append(Spacer(1, 10))
                    logo_found = True
                    break
                    
            if not logo_found:
                # Add a text header instead
                header_text = Paragraph("CSIT Inventory Management System", styles['CustomTitle'])
                elements.append(header_text)
                elements.append(Spacer(1, 10))
        except Exception as e:
            # Add a text header instead if logo fails
            header_text = Paragraph("CSIT Inventory Management System", styles['CustomTitle'])
            elements.append(header_text)
            elements.append(Spacer(1, 10))
        
        # Add title
        title = Paragraph(f"{report_type.replace('_', ' ').title()} Report", styles['CustomTitle'])
        elements.append(title)
        
        # Add horizontal line
        elements.append(Spacer(1, 0.1*inch))
        elements.append(HRFlowable(
            width="100%",
            thickness=1,
            lineCap='round',
            color=colors.HexColor('#2E5984'),
            spaceAfter=0.3*inch
        ))
        
        # Add report metadata in a two-column layout
        metadata = [
            ["Generated on:", report_data.get('generated_at', 'N/A')],
            ["Total Records:", str(report_data.get('total_records', report_data.get('total_items', 0)))],
        ]
        
        if report_data.get('total_amount'):
            metadata.append(["Total Amount:", f"${report_data['total_amount']:.2f}"])
        if report_data.get('total_value'):
            metadata.append(["Total Value:", f"${report_data['total_value']:.2f}"])
        if report_data.get('total_quantity_discarded'):
            metadata.append(["Total Discarded:", str(report_data['total_quantity_discarded'])])
        
        # Create metadata table
        metadata_table = Table(metadata, colWidths=[2*inch, 3*inch])
        metadata_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#1E3F66')),  # Dark blue for labels
            ('TEXTCOLOR', (1, 0), (1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))
        
        elements.append(metadata_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Generate table based on report type
        if report_data.get('data'):
            data = report_data['data']
            if data and len(data) > 0:  # Check if data exists and is not empty
                # Section header
                elements.append(Paragraph("Report Details", styles['SectionHeader']))
                
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
                            value = f"${value:,.2f}"
                        # Format large numbers with commas
                        elif isinstance(value, int) and value > 1000:
                            value = f"{value:,}"
                        row.append(str(value))
                    table_data.append(row)
                
                # Create table with alternating row colors
                table = Table(table_data, repeatRows=1)
                table_style = [
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E5984')),  # Header background
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),  # Header text
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 11),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.white),  # Default row color
                    ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 10),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D3D3D3')),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ]
                # Dynamically add alternating row colors for even rows (starting from row 2, i.e., index 2)
                for i in range(2, len(table_data), 2):
                    table_style.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor('#F5F5F5')))
                table.setStyle(TableStyle(table_style))
                
                elements.append(table)
            else:
                # Add a message when no data is available
                elements.append(Paragraph("Report Details", styles['SectionHeader']))
                elements.append(Paragraph("No data available for the selected filters.", styles['Metadata']))
        
        # Add footer
        elements.append(Spacer(1, 0.5*inch))
        elements.append(HRFlowable(
            width="100%",
            thickness=0.5,
            lineCap='round',
            color=colors.HexColor('#2E5984'),
            spaceAfter=0.2*inch
        ))
        footer_text = f"Confidential - {datetime.now().year} © Your Company Name"
        elements.append(Paragraph(footer_text, styles['Footer']))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer

    def _generate_excel_content(self, report_data, report_type):
        """Generate Excel content based on report type and data"""
        # Create a new workbook and select the active sheet
        wb = Workbook()
        ws = wb.active
        ws.title = f"{report_type.replace('_', ' ').title()} Report"
        
        # Define styles
        header_font = Font(bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="366092", end_color="366092", fill_type="solid")
        header_alignment = Alignment(horizontal="center", vertical="center")
        
        data_font = Font()
        data_fill = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")
        data_alignment = Alignment(horizontal="center", vertical="center")
        
        border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )
        
        # Add title
        ws['A1'] = f"{report_type.replace('_', ' ').title()} Report"
        ws['A1'].font = Font(bold=True, size=16)
        ws.merge_cells('A1:H1')
        ws['A1'].alignment = Alignment(horizontal="center")
        
        # Add metadata
        current_row = 3
        ws[f'A{current_row}'] = f"Generated on: {report_data.get('generated_at', 'N/A')}"
        current_row += 1
        ws[f'A{current_row}'] = f"Total Records: {report_data.get('total_records', report_data.get('total_items', 0))}"
        current_row += 1
        
        if report_data.get('total_amount'):
            ws[f'A{current_row}'] = f"Total Amount: ${report_data['total_amount']:.2f}"
            current_row += 1
        if report_data.get('total_value'):
            ws[f'A{current_row}'] = f"Total Value: ${report_data['total_value']:.2f}"
            current_row += 1
        if report_data.get('total_quantity_discarded'):
            ws[f'A{current_row}'] = f"Total Quantity Discarded: {report_data['total_quantity_discarded']}"
            current_row += 1
        
        current_row += 1  # Add space before table
        
        # Generate table based on report type
        if report_data.get('data'):
            data = report_data['data']
            if data and len(data) > 0:  # Check if data exists and is not empty
                # Get headers from first data item
                headers = list(data[0].keys())
                # Convert headers to readable format
                header_labels = [h.replace('_', ' ').title() for h in headers]
                
                # Add headers
                for col, header in enumerate(header_labels, 1):
                    cell = ws.cell(row=current_row, column=col, value=header)
                    cell.font = header_font
                    cell.fill = header_fill
                    cell.alignment = header_alignment
                    cell.border = border
                
                current_row += 1
                
                # Add data rows
                for item in data:
                    for col, header in enumerate(headers, 1):
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
                        
                        cell = ws.cell(row=current_row, column=col, value=str(value))
                        cell.font = data_font
                        cell.fill = data_fill
                        cell.alignment = data_alignment
                        cell.border = border
                    
                    current_row += 1
                
                # Auto-adjust column widths
                for column in ws.columns:
                    max_length = 0
                    column_letter = get_column_letter(column[0].column)
                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except:
                            pass
                    adjusted_width = min(max_length + 2, 50)  # Cap at 50 characters
                    ws.column_dimensions[column_letter].width = adjusted_width
            else:
                # Add a message when no data is available
                ws[f'A{current_row}'] = "No data available for the selected filters."
                ws[f'A{current_row}'].font = Font(bold=True, color="FF0000")
        
        # Save to BytesIO
        buffer = BytesIO()
        wb.save(buffer)
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
                    'location': discarded_item.location.name,
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
            # Get the report object
            try:
                report = self.get_object()
            except Exception as e:
                print(f"Error getting report object: {str(e)}")
                # Try to get the report directly using pk
                if pk:
                    try:
                        report = Report.objects.get(id=pk)
                    except Report.DoesNotExist:
                        return Response(
                            {'error': f'Report with ID {pk} not found'}, 
                            status=status.HTTP_404_NOT_FOUND
                        )
                else:
                    return Response(
                        {'error': 'Report ID not provided'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Get the report data based on report type
            report_data = None
            filters = report.filters or {}
            
            print(f"Exporting PDF for report {report.id} of type {report.report_type}")
            print(f"Filters: {filters}")
            
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
                
                print(f"Procurement queryset count: {queryset.count()}")
                
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
                
                print(f"Stock movement queryset count: {queryset.count()}")
                
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
                
                print(f"Inventory queryset count: {queryset.count()}")
                
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
                
                print(f"Stock requests queryset count: {queryset.count()}")
                
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
                
                print(f"Discarded items queryset count: {queryset.count()}")
                
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
                        'location': discarded_item.location.name,
                        'quantity': discarded_item.quantity,
                        'reason': discarded_item.reason,
                        'date': discarded_item.date,
                        'discarded_by': discarded_item.discarded_by.name if discarded_item.discarded_by else 'Unknown',
                        'notes': discarded_item.notes
                    })
            
            print(f"Report data prepared: {len(report_data.get('data', [])) if report_data else 0} items")
            
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
            print(f"Error in export_pdf: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to export PDF: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def export_excel(self, request, pk=None):
        """Export report as Excel"""
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
                        'location': discarded_item.location.name,
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
            
            # Generate Excel
            excel_buffer = self._generate_excel_content(report_data, report.report_type)
            
            # Create filename
            filename = f"{report.report_type}_report_{report.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            
            # Create HTTP response with Excel
            response = HttpResponse(excel_buffer.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
            
        except Exception as e:
            return Response(
                {'error': f'Failed to export Excel: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 