import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, userRole }) {
  const nurseNavItems = [
    { id: 'dashboard', label: 'Clinical Dashboard', icon: 'dashboard' },
    { id: 'service-station', label: 'Service Station', icon: 'build_circle' },
    { id: 'hospital-inventory', label: 'Hospital Equipment', icon: 'inventory_2' },
    { id: 'service-history', label: 'Service History', icon: 'history' },
    { id: 'health-assessment', label: 'Equipment Health Entry', icon: 'health_and_safety' },
  ];

  const adminNavItems = [
    { id: 'dashboard', label: 'Administrator Dashboard', icon: 'dashboard' },
    { id: 'equipment-overview', label: 'Equipment Overview', icon: 'biotech' },
    { id: 'service-history', label: 'Service Records History', icon: 'history_edu' },
    { id: 'recall-monitoring', label: 'Recall Monitoring', icon: 'report_problem' },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : nurseNavItems;

  const profiles = {
    nurse: { name: 'Dr. Priya', role: 'Clinical Staff Lead', avatar: 'clinical_notes' },
    admin: { name: 'Dr. Sarah Chen', role: 'Hospital Administrator', avatar: 'admin_panel_settings' },
  };

  const currentProfile = profiles[userRole] || profiles.nurse;

  return (
    <aside className="fixed left-0 top-0 h-full w-72 z-50 flex flex-col border-r border-outline-variant bg-gradient-to-b from-primary-container via-[#0c4063] to-secondary-container text-on-primary shadow-xl">
      {/* Brand Header */}
      <div className="px-6 py-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 shadow-inner">
          <span className="material-symbols-outlined text-white text-2xl">medical_services</span>
        </div>
        <div className="flex flex-col">
          <span className="font-headline-sm text-xl font-extrabold text-white tracking-wide">MedEquip</span>
          <span className="text-[10px] text-secondary-fixed-dim uppercase tracking-widest font-semibold">
            {userRole === 'admin' ? 'Admin Portal' : 'Clinical Portal'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-bold text-white/50 uppercase tracking-widest">
          {userRole === 'admin' ? 'Executive Portal' : 'Clinical Portal'}
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm transition-all duration-200 text-left ${
                isActive
                  ? 'bg-white/20 text-white font-bold backdrop-blur-md shadow-md border border-white/30 translate-x-1'
                  : 'text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-0.5'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Dynamic Active User Profile Footer */}
      <div className="p-4 border-t border-white/10 bg-black/10">
        <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/15">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-primary font-bold shadow-md">
            <span className="material-symbols-outlined text-xl">{currentProfile.avatar}</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-label-md text-sm font-bold text-white truncate">{currentProfile.name}</span>
            <span className="font-label-sm text-[11px] text-secondary-fixed-dim font-medium truncate">{currentProfile.role}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
