import React, { useState } from 'react';

export default function EngineerDailyActivity() {
  const [logs, setLogs] = useState([
    { time: '08:30 AM', activity: 'Morning Rounds & ICU Ventilator Status Inspection', asset: 'Respironics V60', hours: '1.5 hrs', status: 'Completed' },
    { time: '10:00 AM', activity: 'Disassembled VENT-024 compressor housing & replaced HEPA filter', asset: 'VEN-2023-8472', hours: '2.0 hrs', status: 'Completed' },
    { time: '01:30 PM', activity: 'Zero-point pressure calibration & IEC 62353 electrical leakage test', asset: 'VEN-2023-8472', hours: '1.5 hrs', status: 'Completed' },
    { time: '03:30 PM', activity: 'ER Defibrillator capacitor firmware flash patch (Recall Notice)', asset: 'DEF-402-B', hours: '1.0 hrs', status: 'In Progress' },
  ]);

  const [newLog, setNewLog] = useState({ activity: '', asset: '', hours: '1.0' });

  const handleAddLog = (e) => {
    e.preventDefault();
    if (!newLog.activity) return;

    setLogs([
      ...logs,
      {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        activity: newLog.activity,
        asset: newLog.asset || 'General',
        hours: `${newLog.hours} hrs`,
        status: 'Completed',
      },
    ]);
    setNewLog({ activity: '', asset: '', hours: '1.0' });
  };

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto">
      {/* Title */}
      <div className="flex flex-col gap-2 border-b border-outline-variant/40 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
          <span className="material-symbols-outlined text-base">receipt_long</span>
          Compliance & Hours Log
        </div>
        <h1 className="font-display-lg text-3xl font-extrabold text-on-background m-0">Engineer Daily Activity Log</h1>
        <p className="font-body-md text-sm text-on-surface-variant m-0">
          Record daily biomedical maintenance activities, repair hours, and regulatory safety sign-offs.
        </p>
      </div>

      {/* Add Log Form */}
      <form onSubmit={handleAddLog} className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Activity Description *</label>
          <input
            type="text"
            required
            placeholder="e.g. Calibrated pressure sensor on ICU ventilator..."
            value={newLog.activity}
            onChange={(e) => setNewLog({ ...newLog, activity: e.target.value })}
            className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 text-sm font-semibold outline-none focus:border-primary"
          />
        </div>

        <div className="w-full md:w-48 space-y-1">
          <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Asset / Machine ID</label>
          <input
            type="text"
            placeholder="e.g. VEN-2023-8472"
            value={newLog.asset}
            onChange={(e) => setNewLog({ ...newLog, asset: e.target.value })}
            className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 text-sm font-semibold outline-none focus:border-primary"
          />
        </div>

        <div className="w-full md:w-32 space-y-1">
          <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Hours Logged</label>
          <input
            type="number"
            step="0.5"
            value={newLog.hours}
            onChange={(e) => setNewLog({ ...newLog, hours: e.target.value })}
            className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 text-sm font-semibold outline-none focus:border-primary"
          />
        </div>

        <button
          type="submit"
          className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl shadow hover:bg-primary/90 transition-all text-sm shrink-0"
        >
          Add Log Entry
        </button>
      </form>

      {/* Activity Timeline Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low text-xs text-on-surface-variant uppercase font-bold border-b border-outline-variant/40">
            <tr>
              <th className="p-4">Time</th>
              <th className="p-4">Activity Description</th>
              <th className="p-4">Asset ID</th>
              <th className="p-4">Hours</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 text-sm font-body-md">
            {logs.map((log, i) => (
              <tr key={i} className="hover:bg-surface-container-low/60 transition-colors">
                <td className="p-4 font-mono font-bold text-primary text-xs">{log.time}</td>
                <td className="p-4 font-semibold text-on-surface">{log.activity}</td>
                <td className="p-4 font-mono text-xs text-on-surface-variant">{log.asset}</td>
                <td className="p-4 font-mono font-bold text-on-surface">{log.hours}</td>
                <td className="p-4">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
