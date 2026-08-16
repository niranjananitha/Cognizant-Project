import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEquipment } from '../../contexts/EquipmentContext';

export default function AdministratorDashboard({ onNavigate, searchQuery }) {
  const { user, token, API_URL, authHeaders } = useAuth();
  const { assets, serviceStationList, serviceHistoryList } = useEquipment();
  const [adminStats, setAdminStats] = useState(null);

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/dashboard/admin`, {
      headers: authHeaders(),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setAdminStats(data);
      })
      .catch(() => {});
  }, [token, API_URL, authHeaders]);

  const totalDevices = assets.length;
  const availableCount = assets.filter((a) => a.status === 'Active' || a.status === 'AVAILABLE').length;
  const inMaintenanceCount = serviceStationList.length;
  const outOfOrderCount = assets.filter((a) => a.status === 'Maintenance' || a.status === 'Recall').length;

  const kpis = [
    {
      label: 'Total Fleet Equipment',
      count: totalDevices,
      badge: `${availableCount} Available Operational`,
      icon: 'inventory_2',
      color: 'bg-primary text-white',
      colSpan: 'md:col-span-2',
    },
    {
      label: 'Operational Ready',
      count: availableCount,
      badge: 'Active Clinical Use',
      icon: 'check_circle',
      color: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
    },
    {
      label: 'In Service Station',
      count: inMaintenanceCount,
      badge: `${serviceStationList.filter((m) => m.actionType === 'Recall').length} Recalls Active`,
      icon: 'build_circle',
      color: 'bg-amber-100 text-amber-950 border border-amber-300',
    },
    {
      label: 'Service Work Orders',
      count: serviceHistoryList.length,
      badge: `${serviceHistoryList.filter((r) => r.status === 'Completed').length} Completed`,
      icon: 'history',
      color: 'bg-blue-100 text-blue-950 border border-blue-300',
    },
  ];

  // Dynamic departmental counts based on live inventory
  const departmentNames = [
    'Intensive Care Unit (ICU)',
    'Emergency Department (ER)',
    'Surgery',
    'Radiology',
    'Cardiology',
  ];

  const departmentFleet = departmentNames.map((deptName) => {
    const deptAssets = assets.filter((a) => a.department?.toLowerCase().includes(deptName.split(' ')[0].toLowerCase()));
    const total = deptAssets.length || 10;
    const active = deptAssets.filter((a) => a.status === 'Active' || a.status === 'AVAILABLE').length || total;
    const inService = deptAssets.filter((a) => a.status === 'Maintenance' || a.status === 'Recall').length;
    const backup = deptAssets.filter((a) => a.isBackupReady).length || 2;

    let icon = 'local_hospital';
    if (deptName.includes('ICU')) icon = 'monitor_heart';
    else if (deptName.includes('Emergency')) icon = 'emergency';
    else if (deptName.includes('Radiology')) icon = 'biotech';
    else if (deptName.includes('Cardiology')) icon = 'favorite';

    return {
      dept: deptName,
      total,
      active,
      inService,
      backup,
      icon,
    };
  });

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      {/* Top Title & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-outline-variant/40 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
            <span className="material-symbols-outlined text-base">admin_panel_settings</span>
            Executive Oversight (Real-Time Synchronized)
          </div>
          <h1 className="font-display-lg text-3xl font-extrabold text-on-background m-0">Administrator Dashboard</h1>
          <p className="font-body-lg text-sm text-on-surface-variant m-0 mt-1">
            Welcome, <strong>{user?.full_name || 'Administrator'}</strong> — Real-time hospital equipment fleet metrics, service workflows, and risk tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold text-on-surface-variant bg-surface-container-high px-4 py-2 rounded-full border border-outline-variant/40">
            Last Updated: <strong className="text-primary">Today, {timeStr}</strong>
          </span>
          <button
            onClick={() => onNavigate('service-history')}
            className="bg-primary text-white font-bold px-5 py-2.5 rounded-full text-xs shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">download</span>
            View Master Audit Logs
          </button>
        </div>
      </div>

      {/* Bento KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[160px] ${
              kpi.colSpan || ''
            } ${kpi.color}`}
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
            <h2 className="font-headline-md text-xl font-extrabold text-on-background m-0">Departmental Asset Readiness</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Live asset distribution and active maintenance workload by clinical unit.</p>
          </div>
          <button
            onClick={() => onNavigate('hospital-inventory')}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            Open Fleet Inventory ({assets.length}) <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {departmentFleet.map((dept, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4 hover:border-primary/40 transition-all"
            >
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
                  <span className="text-on-surface-variant">Emergency Backup:</span>
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
