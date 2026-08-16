import React from 'react';
import { useEquipment } from '../contexts/EquipmentContext';
import { machineImages } from '../assets/images';

export default function EquipmentServiceDetail({ onNavigate, onLogServiceClick, selectedRecord }) {
  const { assets } = useEquipment();

  const matchingAsset = assets.find(
    (a) => a.id === selectedRecord?.assetId || a.name === selectedRecord?.equipment
  ) || assets[0];

  const machine = {
    workOrder: selectedRecord?.workOrder || 'WO-2025-8821',
    assetId: selectedRecord?.assetId || matchingAsset?.id || 'AST-8821-V',
    equipment: selectedRecord?.equipment || matchingAsset?.name || 'Respironics V60 Ventilator',
    serviceType: selectedRecord?.serviceType || 'Preventative Maintenance & Telemetry Calibration',
    technician: selectedRecord?.technician || 'J. Miller (Senior Bio-Medical Engineer)',
    date: selectedRecord?.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    status: selectedRecord?.status || 'Completed',
    notes: selectedRecord?.notes || 'Preventative maintenance completed. Zero-point pressure transducer recalibrated against reference baseline standard.',
    health: matchingAsset?.health || 98,
    category: matchingAsset?.category || 'Ventilators',
    department: matchingAsset?.department || 'Intensive Care (ICU)',
    location: matchingAsset?.location || 'ICU - Bed 04',
    serialNo: matchingAsset?.serialNo || 'PH-V60-99824',
    manufacturer: matchingAsset?.manufacturer || 'Philips Healthcare',
    warranty: matchingAsset?.warranty || 'Active Hospital Contract (2026)',
  };

  const getMachineImg = (name, id) => {
    if (machineImages[id]) return machineImages[id];
    if (machineImages[name]) return machineImages[name];
    if (name.includes('Ventilator')) return machineImages.ventilator;
    if (name.includes('Monitor')) return machineImages.monitor;
    if (name.includes('Defibrillator')) return machineImages.defibrillator;
    if (name.includes('Pump')) return machineImages.infusionPump;
    if (name.includes('MRI')) return machineImages.mri;
    return machineImages.ventilator;
  };

  const telemetryData = [
    { label: 'Operating Temp', value: '38.5°C', status: 'Nominal', icon: 'thermostat' },
    { label: 'System Pressure', value: '14.2 cmH2O', status: 'Calibrated', icon: 'speed' },
    { label: 'Operating Hours', value: '12,450 Hrs', status: 'Logged', icon: 'schedule' },
    { label: 'Recent Downtime', value: '0.0 Hrs', status: 'Optimal', icon: 'timer' },
    { label: 'Battery Backup', value: '12.4 V', status: 'Nominal', icon: 'battery_charging_full' },
    { label: 'Peak Flow Rate', value: '45.0 L/min', status: 'Calibrated', icon: 'air' },
  ];

  const serviceTimeline = [
    {
      date: machine.date,
      status: machine.status,
      orderId: machine.workOrder,
      engineer: machine.technician,
      reportedIssue: `${machine.equipment} (${machine.assetId}) - ${machine.serviceType}`,
      resolution: machine.notes || 'Full clinical multi-point inspection, electrical safety testing (IEC 62353), and sensor zero-baseline calibration completed.',
      predictedAction: 'Pneumatic & Sensor Telemetry Diagnostics Passed',
    },
    {
      date: '10 Apr 2025',
      status: 'Completed',
      orderId: 'WO-2025-7104',
      engineer: 'J. Miller (Senior Bio-Tech Lead)',
      reportedIssue: 'Annual preventative maintenance and zero-point calibration check.',
      resolution: 'Replaced intake particle filter, verified pressure baseline against master reference standard.',
      predictedAction: 'Routine Mechanical PM Clearance',
    },
    {
      date: '02 Nov 2024',
      status: 'Completed',
      orderId: 'WO-2024-5091',
      engineer: 'S. Chen (MedTech Specialist)',
      reportedIssue: 'Backup power battery holding test during emergency transition simulation.',
      resolution: 'Inspected internal backup battery cells. Output holding curve verified within 99.4% specification.',
      predictedAction: 'Electrical Circuit & Battery Calibration',
    },
  ];

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1500px] mx-auto animate-in fade-in duration-300 font-sans text-slate-800">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('service-history')}
          className="text-[13px] font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 bg-white px-4 py-2 rounded-lg border border-transparent hover:border-slate-200 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Maintenance History Log
        </button>

        {onLogServiceClick && (
          <button
            onClick={() => onNavigate('health-assessment')}
            className="text-[13px] font-medium text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">psychology</span> Run New AI Health Diagnosis
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start justify-between bg-white p-7 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 p-2 overflow-hidden">
            <img src={getMachineImg(machine.equipment, machine.assetId)} alt={machine.equipment} className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2.5 py-0.5 bg-sky-50 text-sky-700 text-[11px] font-medium rounded-md uppercase tracking-wider">
                {machine.category}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {machine.status}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 m-0 tracking-tight">{machine.equipment}</h1>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-500 flex-wrap mt-1">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-slate-400">location_on</span> {machine.department} • {machine.location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-slate-400">tag</span> Asset ID: <span className="text-slate-700">{machine.assetId}</span>
              </span>
              <span>•</span>
              <span>Work Order: <span className="text-slate-700">{machine.workOrder}</span></span>
              <span>•</span>
              <span>Serial: <span className="text-slate-700">{machine.serialNo}</span></span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 w-full lg:w-auto flex-wrap">
          <div className="p-4 rounded-xl flex flex-col gap-1 min-w-[200px] bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">psychology</span> AI Health Index
            </span>
            <span className="text-2xl font-semibold text-slate-800 flex items-center gap-2">
              {machine.health}%
              <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                {machine.health > 70 ? 'Optimal State' : 'Monitored'}
              </span>
            </span>
          </div>

          <div className="p-4 rounded-xl flex flex-col gap-1 min-w-[200px] bg-sky-50/50 border border-sky-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-sky-500">verified</span> Diagnostic Verification
            </span>
            <span className="text-[13px] font-medium text-emerald-700 flex items-center gap-1.5 mt-1">
              <span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span>
              Certified Operational
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2 m-0">
            <span className="material-symbols-outlined text-[16px] text-slate-400">monitoring</span>
            AI Telemetry & Machine Sensor Health Readings
          </h2>
          <span className="text-[11px] font-mono font-medium text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
            Telemetry Synced
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {telemetryData.map((tel, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">{tel.label}</span>
                <span className="material-symbols-outlined text-[16px]">{tel.icon}</span>
              </div>
              <div className="text-[17px] font-semibold text-slate-900 mt-1">{tel.value}</div>
              <span className="text-[11px] font-medium text-emerald-700">
                {tel.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 m-0">
            Machine Service & Maintenance Timeline
          </h2>
          <p className="text-sm text-slate-500 mt-1">Complete historical work order lifecycle and resolution log.</p>
        </div>
        {onLogServiceClick && (
          <button
            onClick={onLogServiceClick}
            className="bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium text-[13px] flex items-center gap-1.5 border border-slate-200 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span> Log New Maintenance Event
          </button>
        )}
      </div>

      <div className="relative flex flex-col gap-6 pl-4 mt-2">
        <div className="absolute left-[19px] top-6 bottom-6 w-px bg-slate-200" />

        {serviceTimeline.map((item, index) => (
          <div key={index} className="relative pl-10 flex items-start">
            <div className="absolute left-[8px] top-3 w-[22px] h-[22px] rounded-full bg-slate-100 flex items-center justify-center ring-[6px] ring-white">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
            </div>

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4 hover:border-slate-200 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-50 pb-4 gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[15px] text-slate-900">{item.date}</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium uppercase tracking-wider bg-emerald-50 text-emerald-700">
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="font-mono font-medium text-slate-600">{item.orderId}</span>
                  <span className="flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">engineering</span> {item.engineer}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Reported Issue / Reason
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">{item.reportedIssue}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Technical Resolution Details
                  </span>
                  <p className="text-slate-700 leading-relaxed">{item.resolution}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    AI Diagnostic Verification
                  </span>
                  <p className="text-sky-700 font-medium">{item.predictedAction}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
