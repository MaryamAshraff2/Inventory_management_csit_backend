# PDF Export Functionality

## What Happens When You Click "Export PDF"

When you click the PDF export button in the Reports page, the following sequence of events occurs:

### 1. Frontend Process

#### Button Click Event
- The `exportReport('pdf')` function is called
- The system checks if there's report data available (`reportData?.report_id`)
- If no report data exists, an error message is shown: "No report data available for export"
- If report data exists, the export process begins

#### API Call
- The frontend calls `reportsAPI.exportPdf(reportData.report_id)`
- This makes a POST request to: `http://localhost:8000/inventory/reports/{report_id}/export_pdf/`
- The request includes the report ID in the URL

#### File Download Process
- The backend returns a PDF file (not JSON)
- The frontend receives the file as a blob
- A temporary download link is created
- The file is automatically downloaded to your browser's default download folder
- The temporary link is cleaned up

### 2. Backend Process

#### Report Data Retrieval
The backend performs the following steps:

1. **Get Report Object**: Retrieves the report from the database using the provided ID
2. **Extract Filters**: Gets the original filters used to generate the report
3. **Re-run Queries**: Applies the same filters to get the current data
4. **Build Report Data**: Creates a structured data object with all report information

#### PDF Generation
The backend uses the `reportlab` library to generate a professional PDF:

1. **Create PDF Document**: Initializes a new PDF with A4 page size
2. **Add Title**: Creates a centered title (e.g., "Procurement Report")
3. **Add Metadata**: Includes generation date, total records, and summary statistics
4. **Create Data Table**: Generates a formatted table with all report data
5. **Apply Styling**: Adds professional styling with:
   - Grey header background
   - Beige data rows
   - Black borders
   - Centered alignment
   - Proper font sizes

#### File Response
- Creates a unique filename: `{report_type}_report_{report_id}_{timestamp}.pdf`
- Sets proper HTTP headers for file download
- Returns the PDF file as an HTTP response

### 3. PDF Content Structure

#### Header Section
- **Title**: Report type (e.g., "Procurement Report")
- **Generation Date**: When the report was created
- **Total Records**: Number of items in the report
- **Summary Statistics**: 
  - Total Amount (for procurement reports)
  - Total Value (for inventory reports)
  - Total Quantity Discarded (for discarded items reports)

#### Data Table
- **Headers**: Automatically generated from data fields
- **Data Rows**: All filtered data formatted for readability
- **Formatting**:
  - Dates are formatted as YYYY-MM-DD
  - Currency values are formatted with $ and 2 decimal places
  - All text is properly aligned and styled

### 4. Report-Specific Content

#### Procurement Reports
- Order Number, Item Name, Quantity, Unit Price, Total Amount, Supplier, Order Date
- Includes total procurement amount

#### Stock Movement Reports
- Item Name, Quantity, From Location, To Location, Movement Date, Received By, Notes
- Shows movement details between locations

#### Inventory Reports
- Item Name, Category, Quantity, Unit Price, Total Value
- Includes total inventory value

#### Stock Requests Reports
- Item Name, Quantity, Status, Requested By, Created At
- Includes status breakdown (Pending, Approved, Rejected)

#### Discarded Items Reports
- Item Name, Quantity, Reason, Date, Discarded By, Notes
- Includes total quantity discarded

### 5. Error Handling

#### Frontend Errors
- **No Report Data**: "No report data available for export"
- **Network Errors**: "Failed to export PDF: [error message]"
- **Server Errors**: Displays server error messages

#### Backend Errors
- **Report Not Found**: Returns 404 error
- **PDF Generation Errors**: Returns 500 error with details
- **Invalid Report Type**: Handles unknown report types gracefully

### 6. File Download Details

#### Filename Format
```
{report_type}_report_{report_id}_{YYYYMMDD_HHMMSS}.pdf
```

Examples:
- `procurement_report_1_20241201_143022.pdf`
- `stock_movement_report_5_20241201_143045.pdf`

#### Download Location
- Files are downloaded to your browser's default download folder
- Usually: `Downloads/` folder on your computer
- The browser handles the download automatically

### 7. Technical Implementation

#### Backend Dependencies
- **reportlab**: Python library for PDF generation
- **Django**: Web framework for handling requests
- **BytesIO**: For in-memory PDF buffer handling

#### Frontend Dependencies
- **fetch API**: For making HTTP requests
- **Blob API**: For handling file downloads
- **URL.createObjectURL**: For creating temporary download links

### 8. User Experience

#### Before Export
- PDF export button is disabled until report data is available
- User must first generate a report using filters

#### During Export
- Loading state is shown
- Button is disabled to prevent multiple clicks
- Progress is indicated to the user

#### After Export
- PDF file is automatically downloaded
- Success message is logged to console
- User can find the file in their downloads folder
- File can be opened with any PDF viewer

### 9. Example Workflow

1. **Generate Report**: User applies filters and clicks "Apply Filters"
2. **View Data**: Report data is displayed in the table
3. **Export PDF**: User clicks "Export PDF" button
4. **Download**: PDF file is automatically downloaded
5. **Open File**: User opens the PDF file from downloads folder

### 10. File Size and Performance

#### File Size
- Typically 10-50 KB for small reports
- Scales with the number of records
- Optimized for readability and professional appearance

#### Performance
- PDF generation is fast for typical report sizes
- Larger reports may take a few seconds
- Progress is shown to the user during generation

This implementation provides a complete, professional PDF export functionality that creates well-formatted, downloadable reports for all report types in the inventory management system. 