import React from 'react';

const placeholderRows = [
  {
    date: '',
    receivedIssued: '',
    voucherNo: '',
    particulars: '',
    unit: '',
    unitPrice: '',
    totalCost: '',
    quantity: { received: '', issued: '', balance: '' },
    remarks: '',
  },
  // Add more rows as needed
];

function Register({
  documentCode = 'F/SOP/SD 01/52/01',
  itemDescription = '',
  rows = placeholderRows,
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
      {/* Header Section */}
      {/* <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <span className="text-sm font-medium text-gray-700">
            <span className="font-normal">{documentCode}</span>
          </span>
          <h2 className="text-lg font-semibold text-gray-800 mt-2 md:mt-0">
            NED UNIVERSITY OF ENGINEERING AND TECHNOLOGY, KARACHI
          </h2>
        </div>
        <div className="mt-2">
          <span className="text-sm font-medium text-gray-700">
            Item Description: <span className="font-normal italic text-gray-500">{itemDescription || '(Enter description)'}</span>
          </span>
        </div>
      </div> */}
      <div className="mb-6 text-center">
  {/* Document Code - Top-left aligned */}
  <div className="text-left text-sm font-medium text-gray-700 mb-1">
    Document Code: <span className="font-normal">F/SOP/SD 01/52/01</span>
  </div>

  {/* University Name - Large and bold */}
  <h1 className="text-xl font-bold tracking-wide mb-2">
    NED UNIVERSITY OF ENGINEERING AND TECHNOLOGY, KARACHI
  </h1>

  {/* Item Description - Prominent field with underline */}
  <div className="text-lg font-medium border-b-2 border-gray-300 pb-1 inline-block">
    16.2 /250 DESCRIPTION OF ITEM ______
  </div>
</div>
      {/* Register Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-md">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-sm">
              <th className="px-4 py-2 border-b text-center font-semibold">Date</th>
              <th className="px-4 py-2 border-b text-center font-semibold">Received/Issued</th>
              <th className="px-4 py-2 border-b text-center font-semibold">Voucher / Cash Memo /<br />Requisition / Purchase Order No.</th>
              <th className="px-4 py-2 border-b text-center font-semibold">Particulars</th>
              <th className="px-4 py-2 border-b text-center font-semibold">Accounting /<br />Measuring Unit</th>
              <th className="px-4 py-2 border-b text-center font-semibold">Unit Price</th>
              <th className="px-4 py-2 border-b text-center font-semibold">Total Cost<br />(with taxes)</th>
              <th className="px-4 py-2 border-b text-center font-semibold" colSpan={3}>Quantity</th>
              <th className="px-4 py-2 border-b text-center font-semibold">Remarks / Initials of<br />Authorized Persons</th>
            </tr>
            <tr className="bg-gray-50 text-gray-600 text-xs">
              <th colSpan={7}></th>
              <th className="px-2 py-1 border-b text-center font-semibold">Received</th>
              <th className="px-2 py-1 border-b text-center font-semibold">Issued</th>
              <th className="px-2 py-1 border-b text-center font-semibold">Balance</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-blue-50 transition-colors">
                <td className="px-4 py-2 border-b text-center text-gray-700">{row.date}</td>
                <td className="px-4 py-2 border-b text-center text-gray-700">{row.receivedIssued}</td>
                <td className="px-4 py-2 border-b text-center text-gray-700">{row.voucherNo}</td>
                <td className="px-4 py-2 border-b text-center text-gray-700">{row.particulars}</td>
                <td className="px-4 py-2 border-b text-center text-gray-700">{row.unit}</td>
                <td className="px-4 py-2 border-b text-center text-gray-700">{row.unitPrice}</td>
                <td className="px-4 py-2 border-b text-center text-gray-700">{row.totalCost}</td>
                <td className="px-2 py-2 border-b text-center text-gray-700">{row.quantity.received}</td>
                <td className="px-2 py-2 border-b text-center text-gray-700">{row.quantity.issued}</td>
                <td className="px-2 py-2 border-b text-center text-gray-700">{row.quantity.balance}</td>
                <td className="px-4 py-2 border-b text-center text-gray-700">{row.remarks}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-6 text-center text-gray-400">No records available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Register; 