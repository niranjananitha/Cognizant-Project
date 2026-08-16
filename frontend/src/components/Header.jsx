import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ searchQuery, setSearchQuery }) {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'Recall Alert: Respironics V60 Ventilator', time: '10m ago', type: 'critical' },
    { id: 2, title: 'Quarterly Maintenance Audit Ready', time: '1h ago', type: 'info' },
    { id: 3, title: 'Capital Asset Purchase Approved: MRI-102', time: '3h ago', type: 'success' },
  ];

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

      {/* User Profile & Header Actions */}
      <div className="flex items-center gap-4">
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

        {/* Logout Button */}
        <button
          onClick={logout}
          className="p-2.5 text-error hover:bg-error-container rounded-full transition-all"
          title="Logout"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant/60 px-4 py-1.5 rounded-full shadow-sm ml-2">
          <div className="bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs text-on-surface leading-tight">
              {user?.full_name}
            </span>
            <span className="text-[10px] text-on-surface-variant leading-tight">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
