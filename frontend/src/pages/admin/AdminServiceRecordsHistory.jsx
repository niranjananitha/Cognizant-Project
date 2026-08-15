import React, { useState } from 'react';

export default function AdminServiceRecordsHistory({ onNavigate, searchQuery, onViewDetail }) {
  const [statusFilter, setStatusFilter] = useState('');

  const records = [
    {
      workOrder: 'WO-2023-8821',
      assetId: 'VEN-2023-8472',
      equipment: 'Respironics V60 Ventilator',
      serviceType: 'Preventative Maintenance',
      technician: 'J. Miller',
      date: '14 Oct 2023',
      cost: '$450.00',
      status: 'Completed',
    },
    {
      workOrder: 'WO-2023-7104',
      assetId: 'MRI-102',
      equipment: 'Siemens Magnetom MRI',
      serviceType: 'Cooling Loop Overhaul',
      technician: 'R. Davis',
      date: '10 Apr 2023',
      cost: '$2,850.00',
      status: 'Completed',
    },
    {
      workOrder: 'WO-2023-5590',
      assetId: 'DEF-402-B',
      equipment: 'Mindray BeneHeart D3 Defibrillator',
      serviceType: 'Capacitor Calibration',
      technician: 'S. Chen',
      date: '05 Sep 2023',
      cost: '$180.00',
      status: 'In Progress',
    },
    {
      workOrder: 'WO-2023-4100',
      assetId: 'MX700-04',
      equipment: 'Philips IntelliVue MX700 Monitor',
      serviceType: 'Touchscreen Digitizer Repair',
      technician: 'J. Miller',
      date: '01 Aug 2023',
      cost: '$620.00',
      status: 'Completed',
    },
  ];

  const filteredRecords = records.filter((r) => {
    const matchSearch =
      !searchQuery ||
      r.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.workOrder.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.technician.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = !statusFilter || r.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/40 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
            <span className="material-symbols-outlined text-base">history_edu</span>
            Audit & Compliance Log
          </div>
          <h1 className="font-display-lg text-3xl font-extrabold text-on-background m-0">Service Records History</h1>
          <p className="font-body-md text-sm text-on-surface-variant m-0 mt-1">
            Complete executive audit trail of hospital equipment service contracts, work orders, and financial expenditure.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-xs font-bold text-on-surface focus:outline-none focus:border-primary shadow-sm cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Work Orders Executed</div>
          <div className="text-3xl font-extrabold text-primary mt-2">1,482 Logs</div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total YTD Maintenance Expenditure</div>
          <div className="text-3xl font-extrabold text-secondary mt-2">$84,500</div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Vendor Compliance Rate</div>
          <div className="text-3xl font-extrabold text-emerald-700 mt-2">98.4%</div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low text-xs text-on-surface-variant uppercase font-bold border-b border-outline-variant/40">
            <tr>
              <th className="p-4">Work Order</th>
              <th className="p-4">Equipment & Asset ID</th>
              <th className="p-4">Service Type</th>
              <th className="p-4">Technician</th>
              <th className="p-4">Date</th>
              <th className="p-4">Cost</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 text-sm font-body-md">
            {filteredRecords.map((r) => (
              <tr
                key={r.workOrder}
                onClick={() => onViewDetail && onViewDetail(r)}
                className="hover:bg-surface-container-low/60 transition-colors cursor-pointer group"
              >
                <td className="p-4 font-mono font-bold text-primary text-xs">{r.workOrder}</td>
                <td className="p-4">
                  <div className="font-bold text-on-surface group-hover:text-primary transition-colors">{r.equipment}</div>
                  <div className="text-xs font-mono text-on-surface-variant">{r.assetId}</div>
                </td>
                <td className="p-4 text-xs font-semibold text-on-surface">{r.serviceType}</td>
                <td className="p-4 text-xs font-medium text-on-surface">{r.technician}</td>
                <td className="p-4 text-xs text-on-surface-variant font-mono">{r.date}</td>
                <td className="p-4 text-xs font-mono font-bold text-primary">{r.cost}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      r.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onViewDetail) onViewDetail(r);
                    }}
                    className="text-xs font-bold text-secondary hover:underline bg-surface px-3 py-1.5 rounded-lg border border-outline-variant/40"
                  >
                    View Admin Detail
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
