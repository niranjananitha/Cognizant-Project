import React from 'react';
import { machineImages } from '../../assets/images';

export default function AdminServiceRecordDetail({ onNavigate, record }) {
  const item = record || {
    workOrder: 'WO-2023-8821',
    assetId: 'VEN-2023-8472',
    equipment: 'Respironics V60 Ventilator',
    serviceType: 'Preventative Maintenance',
    technician: 'J. Miller (Lead Tech)',
    date: '14 Oct 2023',
    cost: '$450.00',
    status: 'Completed',
  };

  const getImg = (name, id) => {
    if (machineImages[id]) return machineImages[id];
    if (name.includes('Ventilator')) return machineImages.ventilator;
    if (name.includes('Monitor')) return machineImages.monitor;
    if (name.includes('Defibrillator')) return machineImages.defibrillator;
    if (name.includes('Pump')) return machineImages.infusionPump;
    if (name.includes('MRI')) return machineImages.mri;
    return machineImages.ventilator;
  };

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1400px] mx-auto animate-in fade-in duration-200">
      {/* Back Button */}
      <div>
        <button
          onClick={() => onNavigate('service-history')}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-surface-container px-4 py-2 rounded-xl border border-outline-variant/40"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Service Records History
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant flex flex-col lg:flex-row justify-between items-start gap-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-surface-container-low border border-outline-variant/60 p-3 flex items-center justify-center shrink-0 shadow">
            <img src={getImg(item.equipment, item.assetId)} alt={item.equipment} className="max-h-full max-w-full object-contain" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-primary">{item.workOrder}</span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-full">
                {item.status}
              </span>
            </div>
            <h1 className="font-display-lg text-2xl font-extrabold text-on-surface m-0">{item.equipment}</h1>
            <div className="text-xs text-on-surface-variant font-medium">
              Asset ID: <strong className="text-primary font-mono">{item.assetId}</strong> • Performed by: <strong className="text-on-surface">{item.technician}</strong>
            </div>
          </div>
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 min-w-[180px]">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Service Expenditure</span>
            <span className="text-xl font-mono font-extrabold text-primary">{item.cost}</span>
          </div>
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 min-w-[180px]">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Audit Status</span>
            <span className="text-sm font-bold text-emerald-700 flex items-center gap-1 mt-1">
              <span className="material-symbols-outlined text-base">verified</span> Certified Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Financial & Technical Compliance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <h2 className="text-base font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/40 pb-3 m-0 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">receipt</span>
            Financial & Part Breakdown
          </h2>
          <div className="space-y-3 text-xs font-medium">
            <div className="flex justify-between py-2 border-b border-outline-variant/30">
              <span className="text-on-surface-variant">Labor Hours (2.5 hrs @ $80/hr):</span>
              <strong className="text-on-surface font-mono">$200.00</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-outline-variant/30">
              <span className="text-on-surface-variant">Intake HEPA Filter Kit (P/N: V60-FLT-99):</span>
              <strong className="text-on-surface font-mono">$45.00</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-outline-variant/30">
              <span className="text-on-surface-variant">O2 Galvano Sensor Cell (P/N: V60-O2-01):</span>
              <strong className="text-on-surface font-mono">$120.00</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-outline-variant/30">
              <span className="text-on-surface-variant">Consumables & Calibration Seal:</span>
              <strong className="text-on-surface font-mono">$85.00</strong>
            </div>
            <div className="flex justify-between pt-2 text-sm font-extrabold text-primary">
              <span>Total Invoice Amount:</span>
              <span className="font-mono">{item.cost}</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
          <h2 className="text-base font-bold text-on-surface uppercase tracking-wider border-b border-outline-variant/40 pb-3 m-0 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">gavel</span>
            OEM & Regulatory Compliance
          </h2>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 font-medium">
              <strong className="block font-bold">IEC 62353 Safety Standard Passed</strong>
              Electrical insulation resistance and chassis ground leakage current verified within 0.05 mA limit.
            </div>
            <div className="p-3 bg-blue-50 border border-blue-300 rounded-xl text-blue-950 font-medium">
              <strong className="block font-bold">Vendor Warranty Preservation</strong>
              All replaced parts certified OEM original. Next preventative maintenance scheduled for 15 Apr 2024.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
