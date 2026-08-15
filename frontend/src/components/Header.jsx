import React, { useState } from 'react';

export default function Header({ searchQuery, setSearchQuery, userRole, setUserRole }) {
  const [unreadCount, setUnreadCount] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);

  const roles = [
    { id: 'nurse', label: 'Dr. Priya (Nurse / Clinical Staff)', icon: 'clinical_notes' },
    { id: 'admin', label: 'Dr. Sarah Chen (Hospital Administrator)', icon: 'admin_panel_settings' },
  ];

  const notifications = [
    { id: 1, title: 'Recall Alert: Respironics V60 Ventilator', time: '10m ago', type: 'critical' },
    { id: 2, title: 'Quarterly Maintenance Audit Ready', time: '1h ago', type: 'info' },
    { id: 3, title: 'Capital Asset Purchase Approved: MRI-102', time: '3h ago', type: 'success' },
  ];

  const currentRoleObj = roles.find((r) => r.id === userRole) || roles[0];

  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-surface/80 backdrop-blur-xl border-b border-outline-variant z-40 flex items-center justify-between px-8">
      {/* Search Input */}
      <div className="flex items-center gap-3 text-on-surface-variant bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/60 w-96 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
        <span className="material-symbols-outlined text-lg">search</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search assets, tickets, or service logs..."
          className="bg-transparent font-body-md text-sm text-on-surface outline-none w-full placeholder:text-on-surface-variant/60"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="hover:text-on-surface">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {/* Role Switcher & Header Actions */}
      <div className="flex items-center gap-4">
        {/* Active Role Selector Dropdown */}
        <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/60 px-3.5 py-1.5 rounded-full shadow-sm">
          <span className="material-symbols-outlined text-primary text-lg">person_pin</span>
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            className="bg-transparent font-bold text-xs text-on-surface outline-none cursor-pointer"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                Role: {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notification Bell Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setUnreadCount(0);
            }}
            className="relative p-2.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-high rounded-full transition-all"
            title="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-background animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2 mb-3">
                <span className="font-headline-sm text-sm font-semibold text-on-surface">Alerts & Notifications</span>
                <span className="text-xs text-on-surface-variant">3 Recent</span>
              </div>
              <div className="space-y-2">
                {notifications.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                    <div className="flex justify-between text-xs font-semibold text-on-surface">
                      <span>{item.title}</span>
                      <span className="text-on-surface-variant text-[10px]">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
