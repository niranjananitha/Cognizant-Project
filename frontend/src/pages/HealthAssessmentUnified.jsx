import React, { useState } from 'react';

export default function HealthAssessmentUnified({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('telemetry');
  const [formData, setFormData] = useState({
    temperature: 38.5,
    pressure: 14.2,
    hours: 12450,
    downtime: 12,
    usage: 'high',
    errorCode: 'ERR-042-T',
    observation: 'Slight vibration noticed near the compressor unit during high flow demands. Cooling fan running constantly.',
  });

  const [assessed, setAssessed] = useState(false);

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1400px] mx-auto">
      {/* Header Banner */}
      <div>
        <h1 className="font-display-lg text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-tertiary">
          Equipment Health Assessment - Unified System
        </h1>
        <p className="font-body-md text-on-surface-variant mt-1">
          Unified telemetry diagnostic console integrating real-time sensor streams and automated risk modeling.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/40 gap-4">
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'telemetry'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-lg">sensors</span>
          Live Sensor Telemetry
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-lg">monitoring</span>
          Predictive Maintenance Matrix
        </button>
      </div>

      {activeTab === 'telemetry' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white shadow">
                  <span className="material-symbols-outlined text-2xl">air</span>
                </div>
                <div>
                  <h2 className="font-headline-sm text-lg font-bold text-on-surface">Ventilator - Respironics V60</h2>
                  <p className="font-body-sm text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-sm">barcode_scanner</span>
                    Asset ID: VEN-2023-8472
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed rounded-lg font-label-sm text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border border-secondary-fixed-dim">
                <span className="w-2 h-2 rounded-full bg-primary" /> Active
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAssessed(true);
              }}
              className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant p-6 flex flex-col gap-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-tertiary" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                    Operating Temperature (°C)
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-secondary text-lg">thermostat</span>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-surface pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant text-sm text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                    System Pressure (cmH2O)
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-secondary text-lg">speed</span>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.pressure}
                      onChange={(e) => setFormData({ ...formData, pressure: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-surface pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant text-sm text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                    Total Operating Hours
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-secondary text-lg">schedule</span>
                    <input
                      type="number"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: parseInt(e.target.value) || 0 })}
                      className="w-full bg-surface pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant text-sm text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                    Recent Downtime (Hrs)
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-secondary text-lg">timer_off</span>
                    <input
                      type="number"
                      value={formData.downtime}
                      onChange={(e) => setFormData({ ...formData, downtime: parseInt(e.target.value) || 0 })}
                      className="w-full bg-surface pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant text-sm text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface uppercase tracking-wider">
                  Maintenance Observation Notes
                </label>
                <textarea
                  rows="3"
                  value={formData.observation}
                  onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                  className="w-full bg-surface p-3 rounded-lg border border-outline-variant text-sm text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-outline-variant/40">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 px-6 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 shadow"
                >
                  <span className="material-symbols-outlined text-lg">upload</span>
                  Execute Diagnostic Assessment
                </button>
              </div>
            </form>
          </div>

          {/* Unified AI Analysis Panel */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant p-6 flex flex-col gap-6">
              <h2 className="font-headline-md text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">psychology</span>
                Unified Diagnostic Assessment
              </h2>

              {assessed ? (
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-secondary/10 to-primary/10 border border-secondary/30 flex flex-col items-center justify-center text-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Predicted Equipment Reliability Score</span>
                    <span className="text-5xl font-extrabold text-primary">87 / 100</span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container">
                      Optimal Stability
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-semibold text-on-surface">
                      <span>Compressor Motor Vibration</span>
                      <span className="text-amber-600 font-bold">Elevated (1.4 mm/s)</span>
                    </div>
                    <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full w-[65%]" />
                    </div>

                    <div className="flex justify-between text-xs font-semibold text-on-surface">
                      <span>Thermal Dissipation Efficiency</span>
                      <span className="text-emerald-600 font-bold">Normal (38.5°C)</span>
                    </div>
                    <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[88%]" />
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('service-detail')}
                    className="w-full bg-primary text-white py-2.5 rounded-lg font-medium text-sm shadow hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">description</span>
                    Generate Complete Diagnostic Report
                  </button>
                </div>
              ) : (
                <div className="py-12 px-4 flex flex-col items-center justify-center text-center text-on-surface-variant gap-3">
                  <span className="material-symbols-outlined text-5xl text-outline-variant">sensors</span>
                  <p className="text-sm font-medium">Telemetry parameters active. Submit diagnostic assessment to evaluate sensor signals.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-on-surface">Predictive Maintenance Risk Matrix</h2>
          <p className="text-sm text-on-surface-variant">Automated failure probability modeling across department equipment clusters.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-2">
              <span className="text-xs font-bold text-on-surface-variant uppercase">ICU Ventilators</span>
              <div className="text-2xl font-bold text-primary">0.04 Failure Prob / Mo</div>
              <p className="text-xs text-on-surface-variant">Calculated from 12,450 cumulative operating hours.</p>
            </div>
            <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-2">
              <span className="text-xs font-bold text-on-surface-variant uppercase">ER Defibrillators</span>
              <div className="text-2xl font-bold text-amber-600">0.12 Failure Prob / Mo</div>
              <p className="text-xs text-on-surface-variant">Calibration overdue on 1 unit (DEF-402-B).</p>
            </div>
            <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-2">
              <span className="text-xs font-bold text-on-surface-variant uppercase">Radiology MRI</span>
              <div className="text-2xl font-bold text-emerald-600">0.01 Failure Prob / Mo</div>
              <p className="text-xs text-on-surface-variant">Cooling loop operating under standard specs.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
