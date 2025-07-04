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
from ..models import Report, Procurement, StockMovement, Item, SendingStockRequest, DiscardedItem, User, InventoryByLocation, Location
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
        # Special handling for Register report
        if report_type == 'register':
            return self._generate_register_pdf_content(report_data)
        
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
                    logo = Image(logo_path, width=1*inch, height=1*inch)
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
        title_text = f"{report_type.replace('_', ' ').title()} Report"
        title = Paragraph(title_text, styles['CustomTitle'])
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
                        # Format quantity dict
                        elif header.lower() == 'quantity' and isinstance(value, dict):
                            value = f"Received: {value.get('received', '')}, Issued: {value.get('issued', '')}, Balance: {value.get('balance', '')}"
                        # Format large numbers with commas
                        elif isinstance(value, int) and value > 1000:
                            value = f"{value:,}"
                        # Wrap long text in Paragraph for word wrapping and row height
                        if isinstance(value, str) and (len(value) > 15 or '\n' in value or ',' in value):
                            value = Paragraph(value, styles['Normal'])
                        row.append(value)
                    table_data.append(row)
                
                # Create table with alternating row colors
                page_width = A4[0] - doc.leftMargin - doc.rightMargin
                num_columns = len(table_data[0])
                col_width = page_width / num_columns
                table = Table(table_data, colWidths=[col_width]*num_columns, repeatRows=1)
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
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('WORDWRAP', (0, 0), (-1, -1), 'CJK'),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
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
        footer_text = f"Confidential - {datetime.now().year} © NED UET"
        elements.append(Paragraph(footer_text, styles['Footer']))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer

    def _generate_register_pdf_content(self, report_data):
        """Generate specialized PDF content for Register report with proper table layout"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=0.5*inch,
            rightMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        elements = []
        
        # Custom styles
        styles = getSampleStyleSheet()
        
        # Add custom styles for Register report
        styles.add(ParagraphStyle(
            'RegisterTitle',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=15,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
            textColor=colors.HexColor('#2E5984')
        ))
        
        styles.add(ParagraphStyle(
            'RegisterHeader',
            parent=styles['Normal'],
            fontSize=9,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER,
            spaceAfter=2,
            spaceBefore=2,
            leading=11
        ))
        
        styles.add(ParagraphStyle(
            'RegisterSubHeader',
            parent=styles['Normal'],
            fontSize=8,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER,
            spaceAfter=1,
            spaceBefore=1,
            leading=10
        ))
        
        styles.add(ParagraphStyle(
            'RegisterCell',
            parent=styles['Normal'],
            fontSize=8,
            fontName='Helvetica',
            alignment=TA_CENTER,
            spaceAfter=1,
            spaceBefore=1,
            leading=10
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
                    logo = Image(logo_path, width=1*inch, height=1*inch)
                    elements.append(logo)
                    elements.append(Spacer(1, 10))
                    logo_found = True
                    break
                    
            if not logo_found:
                # Add a text header instead
                header_text = Paragraph("CSIT Inventory Management System", styles['RegisterTitle'])
                elements.append(header_text)
                elements.append(Spacer(1, 10))
        except Exception as e:
            # Add a text header instead if logo fails
            header_text = Paragraph("CSIT Inventory Management System", styles['RegisterTitle'])
            elements.append(header_text)
            elements.append(Spacer(1, 10))
        
        # Add company header
        header_text = Paragraph("NED UNIVERSITY OF ENGINEERING AND TECHNOLOGY, KARACHI", styles['RegisterTitle'])
        elements.append(header_text)
        
        # Add document code
        doc_code = Paragraph("Document Code: F/SOP/SD 01/52/01", styles['RegisterCell'])
        elements.append(doc_code)
        elements.append(Spacer(1, 10))
        
        # Add report metadata
        metadata = [
            ["Generated on:", str(report_data.get('generated_at', 'N/A'))],
            ["Total Records:", str(report_data.get('total_records', 0))],
        ]
        
        metadata_table = Table(metadata, colWidths=[1.5*inch, 3*inch])
        metadata_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#1E3F66')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        
        elements.append(metadata_table)
        elements.append(Spacer(1, 15))
        
        # Generate Register table
        if report_data.get('data'):
            data = report_data['data']
            if data and len(data) > 0:
                # Define column widths for Register table (11 columns total)
                page_width = A4[0] - doc.leftMargin - doc.rightMargin
                # Calculate total width needed and adjust proportionally
                total_width = 8.8*inch  # Sum of all column widths
                scale_factor = page_width / total_width
                
                col_widths = [
                    0.7*inch * scale_factor,  # Date
                    0.8*inch * scale_factor,  # Received/Issued
                    1.0*inch * scale_factor,  # Voucher No
                    1.1*inch * scale_factor,  # Particulars
                    0.7*inch * scale_factor,  # Unit
                    0.6*inch * scale_factor,  # Unit Price
                    0.8*inch * scale_factor,  # Total Cost
                    0.5*inch * scale_factor,  # Received (Quantity)
                    0.5*inch * scale_factor,  # Issued (Quantity)
                    0.5*inch * scale_factor,  # Balance (Quantity)
                    0.9*inch * scale_factor,  # Remarks
                ]
                
                # Create header rows with proper multi-line headers
                header_row1 = [
                    Paragraph("Date", styles['RegisterHeader']),
                    Paragraph("Received/<br/>Issued", styles['RegisterHeader']),
                    Paragraph("Voucher / Cash Memo /<br/>Requisition / Purchase<br/>Order No.", styles['RegisterHeader']),
                    Paragraph("Particulars", styles['RegisterHeader']),
                    Paragraph("Accounting /<br/>Measuring Unit", styles['RegisterHeader']),
                    Paragraph("Unit Price", styles['RegisterHeader']),
                    Paragraph("Total Cost<br/>(with taxes)", styles['RegisterHeader']),
                    Paragraph("Quantity", styles['RegisterHeader']),
                    Paragraph("", styles['RegisterHeader']),
                    Paragraph("", styles['RegisterHeader']),
                    Paragraph("Remarks / Initials of<br/>Authorized Persons", styles['RegisterHeader']),
                ]
                
                header_row2 = [
                    Paragraph("", styles['RegisterSubHeader']),
                    Paragraph("", styles['RegisterSubHeader']),
                    Paragraph("", styles['RegisterSubHeader']),
                    Paragraph("", styles['RegisterSubHeader']),
                    Paragraph("", styles['RegisterSubHeader']),
                    Paragraph("", styles['RegisterSubHeader']),
                    Paragraph("", styles['RegisterSubHeader']),
                    Paragraph("Received", styles['RegisterSubHeader']),
                    Paragraph("Issued", styles['RegisterSubHeader']),
                    Paragraph("Balance", styles['RegisterSubHeader']),
                    Paragraph("", styles['RegisterSubHeader']),
                ]
                
                # Prepare table data
                table_data = [header_row1, header_row2]
                
                for item in data:
                    row = [
                        Paragraph(item.get('date', ''), styles['RegisterCell']),
                        Paragraph(item.get('receivedIssued', ''), styles['RegisterCell']),
                        Paragraph(item.get('voucherNo', ''), styles['RegisterCell']),
                        Paragraph(item.get('particulars', ''), styles['RegisterCell']),
                        Paragraph(item.get('unit', ''), styles['RegisterCell']),
                        Paragraph(f"${item.get('unitPrice', 0):,.2f}", styles['RegisterCell']),
                        Paragraph(f"${item.get('totalCost', 0):,.2f}", styles['RegisterCell']),
                        Paragraph(str(item.get('quantity', {}).get('received', '')), styles['RegisterCell']),
                        Paragraph(str(item.get('quantity', {}).get('issued', '')), styles['RegisterCell']),
                        Paragraph(str(item.get('quantity', {}).get('balance', '')), styles['RegisterCell']),
                        Paragraph(item.get('remarks', ''), styles['RegisterCell']),
                    ]
                    table_data.append(row)
                
                # Create table
                table = Table(table_data, colWidths=col_widths, repeatRows=2)
                
                # Define table style with proper spacing and formatting
                table_style = [
                    # Header styling (first two rows)
                    ('BACKGROUND', (0, 0), (-1, 1), colors.HexColor('#2E5984')),
                    ('TEXTCOLOR', (0, 0), (-1, 1), colors.whitesmoke),
                    ('FONTNAME', (0, 0), (-1, 1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 1), 9),
                    ('ALIGN', (0, 0), (-1, 1), 'CENTER'),
                    ('VALIGN', (0, 0), (-1, 1), 'MIDDLE'),
                    ('TOPPADDING', (0, 0), (-1, 1), 6),
                    ('BOTTOMPADDING', (0, 0), (-1, 1), 6),
                    ('LEFTPADDING', (0, 0), (-1, 1), 3),
                    ('RIGHTPADDING', (0, 0), (-1, 1), 3),
                    
                    # Data row styling
                    ('BACKGROUND', (0, 2), (-1, -1), colors.white),
                    ('TEXTCOLOR', (0, 2), (-1, -1), colors.black),
                    ('FONTNAME', (0, 2), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 2), (-1, -1), 8),
                    ('ALIGN', (0, 2), (-1, -1), 'CENTER'),
                    ('VALIGN', (0, 2), (-1, -1), 'MIDDLE'),
                    ('TOPPADDING', (0, 2), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 2), (-1, -1), 4),
                    ('LEFTPADDING', (0, 2), (-1, -1), 2),
                    ('RIGHTPADDING', (0, 2), (-1, -1), 2),
                    
                    # Grid and borders
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D3D3D3')),
                    ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#2E5984')),
                    
                    # Word wrapping for all cells
                    ('WORDWRAP', (0, 0), (-1, -1), 'CJK'),
                    
                    # Merge quantity header cells
                    ('SPAN', (7, 0), (9, 0)),  # Merge "Quantity" across 3 columns
                ]
                
                # Add alternating row colors for data rows
                for i in range(3, len(table_data), 2):
                    table_style.append(('BACKGROUND', (0, i), (-1, i), colors.HexColor('#F8F9FA')))
                
                table.setStyle(TableStyle(table_style))
                elements.append(table)
            else:
                # Add a message when no data is available
                elements.append(Paragraph("No data available for the selected filters.", styles['RegisterCell']))
        
        # Add footer
        elements.append(Spacer(1, 20))
        footer_text = f"Confidential - {datetime.now().year} © NED UET"
        elements.append(Paragraph(footer_text, styles['RegisterCell']))
        
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