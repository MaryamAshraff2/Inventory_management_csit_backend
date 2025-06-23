#!/usr/bin/env python
"""
Test script for PDF generation functionality
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from inventory.models import Report, Procurement, StockMovement, Item, SendingStockRequest, DiscardedItem
from inventory.views.reports import ReportViewSet
from datetime import datetime, timedelta
from django.utils import timezone

def test_pdf_generation():
    """Test PDF generation with sample data"""
    print("Testing PDF generation...")
    
    # Check if we have any reports
    reports = Report.objects.all()
    print(f"Found {reports.count()} reports in database")
    
    if reports.exists():
        # Test with the first report
        report = reports.first()
        print(f"Testing with report ID: {report.id}, Type: {report.report_type}")
        
        # Create a mock request object
        class MockRequest:
            def __init__(self):
                self.user = None
                self.data = {}
        
        mock_request = MockRequest()
        
        # Create a viewset instance and set up the kwargs
        viewset = ReportViewSet()
        viewset.kwargs = {'pk': report.id}
        viewset.request = mock_request
        
        try:
            # Test PDF generation
            print("Attempting to generate PDF...")
            response = viewset.export_pdf(mock_request, pk=report.id)
            print(f"PDF generation response status: {response.status_code}")
            if hasattr(response, 'content'):
                print(f"PDF content length: {len(response.content)} bytes")
        except Exception as e:
            print(f"Error generating PDF: {str(e)}")
            import traceback
            traceback.print_exc()
    else:
        print("No reports found in database. Creating a test report...")
        
        # Create a test report
        test_report = Report.objects.create(
            report_type='inventory',
            filters={},
            generated_by=None
        )
        print(f"Created test report with ID: {test_report.id}")
        
        # Test PDF generation with the test report
        class MockRequest:
            def __init__(self):
                self.user = None
                self.data = {}
        
        mock_request = MockRequest()
        viewset = ReportViewSet()
        viewset.kwargs = {'pk': test_report.id}
        viewset.request = mock_request
        
        try:
            response = viewset.export_pdf(mock_request, pk=test_report.id)
            print(f"PDF generation response status: {response.status_code}")
            if hasattr(response, 'content'):
                print(f"PDF content length: {len(response.content)} bytes")
        except Exception as e:
            print(f"Error generating PDF: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    test_pdf_generation() 