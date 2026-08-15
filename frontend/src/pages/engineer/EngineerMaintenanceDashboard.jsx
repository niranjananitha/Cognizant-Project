import React from 'react';
import { machineImages } from '../../assets/images';

export default function EngineerMaintenanceDashboard({ onNavigate, searchQuery, onOpenMachineWorkspace }) {
  const kpiData = [
    { label: 'My Service Requests', count: 14, subtitle: 'Active Work Orders', color: 'bg-primary text-white border border-primary/30', textColor: 'text-white', icon: 'assignment_ind' },
    { label: 'High Priority Tickets', count: 4, subtitle: 'Urgent Overhaul Required', color: 'bg-error-container text-on-error-container border border-error-container', textColor: 'text-on-error-container', icon: 'warning' },
    { label: 'Pending Calibrations', count: 6, subtitle: 'PM Inspection Due', color: 'bg-amber-100 text-amber-950 border border-amber-300', textColor: 'text-amber-950', icon: 'speed' },
    { label: 'Spare Parts Alert', count: 3, subtitle: 'Low Stock Items', color: 'bg-purple-100 text-purple-950 border border-purple-300', textColor: 'text-purple-950', icon: 'settings_input_component' },
  ];

  const activeWorkOrders = [
    {
      id: 'WO-VENT-024',
      assetId: 'VEN-2023-8472',
      name: 'Respironics V60 Ventilator',
      category: 'Ventilators',
      dept: 'Intensive Care (ICU Bed 04)',
      issue: 'Compressor bearing vibration & pressure valve drift',
      priority: 'High',
      status: 'In Progress',
      assignedTo: 'J. Miller (Senior Technician)',
      img: machineImages.ventilator,
    },
    {
      id: 'WO-MON-012',
      assetId: 'MX700-04',
      name: 'IntelliVue MX700 Monitor',
      category: 'Patient Monitors',
      dept: 'Intensive Care (ICU Bed 01)',
      issue: 'Touchscreen digitizer calibration failure',
      priority: 'Medium',
      status: 'Pending Parts',
      assignedTo: 'J. Miller (Senior Technician)',
      img: machineImages.monitor,
    },
    {
      id: 'WO-DEF-009',
      assetId: 'DEF-402-B',
      name: 'BeneHeart D3 Defibrillator',
      category: 'Defibrillators',
      dept: 'Emergency (ER Bay 02)',
      issue: 'Capacitor safety recall firmware update',
      priority: 'Critical',
      status: 'Queued',
      assignedTo: 'J. Miller (Senior Technician)',
      img: machineImages.defibrillator,
    },
    {
      id: 'WO-MRI-003',
      assetId: 'MRI-102',
      name: 'Siemens Magnetom 3.0T MRI',
      category: 'Imaging Systems',
      dept: 'Radiology Room 102A',
      issue: 'Cryo chiller compressor pressure alert',
      priority: 'High',
      status: 'Diagnostics',
      assignedTo: 'J. Miller (Senior Technician)',
      img: machineImages.mri,
    },
  ];

  const filteredWorkOrders = activeWorkOrders.filter((item) =>
    !searchQuery ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-2 border-b border-outline-variant/40 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
          <span className="material-symbols-outlined text-base">engineering</span>
          Senior Technician Workspace
        </div>
        <h1 className="font-display-lg text-3xl font-extrabold text-on-background m-0">Good Morning, J. Miller</h1>
        <p className="font-body-lg text-sm text-on-surface-variant m-0">
          Senior technician maintenance workload, active repair queues, and diagnostic tickets.
        </p>
      </div>

      {/* Bento KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[150px] ${kpi.color}`}
          >
            <div className="flex justify-between items-start">
              <span className={`text-xs font-extrabold uppercase tracking-wider ${kpi.textColor}`}>{kpi.label}</span>
              <span className={`material-symbols-outlined text-2xl ${kpi.textColor}`}>{kpi.icon}</span>
            </div>
            <div className="mt-4">
              <span className={`text-4xl font-extrabold ${kpi.textColor}`}>{kpi.count}</span>
              <span className={`block text-xs font-bold mt-1 ${kpi.textColor} opacity-90`}>{kpi.subtitle}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Engineering Work Queue Table */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline-md text-xl font-extrabold text-on-background m-0">Active Maintenance Work Orders</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Assigned work orders requiring engineering inspection, overhaul, or parts replacement.</p>
          </div>
          <button
            onClick={() => onNavigate('service-requests')}
            className="bg-gradient-to-r from-primary to-secondary text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-lg">medical_services</span>
            View Service Requests
          </button>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low text-xs text-on-surface-variant uppercase font-bold border-b border-outline-variant/40">
              <tr>
                <th className="p-4">Work Order & Equipment</th>
                <th className="p-4">Location / Department</th>
                <th className="p-4">Reported Issue</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4">Assigned Tech</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-sm font-body-md">
              {filteredWorkOrders.map((wo) => (
                <tr
                  key={wo.id}
                  onClick={() => onOpenMachineWorkspace && onOpenMachineWorkspace(wo)}
                  className="hover:bg-surface-container-low/60 transition-colors cursor-pointer group"
                >
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface border border-outline-variant/40 p-1 flex items-center justify-center shrink-0">
                      <img src={wo.img} alt={wo.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div>
                      <div className="font-bold text-on-surface group-hover:text-primary transition-colors">{wo.name}</div>
                      <div className="text-xs font-mono text-primary font-semibold">{wo.id} • {wo.assetId}</div>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-semibold text-on-surface max-w-xs">{wo.dept}</td>
                  <td className="p-4 text-xs text-on-surface-variant max-w-xs font-medium line-clamp-2">{wo.issue}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                        wo.priority === 'Critical'
                          ? 'bg-error-container text-on-error-container border border-error-container'
                          : wo.priority === 'High'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-blue-100 text-blue-900 border border-blue-300'
                      }`}
                    >
                      {wo.priority}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-surface-container text-on-surface text-xs font-bold rounded-lg font-mono">
                      {wo.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-medium text-on-surface">{wo.assignedTo}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenMachineWorkspace) onOpenMachineWorkspace(wo);
                      }}
                      className="text-xs font-bold text-secondary hover:underline bg-surface px-3 py-1.5 rounded-lg border border-outline-variant/40"
                    >
                      Open Workspace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
