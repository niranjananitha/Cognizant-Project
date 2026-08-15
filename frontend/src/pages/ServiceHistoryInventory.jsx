import React, { useState } from 'react';

export default function ServiceHistoryInventory({ onNavigate, searchQuery, onViewDetail }) {
  const [statusFilter, setStatusFilter] = useState('');

  const serviceRecords = [
    {
      workOrder: 'WO-2023-8821',
      assetId: 'AST-8821-V',
      equipment: 'Respironics V60 Ventilator',
      serviceType: 'Preventative Maintenance',
      technician: 'J. Miller (Senior Technician)',
      date: '14 Oct 2023',
      cost: '$450.00',
      status: 'Completed',
    },
    {
      workOrder: 'WO-2023-7104',
      assetId: 'MRI-102',
      equipment: 'Siemens Magnetom MRI',
      serviceType: 'Cooling Loop Overhaul',
      technician: 'J. Miller (Senior Technician)',
      date: '10 Apr 2023',
      cost: '$2,850.00',
      status: 'Completed',
    },
    {
      workOrder: 'WO-2023-5590',
      assetId: 'DEF-402-B',
      equipment: 'Mindray BeneHeart D3 Defibrillator',
      serviceType: 'Capacitor & Battery Calibration',
      technician: 'J. Miller (Senior Technician)',
      date: '05 Sep 2023',
      cost: '$180.00',
      status: 'In Progress',
    },
    {
      workOrder: 'WO-2023-4100',
      assetId: 'MX700-04',
      equipment: 'Philips IntelliVue MX700 Monitor',
      serviceType: 'Touchscreen Digitizer Repair',
      technician: 'J. Miller (Senior Technician)',
      date: '01 Aug 2023',
      cost: '$620.00',
      status: 'Completed',
    },
    {
      workOrder: 'WO-2023-3301',
      assetId: 'INF-3301-P',
      equipment: 'Alaris System Infusion Pump',
      serviceType: 'Occlusion Sensor Calibration',
      technician: 'J. Miller (Senior Technician)',
      date: '12 Jul 2023',
      cost: '$290.00',
      status: 'Completed',
    },
  ];

  const filteredRecords = serviceRecords.filter((record) => {
    const matchSearch =
      !searchQuery ||
      record.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.workOrder.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.technician.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = !statusFilter || record.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const handleRecordClick = (record) => {
    if (onViewDetail) {
      onViewDetail(record);
    } else {
      onNavigate('service-detail');
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/40 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
            <span className="material-symbols-outlined text-base">history</span>
            Maintenance Logs & Records
          </div>
          <h1 className="font-display-lg text-3xl font-extrabold text-on-background mt-1 m-0">Service History Log</h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-1">
            Complete audit trail of all maintenance work orders, machine timelines, and technician log records.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-xs font-bold text-on-surface focus:outline-none focus:border-primary shadow-sm cursor-pointer"
          >
            <option value="">All Service Statuses</option>
            <option value="completed">Completed</option>
            <option value="in progress">In Progress</option>
          </select>
        </div>
      </div>

      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Work Orders</div>
          <div className="text-3xl font-extrabold text-primary mt-2">1,482</div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Completed This Quarter</div>
          <div className="text-3xl font-extrabold text-secondary mt-2">324</div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Active Work Orders</div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">14</div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total YTD Maintenance Cost</div>
          <div className="text-3xl font-extrabold text-on-surface mt-2">$84,500</div>
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
              <th className="p-4">Completion Date</th>
              <th className="p-4">Cost</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 text-sm font-body-md">
            {filteredRecords.map((record) => (
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
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      record.status === 'Completed'
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
