import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEquipment } from '../contexts/EquipmentContext';

export default function ClinicalDashboard({ onNavigate, searchQuery }) {
  const { user, token, API_URL, authHeaders } = useAuth();
  const { assets, serviceStationList, serviceHistoryList } = useEquipment();
  const [backendStats, setBackendStats] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/dashboard/clinical`, {
      headers: authHeaders(),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setBackendStats(data);
      })
      .catch(() => {});
  }, [token, API_URL, authHeaders]);

  const categoryConfig = [
    { name: 'Ventilators', icon: 'air', color: 'text-sky-600 bg-sky-50/50 border-sky-100', desc: 'Critical care & respiratory fleet' },
    { name: 'Patient Monitors', icon: 'monitor_heart', color: 'text-indigo-600 bg-indigo-50/50 border-indigo-100', desc: 'ICU & bedside telemetry units' },
    { name: 'Defibrillators', icon: 'ecg_heart', color: 'text-rose-600 bg-rose-50/50 border-rose-100', desc: 'Resuscitation & cardiac response' },
    { name: 'Infusion Pumps', icon: 'vaccines', color: 'text-teal-600 bg-teal-50/50 border-teal-100', desc: 'Smart IV medication delivery' },
    { name: 'Imaging Systems', icon: 'radiology', color: 'text-purple-600 bg-purple-50/50 border-purple-100', desc: 'MRI, X-Ray & Ultrasound units' },
  ];

  const categories = categoryConfig.map((cfg) => {
    const catAssets = assets.filter((a) => a.category?.toLowerCase().includes(cfg.name.toLowerCase().split(' ')[0]));
    const total = catAssets.length || 2;
    const available = catAssets.filter((a) => a.status === 'Active' || a.status === 'AVAILABLE').length;
    const inService = catAssets.filter((a) => a.status === 'Maintenance' || a.status === 'Recall').length;
    const avgHealth = total > 0 ? Math.round(catAssets.reduce((acc, curr) => acc + (curr.health || 95), 0) / total) : 95;

    return {
      name: cfg.name,
      icon: cfg.icon,
      color: cfg.color,
      desc: cfg.desc,
      total,
      available,
      maintenance: inService,
      health: avgHealth,
      healthStr: `${avgHealth}%`,
    };
  });

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const atRiskCount = assets.filter((a) => (a.health && a.health < 80) || a.status === 'Maintenance').length;
  const maintenanceCount = serviceStationList.filter((m) => m.actionType === 'Service').length;
  const recallCount = serviceStationList.filter((m) => m.actionType === 'Recall').length;
  const backupCount = assets.filter((a) => a.isBackupReady).length;
  const availableCount = assets.filter((a) => a.status === 'Active' || a.status === 'AVAILABLE').length;

  const recentRequests = [
    ...serviceStationList.slice(0, 4).map((item) => ({
      id: item.id,
      asset: item.name,
      issue: item.reason,
      priority: item.priority || 'High',
      date: item.sentDate,
      type: item.actionType,
    })),
    ...serviceHistoryList.slice(0, 2).map((item) => ({
      id: item.workOrder,
      asset: item.equipment,
      issue: item.serviceType,
      priority: 'Normal',
      date: item.date,
      type: 'Completed',
    })),
  ].slice(0, 5);

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1600px] mx-auto animate-in fade-in duration-300 font-sans text-slate-800">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-6 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
            <span className="material-symbols-outlined text-[14px]">verified</span>
            Clinical Operations Overview
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 m-0">
            Welcome back, {user?.full_name || 'Niranjan'}
          </h1>
          <p className="text-sm text-slate-500 m-0 font-medium">
            Here's the real-time status of your medical equipment fleet and active service workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('health-assessment')}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2.5 rounded-xl text-sm shadow-sm transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">psychology</span>
            Run Diagnostics
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        <div
          onClick={() => onNavigate('health-assessment')}
          className="bg-white p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">At Risk</span>
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-500 text-sm group-hover:scale-110 transition-transform">warning</span>
            </div>
          </div>
          <div>
            <span className="text-3xl font-semibold text-slate-800">{atRiskCount}</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('service-station')}
          className="bg-white p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In Service</span>
            <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-sky-500 text-sm group-hover:scale-110 transition-transform">build</span>
            </div>
          </div>
          <div>
            <span className="text-3xl font-semibold text-slate-800">{maintenanceCount}</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('service-station')}
          className="bg-white p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Recall</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-500 text-sm group-hover:scale-110 transition-transform">assignment_return</span>
            </div>
          </div>
          <div>
            <span className="text-3xl font-semibold text-slate-800">{recallCount}</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('hospital-inventory')}
          className="bg-white p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Backup Ready</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-500 text-sm group-hover:scale-110 transition-transform">shield_with_heart</span>
            </div>
          </div>
          <div>
            <span className="text-3xl font-semibold text-slate-800">{backupCount}</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('hospital-inventory')}
          className="bg-white p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-slate-100 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Available Fleet</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500 text-sm group-hover:scale-110 transition-transform">check_circle</span>
            </div>
          </div>
          <div>
            <span className="text-3xl font-semibold text-slate-800">{availableCount}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 m-0">
                Fleet Category Health Overview
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Monitor operational readiness and average telemetry index by department.
              </p>
            </div>
            <button
              onClick={() => onNavigate('hospital-inventory')}
              className="text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-slate-200"
            >
              View Full Inventory →
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 text-[11px] text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-4 text-center">Total</th>
                  <th className="py-4 px-4 text-center">Available</th>
                  <th className="py-4 px-4 text-center">In Service</th>
                  <th className="py-4 px-6">Health Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredCategories.map((cat, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cat.color}`}>
                          <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{cat.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{cat.desc}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="font-medium text-slate-700">{cat.total}</span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium text-[13px]">
                        {cat.available}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md font-medium text-[13px] ${
                          cat.maintenance > 0
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        {cat.maintenance}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-2 w-full max-w-[200px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-600">
                            {cat.health > 85 ? 'Optimal' : cat.health > 70 ? 'Normal' : 'Attention'}
                          </span>
                          <span className="font-semibold text-slate-900">{cat.healthStr}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              cat.health > 85
                                ? 'bg-emerald-500'
                                : cat.health > 70
                                ? 'bg-sky-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${cat.health}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 m-0">
              Active Service Activity
            </h2>
            <button
              onClick={() => onNavigate('service-station')}
              className="text-[13px] font-medium text-sky-600 hover:text-sky-700 transition-colors"
            >
              View All ({serviceStationList.length})
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
            {recentRequests.length > 0 ? (
              recentRequests.map((req, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigate('service-station')}
                  className="p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100 flex flex-col gap-2 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-500">{req.id}</span>
                    <span className="text-slate-400">{req.date}</span>
                  </div>
                  <span className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors text-[15px]">
                    {req.asset}
                  </span>
                  <p className="text-sm text-slate-500 line-clamp-1">{req.issue}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-medium tracking-wide ${
                        req.type === 'Recall'
                          ? 'bg-amber-50 text-amber-700'
                          : req.type === 'Replaced'
                          ? 'bg-purple-50 text-purple-700'
                          : req.type === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {req.type || 'Service'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-0.5 group-hover:text-sky-600 transition-colors">
                      Details <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-slate-500 bg-slate-50/50 rounded-xl">No active service records.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

