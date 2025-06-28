# Discard Location Tracking Implementation

## Overview
This update implements proper location tracking for discarded items and ensures that discarded quantities are subtracted from the correct location's available inventory.

## Problem Statement
Previously, the discard functionality had the following issues:
1. The location where the discard happened was not properly stored in the discard table
2. Discarded quantities were subtracted from all TotalInventory records for an item, regardless of location
3. The system did not track which specific location the discard occurred at

## Solution Implemented

### Backend Changes

#### 1. Updated DiscardedItemSerializer (serializers.py)
- **File**: `backend/inventory/serializers.py`
- **Changes**: Modified the `create` method in `DiscardedItemSerializer` to:
  - Use the `location` field from `validated_data` to identify the specific location
  - Filter `TotalInventory` records by both item and location
  - Only subtract quantity from TotalInventory records at the specified location
  - Provide better error messages when insufficient quantity is available at the location
  - Use FIFO (First In, First Out) order when removing quantities from multiple TotalInventory records

#### 2. Updated Reports (reports.py)
- **File**: `backend/inventory/views/reports.py`
- **Changes**: Added location information to discarded items reports:
  - Include `location` field in report data
  - Display location name in generated reports

### Frontend Changes

#### 1. Updated Discarded Items Table (DiscardedItems.jsx)
- **File**: `frontend2/src/pages/DiscardedItems.jsx`
- **Changes**:
  - Added "LOCATION" column to the discarded items table
  - Updated table structure to accommodate the new column
  - Display location information for each discarded item

#### 2. Updated Details Modal (DiscardedItems.jsx)
- **File**: `frontend2/src/pages/DiscardedItems.jsx`
- **Changes**:
  - Added location information to the discard details modal
  - Reorganized the modal layout to include location data

#### 3. Updated Reports Page (Reports.jsx)
- **File**: `frontend2/src/pages/Reports.jsx`
- **Changes**:
  - Added "Location" column to the discarded items report table
  - Display location information in generated reports

## Key Features

### 1. Location-Specific Discarding
- Discards now only affect inventory at the specified location
- Quantities are subtracted from TotalInventory records at the correct location only
- Other locations remain unaffected by the discard operation

### 2. Improved Error Handling
- Better validation to ensure sufficient quantity exists at the specified location
- Clear error messages indicating available quantity vs. requested quantity
- Prevents discarding more than available at a location

### 3. FIFO Inventory Management
- When discarding from multiple TotalInventory records at the same location, quantities are removed in FIFO order
- Ensures proper inventory tracking and audit trail

### 4. Enhanced Reporting
- Location information is now included in all discard-related reports
- Better visibility into where discards are occurring
- Improved audit trail for inventory management

## Database Schema
The `DiscardedItem` model already had the necessary `location` field:
```python
class DiscardedItem(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='discarded_items')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='discarded_items')
    quantity = models.PositiveIntegerField()
    date = models.DateField(auto_now_add=True)
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    discarded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='discarded_items')
    notes = models.TextField(blank=True, null=True)
```

## Testing
A test script has been created to verify the functionality:
- **File**: `test_discard_location.py`
- **Purpose**: Tests that discards properly affect only the specified location
- **Verification**: Ensures quantities are subtracted from the correct location while leaving other locations unaffected

## Benefits
1. **Accurate Inventory Tracking**: Discards now properly reflect the actual location where items were discarded
2. **Better Audit Trail**: Complete visibility into where discards occur
3. **Improved Reporting**: Location-specific discard reports for better decision making
4. **Data Integrity**: Prevents incorrect inventory deductions from wrong locations
5. **User Experience**: Clear feedback on available quantities at specific locations

## Migration Notes
- No database migrations required as the `location` field already exists in the `DiscardedItem` model
- Existing discard records will continue to work with the updated functionality
- The system is backward compatible with existing data 