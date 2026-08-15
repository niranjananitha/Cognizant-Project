import React from 'react';
import { machineImages } from '../assets/images';

export default function EquipmentServiceDetail({ onNavigate, onLogServiceClick, selectedRecord }) {
  const machine = selectedRecord || {
    workOrder: 'WO-2023-8821',
    assetId: 'AST-8821-V',
    equipment: 'Respironics V60 Ventilator',
    serviceType: 'Preventative Maintenance',
    technician: 'J. Miller (Senior Technician)',
    date: '14 Oct 2023',
    cost: '$450.00',
    status: 'Completed',
  };

  const getMachineImg = (name, id) => {
    if (machineImages[id]) return machineImages[id];
    if (name.includes('Ventilator')) return machineImages.ventilator;
    if (name.includes('Monitor')) return machineImages.monitor;
    if (name.includes('Defibrillator')) return machineImages.defibrillator;
    if (name.includes('Pump')) return machineImages.infusionPump;
    if (name.includes('MRI')) return machineImages.mri;
    return machineImages.ventilator;
  };

  const serviceTimeline = [
    {
      date: machine.date || 'Oct 14, 2023',
      status: machine.status || 'Completed',
      orderId: machine.workOrder || 'SRV-8821',
      engineer: machine.technician || 'J. Miller',
      reportedIssue: `${machine.equipment} (${machine.assetId}) - ${machine.serviceType || 'Routine annual service overhaul'}`,
      resolution: 'Inspected pneumatic seals, recalibrated sensor zero baseline, and verified electrical safety compliance (IEC 62353).',
      partsReplaced: 'Dust Filter Kit & Intake Seal',
    },
    {
      date: 'Apr 10, 2023',
      status: 'Completed',
      orderId: 'SRV-7104',
      engineer: 'J. Miller',
      reportedIssue: 'Annual preventative maintenance and zero-point calibration.',
      resolution: 'Replaced lead seals and tested output accuracy against master reference standard.',
      partsReplaced: 'Calibration Seal Kit (P/N: M1008-60001)',
    },
    {
      date: 'Nov 02, 2022',
      status: 'Completed',
      orderId: 'SRV-5091',
      engineer: 'J. Miller',
      reportedIssue: 'Battery backup holding test during power transition.',
      resolution: 'Replaced internal backup battery module. Verified holding charge during 30-minute blackout test.',
      partsReplaced: 'Internal Battery Pack 14.8V (P/N: 989803196521)',
    },
  ];

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1400px] mx-auto animate-in fade-in duration-200">
      {/* Back Button */}
      <div>
        <button
          onClick={() => onNavigate('service-history')}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-surface-container px-4 py-2 rounded-xl border border-outline-variant/40"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Maintenance History Log
        </button>
      </div>

      {/* Hero Header Card */}
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-between bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-surface-container-low border border-outline-variant/60 p-2 flex items-center justify-center shrink-0 shadow">
            <img src={getMachineImg(machine.equipment, machine.assetId)} alt={machine.equipment} className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display-lg text-2xl font-extrabold text-on-surface m-0">{machine.equipment}</h1>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                {machine.status || 'Active Operational'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-on-surface-variant flex-wrap">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-base">location_on</span> Intensive Care (ICU)
              </span>
              <span className="flex items-center gap-1 font-mono">
                <span className="material-symbols-outlined text-base">tag</span> Asset ID: <strong className="text-primary">{machine.assetId}</strong>
              </span>
              <span>• Work Order: <strong className="text-on-surface">{machine.workOrder}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
          <div className="p-4 rounded-xl flex flex-col gap-1 min-w-[180px] bg-secondary-container/10 border border-secondary-container/30">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Service Expenditure</span>
            <span className="text-lg font-mono font-extrabold text-primary flex items-center gap-1">
              {machine.cost || '$450.00'}
            </span>
          </div>
          <div className="p-4 rounded-xl flex flex-col gap-1 min-w-[180px] bg-secondary-container/10 border border-secondary-container/30">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Warranty Status</span>
            <span className="text-lg font-bold text-secondary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-lg">verified</span> Active (2025)
            </span>
          </div>
        </div>
      </div>

      {/* Service Timeline Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-headline-md text-xl font-extrabold text-on-surface m-0">
          Complete Service History Timeline: {machine.equipment}
        </h2>
        <button
          onClick={onLogServiceClick}
          className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow"
        >
          <span className="material-symbols-outlined text-base">add</span> Log New Maintenance Event
        </button>
      </div>

      {/* Timeline List */}
      <div className="relative flex flex-col gap-6 pl-4">
        <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-outline-variant/40" />

        {serviceTimeline.map((item, index) => (
          <div key={index} className="relative pl-12 flex items-start">
            <div className="absolute left-2 top-2 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center ring-4 ring-background">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            </div>

            <div className="flex-1 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/40 p-6 flex flex-col gap-4 hover:border-primary/40 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/30 pb-3 gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg text-on-surface">{item.date}</span>
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                  <span className="font-mono font-bold text-primary">{item.orderId}</span>
                  <span className="flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-base">engineering</span> Tech: {item.engineer}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Reported Issue
                  </span>
                  <p className="text-on-surface leading-relaxed font-medium">{item.reportedIssue}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Root Cause & Resolution
                  </span>
                  <p className="text-on-surface leading-relaxed font-medium">{item.resolution}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Parts Replaced
                  </span>
                  <p className="text-on-surface font-bold text-primary">{item.partsReplaced}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
