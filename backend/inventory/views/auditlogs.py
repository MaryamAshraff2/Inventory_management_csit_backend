from rest_framework import generics, filters, views, response
from ..models import AuditLog, User
from ..serializers import AuditLogSerializer
from django_filters.rest_framework import DjangoFilterBackend
from django.http import HttpResponse
import csv
from io import StringIO, BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import os
from django.db import models

class AuditLogListView(generics.ListAPIView):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['action', 'entity_type', 'details', 'performed_by__name']
    filterset_fields = {
        'performed_by': ['exact'],
        'timestamp': ['date__gte', 'date__lte'],
        'action': ['exact'],
        'entity_type': ['exact'],
    }

class AuditLogActionsView(views.APIView):
    def get(self, request):
        actions = AuditLog.objects.values_list('action', flat=True).distinct()
        return response.Response(actions)

class AuditLogEntitiesView(views.APIView):
    def get(self, request):
        entities = AuditLog.objects.values_list('entity_type', flat=True).distinct()
        return response.Response(entities)

class AuditLogUsersView(views.APIView):
    def get(self, request):
        users = User.objects.values('id', 'name')
        return response.Response(list(users))

class AuditLogExportCSVView(views.APIView):
    def get(self, request):
        logs = AuditLog.objects.all()
        action = request.GET.get('action')
        entity_type = request.GET.get('entity_type')
        performed_by = request.GET.get('performed_by')
        search = request.GET.get('search')
        if action:
            logs = logs.filter(action=action)
        if entity_type:
            logs = logs.filter(entity_type=entity_type)
        if performed_by:
            logs = logs.filter(performed_by_id=performed_by)
        if search:
            logs = logs.filter(
                models.Q(action__icontains=search) |
                models.Q(entity_type__icontains=search) |
                models.Q(details__icontains=search) |
                models.Q(performed_by__name__icontains=search)
            )
        # CSV export
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID', 'Action', 'Entity Type', 'Performed By', 'Timestamp', 'Details'])
        for log in logs:
            writer.writerow([
                log.id,
                log.action,
                log.entity_type,
                log.performed_by.name if log.performed_by else '',
                log.timestamp.strftime('%d/%m/%Y, %H:%M:%S'),
                log.details
            ])
        output.seek(0)
        response_csv = HttpResponse(output, content_type='text/csv')
        response_csv['Content-Disposition'] = 'attachment; filename="audit_logs.csv"'
        return response_csv

class AuditLogExportPDFView(views.APIView):
    def get(self, request):
        logs = AuditLog.objects.all()
        action = request.GET.get('action')
        entity_type = request.GET.get('entity_type')
        performed_by = request.GET.get('performed_by')
        search = request.GET.get('search')
        if action:
            logs = logs.filter(action=action)
        if entity_type:
            logs = logs.filter(entity_type=entity_type)
        if performed_by:
            logs = logs.filter(performed_by_id=performed_by)
        if search:
            logs = logs.filter(
                models.Q(action__icontains=search) |
                models.Q(entity_type__icontains=search) |
                models.Q(details__icontains=search) |
                models.Q(performed_by__name__icontains=search)
            )
        # PDF export
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        y = height - 40
        # Add NED logo
        logo_path = os.path.join(os.path.dirname(__file__), '../../../../../frontend2/src/assets/ned.png')
        if os.path.exists(logo_path):
            p.drawImage(ImageReader(logo_path), 40, y-40, width=80, height=40, mask='auto')
            y -= 50
        p.setFont('Helvetica-Bold', 14)
        p.drawString(140, y, 'Audit Logs')
        y -= 30
        p.setFont('Helvetica-Bold', 10)
        headers = ['ID', 'Action', 'Entity Type', 'Performed By', 'Timestamp', 'Details']
        for i, header in enumerate(headers):
            p.drawString(40 + i*90, y, header)
        y -= 20
        p.setFont('Helvetica', 9)
        for log in logs:
            if y < 60:
                p.showPage()
                y = height - 40
            row = [
                str(log.id),
                log.action,
                log.entity_type,
                log.performed_by.name if log.performed_by else '',
                log.timestamp.strftime('%d/%m/%Y, %H:%M:%S'),
                log.details
            ]
            for i, value in enumerate(row):
                p.drawString(40 + i*90, y, str(value)[:20])
            y -= 18
        p.save()
        buffer.seek(0)
        response_pdf = HttpResponse(buffer, content_type='application/pdf')
        response_pdf['Content-Disposition'] = 'attachment; filename="audit_logs.pdf"'
        return response_pdf 