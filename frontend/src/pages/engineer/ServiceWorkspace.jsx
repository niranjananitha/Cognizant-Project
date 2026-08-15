import React, { useState } from 'react';
import { machineImages } from '../../assets/images';

export default function ServiceWorkspace({ onNavigate, machineData }) {
  // Default fallbacks if no specific machine was passed
  const machine = machineData || {
    id: 'WO-VENT-024',
    assetId: 'VEN-2023-8472',
    name: 'Respironics V60 Ventilator',
    category: 'Ventilators',
    dept: 'Intensive Care Unit (ICU - Bed 04)',
    serialNo: 'PH-V60-99824',
    issue: 'High compressor vibration alarm during peak oxygen delivery. Airway pressure sensor drift noted.',
    img: machineImages.ventilator,
    hours: '12,450 Hrs',
    deliveryDate: '24 Oct 2023',
  };

  const [checklist, setChecklist] = useState({
    compressorChecked: true,
    sensorCalibrated: true,
    filterReplaced: false,
    batteryTested: false,
    safetyCertSigned: false,
  });

  const [replacedParts, setReplacedParts] = useState([
    { name: `Replacement Component Module for ${machine.name}`, qty: 1, cost: '$180.00' },
    { name: 'Intake Filter & Calibration Kit', qty: 1, cost: '$45.00' },
  ]);

  const [notes, setNotes] = useState(
    `Inspected ${machine.name} (${machine.assetId}). Issue reported: "${machine.issue}". Executed diagnostic zero-point sensor calibration and component overhaul.`
  );

  const [isCompleted, setIsCompleted] = useState(false);

  const toggleCheck = (key) => {
    setChecklist({ ...checklist, [key]: !checklist[key] });
  };

  const handleCompleteWorkOrder = () => {
    setIsCompleted(true);
  };

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      {/* Back Button & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/40 pb-5">
        <div>
          <button
            onClick={() => onNavigate('service-requests')}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mb-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Service Requests Queue
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display-lg text-3xl font-extrabold text-on-background m-0">
              Service Workspace: {machine.name}
            </h1>
            <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-full font-mono">
              Work Order: {machine.id || 'WO-ACTIVE'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button
            onClick={handleCompleteWorkOrder}
            disabled={isCompleted}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${
              isCompleted
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90'
            }`}
          >
            <span className="material-symbols-outlined text-lg">verified</span>
            {isCompleted ? 'Work Order Completed & Certified' : 'Complete & Sign-Off Work Order'}
          </button>
        </div>
      </div>

      {/* Hero Asset Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant flex flex-col lg:flex-row justify-between items-start gap-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-surface-container-low border border-outline-variant/60 p-2 flex items-center justify-center shrink-0">
            <img src={machine.img || machineImages[machine.category?.toLowerCase()] || machineImages.ventilator} alt={machine.name} className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs font-bold text-primary">Asset ID: {machine.assetId || machine.id}</span>
              <span className="text-xs text-on-surface-variant">• Serial #: {machine.serialNo || 'SN-884102'}</span>
            </div>
            <h2 className="font-headline-sm text-2xl font-bold text-on-surface m-0">{machine.name}</h2>
            <div className="text-xs text-on-surface-variant font-medium">
              Location: <strong className="text-on-surface">{machine.dept || machine.department || 'Intensive Care Unit'}</strong> • Assigned Tech: <strong className="text-primary">J. Miller (Senior Technician)</strong>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/40 min-w-[300px]">
          <div>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Operating Hours</span>
            <span className="text-lg font-mono font-bold text-on-surface">{machine.hours || '12,450 Hrs'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Target Delivery</span>
            <span className="text-lg font-mono font-bold text-secondary">{machine.deliveryDate || '24 Oct 2023'}</span>
          </div>
        </div>
      </div>

      {/* Reported Issue Summary Banner */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 text-amber-950 space-y-1">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-900">
          <span className="material-symbols-outlined text-base">report_problem</span>
          Clinical Reported Issue / Failure Code
        </div>
        <p className="text-sm font-semibold leading-relaxed m-0">
          "{machine.issue || 'High compressor vibration alarm during peak oxygen delivery.'}"
        </p>
      </div>

      {/* Main Diagnostics & Repair Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Engineering Checklist & Diagnostic Telemetry */}
        <div className="lg:col-span-7 space-y-6">
          {/* Engineering Diagnostic Checklist */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant space-y-4">
            <h2 className="text-base font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 border-b border-outline-variant/40 pb-3 m-0">
              <span className="material-symbols-outlined text-primary">checklist</span>
              Engineering Calibration & Overhaul Checklist
            </h2>

            <div className="space-y-3">
              {[
                { key: 'compressorChecked', label: `Inspect Main Motor Housing & Power Rails for ${machine.name}` },
                { key: 'sensorCalibrated', label: 'Zero-Point Sensor & Signal Transducer Recalibration' },
                { key: 'filterReplaced', label: 'Replace Intake Dust Filters & Acoustic Dampening Seals' },
                { key: 'batteryTested', label: 'Simulate Emergency Power Cut & Battery Discharge Rate Test' },
                { key: 'safetyCertSigned', label: 'Perform IEC 62353 Electrical Safety & Leakage Current Inspection' },
              ].map((item) => (
                <label
                  key={item.key}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    checklist[item.key]
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                      : 'bg-surface hover:bg-surface-container text-on-surface border-outline-variant/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.key]}
                    onChange={() => toggleCheck(item.key)}
                    className="w-5 h-5 text-primary rounded cursor-pointer"
                  />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Engineer Notes */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant space-y-3">
            <h2 className="text-base font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 border-b border-outline-variant/40 pb-3 m-0">
              <span className="material-symbols-outlined text-primary">edit_note</span>
              Technical Repair Notes & Findings
            </h2>
            <textarea
              rows="4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-surface p-3.5 rounded-xl border border-outline-variant text-sm font-medium text-on-surface outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Right Column: Spare Parts Replaced & Certificate Output */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant space-y-4">
            <h2 className="text-base font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 border-b border-outline-variant/40 pb-3 m-0">
              <span className="material-symbols-outlined text-primary">settings_input_component</span>
              Spare Parts Replaced for {machine.name}
            </h2>

            <div className="space-y-3">
              {replacedParts.map((part, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-surface border border-outline-variant/40 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-on-surface text-xs">{part.name}</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">Qty: {part.qty}</div>
                  </div>
                  <span className="font-mono font-bold text-primary text-xs">{part.cost}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Electrical & Biomedical Compliance Badge */}
          <div className="p-5 rounded-2xl bg-primary text-white space-y-2 shadow-md border border-primary/30">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="material-symbols-outlined text-emerald-400">verified_user</span>
              IEC 62353 Biomedical Safety Standard
            </div>
            <p className="text-xs opacity-90 leading-relaxed">
              All repairs meet hospital electrical leakage and pneumatic calibration tolerance benchmarks for {machine.name}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
