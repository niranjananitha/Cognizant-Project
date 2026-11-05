import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

export default function Sidebar({ activeTab, setActiveTab, userRole }) {
  const { user } = useAuth();

  const nurseNavItems = [
    { id: 'dashboard', label: 'Clinical Dashboard', icon: 'dashboard' },
    { id: 'service-station', label: 'Service Station', icon: 'build_circle' },
    { id: 'hospital-inventory', label: 'Hospital Equipment', icon: 'inventory_2' },
    { id: 'service-history', label: 'Service History', icon: 'history' },
    { id: 'health-assessment', label: 'Equipment Health Entry', icon: 'health_and_safety' },
    { id: 'equipment-assistance', label: 'Equipment Assistance', icon: 'support_agent' },
  ];

  const adminNavItems = [
    { id: 'dashboard', label: 'Administrator Dashboard', icon: 'dashboard' },
    { id: 'equipment-overview', label: 'Equipment Overview', icon: 'biotech' },
    { id: 'service-history', label: 'Service Records History', icon: 'history_edu' },
    { id: 'recall-monitoring', label: 'Recall Monitoring', icon: 'report_problem' },
    { id: 'knowledge-base', label: 'Knowledge Base Manager', icon: 'library_books' },
  ];

  const navItems = userRole === 'admin' ? adminNavItems : nurseNavItems;

  const getRoleLabel = (role) => {
    switch (role) {
      case 'HOSPITAL_ADMIN': return 'Hospital Administrator';
      case 'MAINTENANCE_ENGINEER': return 'Maintenance Engineer';
      case 'NURSE_DOCTOR': return 'Clinical Staff';
      default: return 'User';
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-72 z-50 flex flex-col border-r border-outline-variant bg-gradient-to-b from-primary-container via-[#0c4063] to-secondary-container text-on-primary shadow-xl">
      {/* Brand Header */}
      <div className="px-6 py-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-1 shadow-md">
          <img src={logo} alt="MedEquip Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
          <span className="font-headline-sm text-xl font-extrabold text-white tracking-wide leading-tight">MedEquip</span>
          <span className="text-[10px] text-white/70 uppercase tracking-widest font-semibold leading-tight mt-0.5">
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
      <div className="p-4 border-t border-white/10 bg-slate-900/30">
        <div className="flex items-center gap-3 p-3 bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/10">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold shadow-sm border border-white/20">
            <span className="material-symbols-outlined text-xl">
              {userRole === 'admin' ? 'admin_panel_settings' : 'clinical_notes'}
            </span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-label-md text-sm font-bold text-white truncate">
              {user?.full_name || 'Loading...'}
            </span>
            <span className="font-label-sm text-[11px] text-white/70 font-medium truncate">
              {getRoleLabel(user?.role)}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
