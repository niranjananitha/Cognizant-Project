import React from 'react';
import { machineImages } from '../../assets/images';

export default function AdministratorDashboard({ onNavigate, searchQuery }) {
  const kpis = [
    { label: 'Total Equipment', count: 250, badge: '+12 this month', icon: 'inventory_2', color: 'bg-primary text-white', colSpan: 'md:col-span-2' },
    { label: 'Available', count: 215, badge: 'Operational', icon: 'check_circle', color: 'bg-emerald-100 text-emerald-950 border border-emerald-300' },
    { label: 'In Maintenance', count: 25, badge: 'Service Station', icon: 'build_circle', color: 'bg-amber-100 text-amber-950 border border-amber-300' },
    { label: 'Out of Order', count: 10, badge: 'Backup Ready: 8', icon: 'error', color: 'bg-error-container text-on-error-container border border-error-container' },
  ];

  const departmentFleet = [
    { dept: 'Intensive Care Unit (ICU)', total: 68, active: 62, inService: 4, backup: 2, icon: 'monitor_heart' },
    { dept: 'Emergency Department (ER)', total: 54, active: 48, inService: 5, backup: 1, icon: 'emergency' },
    { dept: 'Operating Rooms (OR)', total: 45, active: 41, inService: 3, backup: 1, icon: 'local_hospital' },
    { dept: 'Radiology & Imaging', total: 38, active: 34, inService: 3, backup: 1, icon: 'biotech' },
    { dept: 'Cardiology Center', total: 45, active: 40, inService: 4, backup: 1, icon: 'favorite' },
  ];

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      {/* Top Title & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-outline-variant/40 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
            <span className="material-symbols-outlined text-base">admin_panel_settings</span>
            Executive Oversight
          </div>
          <h1 className="font-display-lg text-3xl font-extrabold text-on-background m-0">Administrator Dashboard</h1>
          <p className="font-body-lg text-sm text-on-surface-variant m-0 mt-1">
            Real-time hospital equipment inventory status, operational readiness, and service metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-on-surface-variant bg-surface-container-high px-4 py-2 rounded-full border border-outline-variant/40">
            Last Updated: <strong className="text-primary">Today, 09:30 AM</strong>
          </span>
          <button className="bg-primary text-white font-bold px-5 py-2.5 rounded-full text-xs shadow-md hover:bg-primary/90 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-base">download</span>
            Generate Executive Report
          </button>
        </div>
      </div>

      {/* Bento KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[160px] ${kpi.colSpan || ''} ${kpi.color}`}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-extrabold uppercase tracking-wider">{kpi.label}</span>
              <span className="material-symbols-outlined text-2xl">{kpi.icon}</span>
            </div>
            <div className="mt-4">
              <span className="text-5xl font-extrabold tracking-tight">{kpi.count}</span>
              <span className="block text-xs font-bold mt-1 opacity-90">{kpi.badge}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Department Distribution Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline-md text-xl font-extrabold text-on-background m-0">Departmental Asset Distribution</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Asset readiness and active maintenance workload by clinical unit.</p>
          </div>
          <button
            onClick={() => onNavigate('equipment-overview')}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            View Full Equipment Overview <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {departmentFleet.map((dept, i) => (
            <div key={i} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4 hover:border-primary/40 transition-all">
              <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">{dept.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-xs text-on-surface m-0 line-clamp-1">{dept.dept}</h3>
                  <span className="text-[11px] font-mono text-primary font-bold">{dept.total} Total Devices</span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-medium text-on-surface">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Active Operational:</span>
                  <strong className="text-emerald-700">{dept.active}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">In Maintenance:</span>
                  <strong className="text-amber-700">{dept.inService}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Backup Standby:</span>
                  <strong className="text-blue-700">{dept.backup}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
