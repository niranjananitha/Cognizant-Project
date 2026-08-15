import React from 'react';
import { machineImages } from '../../assets/images';

export default function AdminRecallMonitoring() {
  const recalls = [
    {
      id: 'RCL-2023-REV4',
      title: 'Mindray BeneHeart D3 Defibrillator Capacitor Notice',
      vendor: 'Mindray Medical Systems',
      level: 'Critical Class I Safety Advisory',
      affectedCount: 3,
      remediatedCount: 2,
      complianceRate: '66.7%',
      status: 'In Remediation',
      img: machineImages.defibrillator,
    },
    {
      id: 'RCL-2023-BD01',
      title: 'BD Alaris Infusion Pump Occlusion Sensor Sync',
      vendor: 'Becton Dickinson (BD)',
      level: 'Class II FDA Advisory',
      affectedCount: 5,
      remediatedCount: 5,
      complianceRate: '100%',
      status: 'Fully Resolved',
      img: machineImages.infusionPump,
    },
  ];

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      {/* Page Title */}
      <div className="flex flex-col gap-2 border-b border-outline-variant/40 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-error uppercase tracking-widest">
          <span className="material-symbols-outlined text-base">report_problem</span>
          Executive Risk & Compliance
        </div>
        <h1 className="font-display-lg text-3xl font-extrabold text-on-background m-0">Recall Monitoring</h1>
        <p className="font-body-md text-sm text-on-surface-variant m-0">
          Executive monitoring of FDA recalls, vendor safety notices, and hospital fleet remediation compliance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Active Recall Advisories</div>
          <div className="text-4xl font-extrabold text-error mt-2">2 Advisories</div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
          <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Affected Hospital Units</div>
          <div className="text-4xl font-extrabold text-primary mt-2">8 Devices</div>
        </div>
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 shadow-sm">
          <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Overall Fleet Remediation</div>
          <div className="text-4xl font-extrabold text-emerald-700 mt-2">87.5%</div>
        </div>
      </div>

      {/* Recalls Detail Feed */}
      <div className="grid grid-cols-1 gap-6">
        {recalls.map((r) => (
          <div key={r.id} className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-surface-container-low border border-outline-variant/60 p-2 flex items-center justify-center shrink-0">
                <img src={r.img} alt={r.title} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-extrabold text-primary">{r.id}</span>
                  <span className="px-3 py-1 bg-error-container text-on-error-container text-xs font-extrabold rounded-full">
                    {r.level}
                  </span>
                </div>
                <h2 className="font-headline-sm text-xl font-bold text-on-surface m-0">{r.title}</h2>
                <div className="text-xs font-semibold text-on-surface-variant">
                  Vendor: <strong className="text-on-surface">{r.vendor}</strong> • Affected Units: <strong className="text-primary font-mono">{r.affectedCount}</strong> • Remediated: <strong className="text-emerald-700 font-mono">{r.remediatedCount}</strong>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
              <div className="text-right">
                <span className="text-[11px] text-on-surface-variant uppercase font-bold block">Remediation Rate</span>
                <span className="text-xl font-mono font-extrabold text-emerald-700">{r.complianceRate}</span>
              </div>
              <span className="px-3 py-1 bg-surface-container text-on-surface text-xs font-bold rounded-lg font-mono">
                {r.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
