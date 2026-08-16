import React, { useState } from 'react';
import { useEquipment } from '../contexts/EquipmentContext';

export default function ServiceHistoryInventory({ onNavigate, searchQuery, onViewDetail }) {
  const { serviceHistoryList } = useEquipment();
  const [statusFilter, setStatusFilter] = useState('');

  const filteredRecords = serviceHistoryList.filter((record) => {
    const matchSearch =
      !searchQuery ||
      record.equipment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.workOrder?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.assetId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.technician?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = !statusFilter || record.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const handleRecordClick = (record) => {
    if (onViewDetail) {
      onViewDetail(record);
    } else {
      onNavigate('service-detail');
    }
  };

  const completedCount = serviceHistoryList.filter((r) => r.status === 'Completed').length;
  const inProgressCount = serviceHistoryList.filter((r) => r.status !== 'Completed').length;

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/40 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
            <span className="material-symbols-outlined text-base">history</span>
            Maintenance Logs & Service Records
          </div>
          <h1 className="font-display-lg text-3xl font-extrabold text-on-background mt-1 m-0">Service History Log</h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-1">
            Complete audit trail of all maintenance work orders, completed repairs, machine timelines, and technician log records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-xs font-bold text-on-surface focus:outline-none focus:border-primary shadow-sm cursor-pointer"
          >
            <option value="">All Service Statuses</option>
            <option value="completed">Completed ({completedCount})</option>
            <option value="in progress">In Progress ({inProgressCount})</option>
          </select>
        </div>
      </div>

      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Work Orders</div>
          <div className="text-3xl font-extrabold text-primary mt-2">{serviceHistoryList.length}</div>
          <div className="text-xs text-on-surface-variant font-medium mt-1">Lifetime service logs recorded</div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Completed Services</div>
          <div className="text-3xl font-extrabold text-emerald-700 mt-2">{completedCount}</div>
          <div className="text-xs text-emerald-800 font-medium mt-1">Passed clinical clearance</div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">Active / Delayed In-Progress</div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">{inProgressCount}</div>
          <div className="text-xs text-amber-800 font-medium mt-1">Work orders pending clearance</div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total YTD Maintenance Cost</div>
          <div className="text-3xl font-extrabold text-on-surface mt-2">$24,650</div>
          <div className="text-xs text-on-surface-variant font-medium mt-1">Hospital equipment maintenance</div>
        </div>
      </div>

      {/* Service Records Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low text-xs text-on-surface-variant uppercase font-bold border-b border-outline-variant/40">
            <tr>
              <th className="p-4">Work Order</th>
              <th className="p-4">Asset ID & Equipment</th>
              <th className="p-4">Service Type</th>
              <th className="p-4">Technician</th>
              <th className="p-4">Logged Date</th>
              <th className="p-4">Cost</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 text-sm font-body-md">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <tr
                  key={record.workOrder}
                  onClick={() => handleRecordClick(record)}
                  className="hover:bg-surface-container-low/60 transition-colors cursor-pointer group"
                >
                  <td className="p-4 font-mono font-bold text-primary text-xs">{record.workOrder}</td>
                  <td className="p-4">
                    <div className="font-bold text-on-surface group-hover:text-primary transition-colors">{record.equipment}</div>
                    <div className="text-xs font-mono text-on-surface-variant">{record.assetId}</div>
                  </td>
                  <td className="p-4 text-xs font-semibold text-on-surface">{record.serviceType}</td>
                  <td className="p-4 text-xs font-medium text-on-surface">{record.technician}</td>
                  <td className="p-4 text-xs text-on-surface-variant font-mono">{record.date}</td>
                  <td className="p-4 text-xs font-mono font-bold text-on-surface">{record.cost}</td>
                  <td className="p-4">
                    <span
                      className={`whitespace-nowrap inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${record.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecordClick(record);
                      }}
                      className="text-xs font-bold text-secondary hover:underline bg-surface px-3 py-1.5 rounded-lg border border-outline-variant/40"
                    >
                      View Machine Timeline
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="p-8 text-center text-on-surface-variant text-sm font-medium">
                  No service records matched the selected filter or search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
