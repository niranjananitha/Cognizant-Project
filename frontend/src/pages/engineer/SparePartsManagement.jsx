import React, { useState } from 'react';

export default function SparePartsManagement({ searchQuery }) {
  const [parts, setParts] = useState([
    { id: 'PRT-FLT-99', name: 'Air Intake HEPA Filter Kit', category: 'Ventilators', partNo: 'V60-FLT-99', stock: 12, minStock: 5, unitCost: '$45.00', status: 'In Stock' },
    { id: 'PRT-O2-01', name: 'O2 Galvano Sensor Cell', category: 'Ventilators', partNo: 'V60-O2-01', stock: 2, minStock: 4, unitCost: '$120.00', status: 'Low Stock' },
    { id: 'PRT-BAT-14', name: 'Li-ion Backup Battery Pack 14.8V', category: 'Monitors', partNo: 'MX700-BAT-14', stock: 6, minStock: 3, unitCost: '$210.00', status: 'In Stock' },
    { id: 'PRT-DIG-04', name: 'Touchscreen Digitizer Glass', category: 'Monitors', partNo: 'MX700-DIG-04', stock: 1, minStock: 2, unitCost: '$380.00', status: 'Low Stock' },
    { id: 'PRT-CAP-09', name: 'Biphasic Capacitor Discharge Module', category: 'Defibrillators', partNo: 'D3-CAP-09', stock: 4, minStock: 2, unitCost: '$550.00', status: 'In Stock' },
  ]);

  const filteredParts = parts.filter((item) =>
    !searchQuery ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.partNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto">
      {/* Title */}
      <div className="flex flex-col gap-2 border-b border-outline-variant/40 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
          <span className="material-symbols-outlined text-base">settings_input_component</span>
          Biomedical Inventory Catalog
        </div>
        <h1 className="font-display-lg text-3xl font-extrabold text-on-background m-0">Spare Parts Management</h1>
        <p className="font-body-md text-sm text-on-surface-variant m-0">
          Monitor medical spare parts inventory, re-order thresholds, and component procurement.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Cataloged Parts</div>
          <div className="text-4xl font-extrabold text-primary mt-2">148 SKUs</div>
        </div>
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-300 shadow-sm">
          <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">Low Stock Alerts</div>
          <div className="text-4xl font-extrabold text-amber-700 mt-2">3 SKUs</div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Parts Order Value (YTD)</div>
          <div className="text-4xl font-extrabold text-secondary mt-2">$24,800</div>
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low text-xs text-on-surface-variant uppercase font-bold border-b border-outline-variant/40">
            <tr>
              <th className="p-4">SKU & Part Name</th>
              <th className="p-4">Part Number</th>
              <th className="p-4">Equipment Category</th>
              <th className="p-4">Stock Level</th>
              <th className="p-4">Unit Cost</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 text-sm font-body-md">
            {filteredParts.map((part) => (
              <tr key={part.id} className="hover:bg-surface-container-low/60 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-on-surface">{part.name}</div>
                  <div className="text-xs font-mono text-primary font-semibold">{part.id}</div>
                </td>
                <td className="p-4 text-xs font-mono font-bold text-on-surface">{part.partNo}</td>
                <td className="p-4 text-xs font-bold text-on-surface">{part.category}</td>
                <td className="p-4 text-xs font-mono font-bold text-on-surface">
                  {part.stock} units <span className="text-on-surface-variant text-[11px] font-normal">(Min: {part.minStock})</span>
                </td>
                <td className="p-4 text-xs font-mono font-bold text-primary">{part.unitCost}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      part.status === 'Low Stock'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {part.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-xs font-bold text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg shadow">
                    Re-order Stock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
