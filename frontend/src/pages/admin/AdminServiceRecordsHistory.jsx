import React, { useState } from 'react';
import { useEquipment } from '../../contexts/EquipmentContext';

export default function AdminServiceRecordsHistory({ onNavigate, searchQuery, onViewDetail }) {
  const { serviceHistoryList } = useEquipment();
  const [statusFilter, setStatusFilter] = useState('');

  const filteredRecords = serviceHistoryList.filter((r) => {
    const matchSearch =
      !searchQuery ||
      r.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.workOrder.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.technician.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = !statusFilter || r.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-200 text-slate-800">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-primary uppercase tracking-widest">
            <span className="material-symbols-outlined text-[16px]">history_edu</span>
            Audit & Compliance Log
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 m-0 tracking-tight mt-1">Service Records History</h1>
          <p className="text-[14px] text-slate-500 m-0 mt-1 font-medium">
            Complete executive audit trail of hospital equipment service contracts, work orders, and compliance.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-700 focus:outline-none focus:border-primary shadow-sm cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Work Orders Executed</div>
          <div className="text-3xl font-semibold text-primary mt-1">{serviceHistoryList.length} Logs</div>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Completed Services</div>
          <div className="text-3xl font-semibold text-slate-800 mt-1">
            {serviceHistoryList.filter(r => r.status === 'Completed').length}
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Vendor Compliance Rate</div>
          <div className="text-3xl font-semibold text-emerald-700 mt-1">98.4%</div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 text-[11px] text-slate-500 uppercase font-semibold border-b border-slate-100">
            <tr>
              <th className="p-4 pl-6">Work Order</th>
              <th className="p-4">Equipment & Asset ID</th>
              <th className="p-4">Service Type</th>
              <th className="p-4">Technician</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 pr-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-[13px] font-medium text-slate-700">
            {filteredRecords.map((r) => (
              <tr
                key={r.workOrder}
                onClick={() => onViewDetail && onViewDetail(r)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                <td className="p-4 pl-6 font-mono font-semibold text-primary text-[12px]">{r.workOrder}</td>
                <td className="p-4">
                  <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors">{r.equipment}</div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">{r.assetId}</div>
                </td>
                <td className="p-4 text-[12px] text-slate-600">{r.serviceType}</td>
                <td className="p-4 text-[12px] text-slate-600">{r.technician}</td>
                <td className="p-4 text-[12px] text-slate-500 font-mono">{r.date}</td>
                <td className="p-4">
                  <span
                    className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                      r.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50'
                        : 'bg-amber-50 text-amber-700 border border-amber-100/50'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="p-4 pr-6 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onViewDetail) onViewDetail(r);
                    }}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors whitespace-nowrap"
                  >
                    View Machine Timeline
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
