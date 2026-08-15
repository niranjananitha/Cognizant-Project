import React from 'react';

export default function ClinicalDashboard({ onNavigate, searchQuery }) {
  const categories = [
    { name: 'Ventilators', total: 12, available: 8, maintenance: 4, health: '85%' },
    { name: 'Patient Monitors', total: 24, available: 20, maintenance: 4, health: '94%' },
    { name: 'Imaging Systems (MRI/CT)', total: 6, available: 5, maintenance: 1, health: '90%' },
    { name: 'Infusion Pumps', total: 45, available: 40, maintenance: 5, health: '96%' },
    { name: 'Defibrillators', total: 18, available: 15, maintenance: 3, health: '88%' },
  ];

  const recentRequests = [
    { id: 'SRV-8821', asset: 'Respironics V60', issue: 'Compressor motor vibration detected', priority: 'High', date: 'Today, 09:30 AM' },
    { id: 'SRV-7104', asset: 'Siemens Magnetom 3.0T', issue: 'Cooling loop pressure warning', priority: 'Medium', date: 'Yesterday' },
    { id: 'SRV-6590', asset: 'Mindray BeneHeart D3', issue: 'Battery capacitor recall calibration', priority: 'Low', date: '14 Oct 2023' },
  ];

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1600px] mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col gap-1 border-b border-outline-variant/40 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
          <span className="material-symbols-outlined text-base">verified</span>
          Clinical Operations Overview
        </div>
        <h1 className="font-display-lg text-3xl font-extrabold text-on-background m-0">Good Morning, Dr. Priya</h1>
        <p className="font-body-lg text-sm text-on-surface-variant m-0">
          Equipment status, active service tracking, and department inventory health.
        </p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* At Risk */}
        <div
          onClick={() => onNavigate('health-assessment')}
          className="bg-error-container/80 p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-error-container group"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-xs font-bold text-on-error-container uppercase tracking-wider">At Risk</span>
            <span className="material-symbols-outlined text-error group-hover:scale-110 transition-transform">warning</span>
          </div>
          <span className="font-display-lg text-4xl font-extrabold text-on-error-container">8</span>
          <span className="text-[10px] text-on-error-container font-semibold uppercase tracking-wider">Run Diagnostics →</span>
        </div>

        {/* Maintenance -> Redirects to Service Station */}
        <div
          onClick={() => onNavigate('service-station')}
          className="bg-blue-100 p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-blue-300 group"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-xs font-bold text-blue-950 uppercase tracking-wider">Maintenance</span>
            <span className="material-symbols-outlined text-blue-700 group-hover:scale-110 transition-transform">build</span>
          </div>
          <span className="font-display-lg text-4xl font-extrabold text-blue-900">5</span>
          <span className="text-[10px] text-blue-800 font-extrabold uppercase tracking-wider">View Service Station →</span>
        </div>

        {/* Recall -> Redirects to Service Station */}
        <div
          onClick={() => onNavigate('service-station')}
          className="bg-amber-100 p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-amber-300 group"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-xs font-bold text-amber-950 uppercase tracking-wider">Recall</span>
            <span className="material-symbols-outlined text-amber-700 group-hover:scale-110 transition-transform">assignment_return</span>
          </div>
          <span className="font-display-lg text-4xl font-extrabold text-amber-900">3</span>
          <span className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wider">View Recalls →</span>
        </div>

        {/* Backup -> Redirects to Hospital Equipment */}
        <div
          onClick={() => onNavigate('hospital-inventory')}
          className="bg-emerald-50 p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-emerald-200 group"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-xs font-bold text-emerald-950 uppercase tracking-wider">Backup Ready</span>
            <span className="material-symbols-outlined text-emerald-700 group-hover:scale-110 transition-transform">shield_with_heart</span>
          </div>
          <span className="font-display-lg text-4xl font-extrabold text-emerald-800">184</span>
          <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider">Hospital Inventory →</span>
        </div>

        {/* Available -> Hospital Inventory */}
        <div
          onClick={() => onNavigate('hospital-inventory')}
          className="bg-secondary-container/40 p-5 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer border border-secondary-container/40 group"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-xs font-bold text-on-secondary-container uppercase tracking-wider">Available</span>
            <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform">check_circle</span>
          </div>
          <span className="font-display-lg text-4xl font-extrabold text-on-secondary-container">1,012</span>
          <span className="text-[10px] text-secondary font-extrabold uppercase tracking-wider">Browse Active →</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Equipment Status Overview Table */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-xl font-extrabold text-on-background m-0">Equipment Status Overview</h2>
            <button
              onClick={() => onNavigate('hospital-inventory')}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/40"
            >
              View Hospital Inventory <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low font-label-md text-xs text-on-surface-variant uppercase border-b border-outline-variant/50">
                <tr>
                  <th className="p-4 font-bold">Category</th>
                  <th className="p-4 font-bold">Total</th>
                  <th className="p-4 font-bold">Available</th>
                  <th className="p-4 font-bold">Maintenance</th>
                  <th className="p-4 font-bold">Avg Health</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-sm text-on-background divide-y divide-outline-variant/30">
                {filteredCategories.map((cat, i) => (
                  <tr key={i} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-4 font-bold text-primary">{cat.name}</td>
                    <td className="p-4 font-medium">{cat.total}</td>
                    <td className="p-4 text-emerald-700 font-bold">{cat.available}</td>
                    <td className="p-4 text-error font-bold">{cat.maintenance}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-surface-container-high h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: cat.health }} />
                        </div>
                        <span className="text-xs font-mono font-bold text-on-surface">{cat.health}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Service Activity Panel */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-xl font-extrabold text-on-background m-0">Recent Service Activity</h2>
            <button
              onClick={() => onNavigate('service-history')}
              className="text-xs font-bold text-primary hover:underline"
            >
              View Service History
            </button>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-outline-variant flex flex-col gap-4">
            {recentRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => onNavigate('service-history')}
                className="p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer border border-outline-variant/30 flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-primary">{req.id}</span>
                  <span className="text-on-surface-variant font-medium">{req.date}</span>
                </div>
                <span className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">{req.asset}</span>
                <p className="text-xs text-on-surface-variant line-clamp-2">{req.issue}</p>
                <div className="flex items-center justify-between mt-1">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                      req.priority === 'High'
                        ? 'bg-error-container text-on-error-container'
                        : req.priority === 'Medium'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-blue-100 text-blue-900 border border-blue-300'
                    }`}
                  >
                    {req.priority} Priority
                  </span>
                  <span className="text-xs font-bold text-secondary flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                    Service Record <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
