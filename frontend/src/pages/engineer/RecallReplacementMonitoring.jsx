import React from 'react';
import { machineImages } from '../../assets/images';

export default function RecallReplacementMonitoring() {
  const recalls = [
    {
      id: 'RCL-2023-REV4',
      name: 'Mindray BeneHeart D3 Defibrillator Capacitor Notice',
      vendor: 'Mindray Medical',
      severity: 'Critical Safety Alert',
      affectedUnits: 3,
      description: 'Firmware timing recalibration required for high-energy biphasic discharge capacitor circuit.',
      status: 'In Progress (2 Units Updated)',
      img: machineImages.defibrillator,
    },
    {
      id: 'RCL-2023-BD01',
      name: 'BD Alaris Infusion Pump Drug Library Sync',
      vendor: 'BD Alaris',
      severity: 'Class II FDA Advisory',
      affectedUnits: 5,
      description: 'Wireless drug library protocol update to resolve occlusion sensor baseline sync.',
      status: 'Pending Firmware Flash',
      img: machineImages.infusionPump,
    },
  ];

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto">
      {/* Title */}
      <div className="flex flex-col gap-2 border-b border-outline-variant/40 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-error uppercase tracking-widest">
          <span className="material-symbols-outlined text-base">warning</span>
          FDA & Manufacturer Safety Advisory
        </div>
        <h1 className="font-display-lg text-3xl font-extrabold text-on-background m-0">Recall & Replacement Monitoring</h1>
        <p className="font-body-md text-sm text-on-surface-variant m-0">
          Track manufacturer safety notices, firmware recalls, and unit replacements for medical compliance.
        </p>
      </div>

      {/* Recalls Feed Cards */}
      <div className="grid grid-cols-1 gap-6">
        {recalls.map((r) => (
          <div key={r.id} className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-surface-container-low border border-outline-variant/50 p-2 flex items-center justify-center shrink-0">
                <img src={r.img} alt={r.name} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-bold text-primary">{r.id}</span>
                  <span className="px-3 py-1 bg-error-container text-on-error-container text-xs font-extrabold rounded-full">
                    {r.severity}
                  </span>
                </div>
                <h2 className="font-headline-sm text-xl font-bold text-on-surface m-0">{r.name}</h2>
                <div className="text-xs font-semibold text-on-surface-variant">Vendor: <strong className="text-on-surface">{r.vendor}</strong> • Affected Hospital Units: <strong className="text-primary font-mono">{r.affectedUnits} Units</strong></div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{r.description}</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0">
              <span className="px-3 py-1 bg-surface-container text-on-surface text-xs font-bold rounded-lg font-mono">
                {r.status}
              </span>
              <button className="bg-primary text-white px-5 py-2 rounded-xl text-xs font-bold shadow hover:bg-primary/90">
                Execute Recall Patch
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
