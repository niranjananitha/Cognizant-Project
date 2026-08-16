import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEquipment } from '../contexts/EquipmentContext';
import { machineImages } from '../assets/images';

export default function EquipmentHealthAssessment({ onNavigate }) {
  const { token } = useAuth();
  const { assets, addServiceStationItem } = useEquipment();

  // Category filters
  const categoriesList = [
    { id: 'ventilators', name: 'Ventilators', catName: 'Ventilators', icon: 'air' },
    { id: 'monitors', name: 'Patient Monitors', catName: 'Patient Monitors', icon: 'monitor_heart' },
    { id: 'defibrillators', name: 'Defibrillators', catName: 'Defibrillators', icon: 'ecg_heart' },
    { id: 'pumps', name: 'Infusion Pumps', catName: 'Infusion Pumps', icon: 'vaccines' },
    { id: 'imaging', name: 'Imaging Systems', catName: 'Imaging Systems', icon: 'radiology' },
  ];

  const [selectedCategory, setSelectedCategory] = useState('ventilators');

  // Filter machines from live inventory by category
  const currentCatObj = categoriesList.find((c) => c.id === selectedCategory) || categoriesList[0];
  const currentMachines = assets.filter((a) => a.category?.toLowerCase() === currentCatObj.catName.toLowerCase());
  const fallbackMachine = assets[0] || {
    id: 'AST-8821-V',
    name: 'Respironics V60 Ventilator',
    location: 'ICU - Bed 04',
    department: 'Intensive Care (ICU)',
    status: 'Active',
    category: 'Ventilators',
    manufacturer: 'Philips Healthcare',
  };

  const [selectedMachineId, setSelectedMachineId] = useState(currentMachines[0]?.id || fallbackMachine.id);

  const selectedMachine =
    assets.find((m) => m.id === selectedMachineId) ||
    currentMachines[0] ||
    fallbackMachine;

  const [formData, setFormData] = useState({
    temperature: 38.5,
    pressure: 14.2,
    hours: 12450,
    downtime: 12,
    batteryVoltage: 12.4,
    flowRate: 45.0,
    errorCode: 'ERR-042-T',
    observation: 'Slight compressor motor vibration noted during peak flow demand. Cooling fan running continuously.',
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    const cat = categoriesList.find((c) => c.id === catId);
    const filtered = assets.filter((a) => a.category?.toLowerCase() === cat.catName.toLowerCase());
    if (filtered.length > 0) {
      setSelectedMachineId(filtered[0].id);
    }
  };

  const handleDiagnose = async (e) => {
    e.preventDefault();
    setAnalyzing(true);
    setActionSuccess(null);

    const payload = {
      machine_name: selectedMachine.name,
      category: selectedMachine.category || currentCatObj.catName,
      operating_temperature_c: Number(formData.temperature),
      system_pressure_cmh2o: Number(formData.pressure),
      total_operating_hours: Number(formData.hours),
      recent_downtime_hours: Number(formData.downtime),
      backup_battery_voltage_v: Number(formData.batteryVoltage),
      flow_rate_lmin: Number(formData.flowRate),
      system_error_code: formData.errorCode ? formData.errorCode.trim() : 'NONE',
      days_since_service: 90,
      clinical_notes: formData.observation,
    };

    try {
      // Call FastAPI ML Server with JWT token for authenticated access
      const res = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('API server returned error');
      const data = await res.json();

      const healthIndex = Math.max(0, Math.round(100 - data.failure_probability));

      setDiagnosisResult({
        healthIndex,
        riskScore: data.failure_probability,
        riskLevel: data.is_failure_risk ? 'Failure Risk Detected' : 'Optimal Operating State',
        diagnosisTitle: data.is_failure_risk
          ? `Predicted Machine Failure (Risk: ${data.failure_probability}%)`
          : 'Normal Telemetry & Nominal Operation',
        recommendation: `Recommended Maintenance Action: ${data.recommended_fix_category}`,
        fixCategory: data.recommended_fix_category,
        modelUsed: data.model_used,
        nextInspection: data.is_failure_risk ? 'Immediate (Within 48 hrs)' : '60 Days',
        timestamp: new Date().toLocaleString(),
      });
    } catch (err) {
      console.warn('FastAPI backend server unavailable. Using fallback ML telemetry calculation.', err);

      // Fallback calculation
      const tempRisk = formData.temperature > 40.0 ? 40 : 10;
      const voltageRisk = formData.batteryVoltage < 11.5 ? 35 : 10;
      const errorRisk = formData.errorCode && formData.errorCode.toUpperCase() !== 'NONE' ? 25 : 0;
      const totalRisk = Math.min(100, tempRisk + voltageRisk + errorRisk);
      const healthIndex = Math.max(0, 100 - totalRisk);

      setDiagnosisResult({
        healthIndex,
        riskScore: totalRisk,
        riskLevel: totalRisk > 50 ? 'Failure Risk Detected' : 'Optimal Operating State',
        diagnosisTitle: totalRisk > 50 ? 'Telemetry Anomaly & Thermal/Pressure Drift' : 'Normal Telemetry Operation',
        recommendation: totalRisk > 50 ? 'Recommended Fix Category: Thermal/Cooling & Calibration' : 'Routine Maintenance & Inspection',
        fixCategory: totalRisk > 50 ? 'Thermal/Cooling' : 'Mechanical/PM',
        modelUsed: 'Client Rule Engine Fallback',
        nextInspection: totalRisk > 50 ? 'Immediate (Within 48 hrs)' : '60 Days',
        timestamp: new Date().toLocaleString(),
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Dispatch machine to Service Station with selected action type
  const handleDispatchToServiceStation = (actionType) => {
    if (!diagnosisResult) return;

    const reasonText = `${diagnosisResult.recommendation} | ML Health Index: ${diagnosisResult.healthIndex}% (Failure Risk: ${diagnosisResult.riskScore}%). Symptoms: ${formData.observation}`;
    const priorityLevel = diagnosisResult.riskScore > 70 ? 'Critical' : (diagnosisResult.riskScore > 40 ? 'High' : 'Medium');

    addServiceStationItem({
      id: selectedMachine.id,
      name: selectedMachine.name,
      category: selectedMachine.category,
      department: selectedMachine.department,
      actionType: actionType,
      reason: reasonText,
      priority: priorityLevel,
      riskScore: diagnosisResult.riskScore,
    });

    setActionSuccess(`Machine ${selectedMachine.name} (${selectedMachine.id}) successfully dispatched to Service Station under [${actionType}]!`);

    setTimeout(() => {
      onNavigate('service-station');
    }, 1200);
  };

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="flex flex-col gap-2 border-b border-outline-variant/40 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
          <span className="material-symbols-outlined text-base">health_and_safety</span>
          Medical Equipment Diagnostics & AI Triage
        </div>
        <h1 className="font-display-lg text-3xl font-extrabold text-on-background m-0">Equipment Health Entry & Prediction</h1>
        <p className="font-body-md text-sm text-on-surface-variant m-0">
          Enter live telemetry readings and run XGBoost Machine Learning triage to send at-risk equipment to Service, Recall, or Replacement.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-sm flex items-center gap-3 animate-in fade-in">
          <span className="material-symbols-outlined text-emerald-700">check_circle</span>
          <span>{actionSuccess} Redirecting to Service Station...</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Category & Machine Selection + Medical Telemetry Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Select Category */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant flex flex-col gap-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2 m-0">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-extrabold">1</span>
              Select Category & Machine
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categoriesList.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-2 ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-surface hover:bg-surface-container text-on-surface border-outline-variant/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{cat.icon}</span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Select Specific Machine Dropdown */}
            <div className="mt-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Select Specific Machine in Hospital Fleet:
              </label>
              <select
                value={selectedMachine.id}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm cursor-pointer"
              >
                {currentMachines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — ({m.id}) [{m.department}]
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Machine Identity Card */}
            <div className="mt-2 p-4 rounded-xl bg-secondary-container/10 border border-secondary-container/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-center shrink-0 shadow p-1 overflow-hidden">
                  <img src={selectedMachine.img || machineImages.ventilator} alt={selectedMachine.name} className="max-h-full max-w-full object-contain" />
                </div>
                <div>
                  <div className="font-bold text-on-surface text-sm">{selectedMachine.name}</div>
                  <div className="text-xs text-on-surface-variant flex items-center gap-2 font-mono mt-0.5">
                    <span>ID: <strong className="text-primary font-bold">{selectedMachine.id}</strong></span>
                    <span>•</span>
                    <span>Dept: {selectedMachine.department}</span>
                  </div>
                </div>
              </div>
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full border ${
                  selectedMachine.status === 'Active'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {selectedMachine.status}
              </span>
            </div>
          </div>

          {/* Medical Telemetry Inputs Form */}
          <form onSubmit={handleDiagnose} className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2 m-0 border-b border-outline-variant/40 pb-3">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-extrabold">2</span>
              Enter Clinical Telemetry & Sensor Readings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Operating Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  className="w-full bg-surface border border-outline-variant rounded-xl p-3 font-mono font-bold outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  System Pressure (cmH2O)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.pressure}
                  onChange={(e) => setFormData({ ...formData, pressure: e.target.value })}
                  className="w-full bg-surface border border-outline-variant rounded-xl p-3 font-mono font-bold outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Total Operating Hours
                </label>
                <input
                  type="number"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  className="w-full bg-surface border border-outline-variant rounded-xl p-3 font-mono font-bold outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Recent Downtime (Hours)
                </label>
                <input
                  type="number"
                  value={formData.downtime}
                  onChange={(e) => setFormData({ ...formData, downtime: e.target.value })}
                  className="w-full bg-surface border border-outline-variant rounded-xl p-3 font-mono font-bold outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Battery / Backup Voltage (V)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.batteryVoltage}
                  onChange={(e) => setFormData({ ...formData, batteryVoltage: e.target.value })}
                  className="w-full bg-surface border border-outline-variant rounded-xl p-3 font-mono font-bold outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Flow Rate (L/min)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.flowRate}
                  onChange={(e) => setFormData({ ...formData, flowRate: e.target.value })}
                  className="w-full bg-surface border border-outline-variant rounded-xl p-3 font-mono font-bold outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                Active System Error Code (if any)
              </label>
              <input
                type="text"
                placeholder="e.g. ERR-042-T or NONE"
                value={formData.errorCode}
                onChange={(e) => setFormData({ ...formData, errorCode: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-xl p-3 font-mono font-bold outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                Clinical Observation Notes
              </label>
              <textarea
                rows="3"
                value={formData.observation}
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-xl p-3 font-medium outline-none focus:border-primary"
                placeholder="Describe any abnormal vibrations, sounds, heating, or calibration drift observed..."
              />
            </div>

            <button
              type="submit"
              disabled={analyzing}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <span className="material-symbols-outlined text-xl animate-spin">sync</span>
                  Running XGBoost Machine Learning Model...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-xl">psychology</span>
                  Run Machine Health Prediction
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: AI Machine Diagnosis Output Panel */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant p-6 flex flex-col gap-6 sticky top-24">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
              <h2 className="font-headline-md text-lg font-extrabold text-on-surface flex items-center gap-2 m-0">
                <span className="material-symbols-outlined text-primary">analytics</span>
                Machine Diagnosis Report
              </h2>
              <span className="text-[11px] font-mono text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-full">
                XGBoost ML API
              </span>
            </div>

            {diagnosisResult ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Machine Info */}
                <div className="text-xs text-on-surface-variant font-mono bg-surface p-3 rounded-xl border border-outline-variant/40">
                  <div className="font-bold text-on-surface text-sm">{selectedMachine.name}</div>
                  <div>Asset ID: {selectedMachine.id} • Dept: {selectedMachine.department}</div>
                </div>

                {/* Score Gauge */}
                <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col items-center justify-center text-center gap-2 shadow-inner">
                  <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Overall Health Index</span>
                  <span
                    className={`text-5xl font-extrabold ${
                      diagnosisResult.healthIndex < 40 ? 'text-error' : diagnosisResult.healthIndex < 70 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {diagnosisResult.healthIndex}%
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      diagnosisResult.healthIndex < 40
                        ? 'bg-error-container text-on-error-container'
                        : diagnosisResult.healthIndex < 70
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {diagnosisResult.riskLevel}
                  </span>
                </div>

                {/* Machine Diagnosis Summary */}
                <div className="p-4 rounded-xl bg-surface border border-outline-variant/60 space-y-2">
                  <div className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base">diagnosis</span>
                    Predicted Fix Recommendation
                  </div>
                  <div className="text-base font-extrabold text-on-surface">{diagnosisResult.fixCategory}</div>
                  <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
                    {diagnosisResult.recommendation}
                  </p>
                </div>

                {/* Technical Indicators */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                    <span className="text-on-surface-variant block font-bold">Failure Probability</span>
                    <span className="text-base font-extrabold text-error font-mono">{diagnosisResult.riskScore}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                    <span className="text-on-surface-variant block font-bold">Action Window</span>
                    <span className="text-base font-extrabold text-primary">{diagnosisResult.nextInspection}</span>
                  </div>
                </div>

                {/* Task 1 Action Dispatch Buttons */}
                <div className="border-t border-outline-variant/40 pt-4 space-y-3">
                  <div className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Take Action (Dispatch to Service Station):
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => handleDispatchToServiceStation('Service')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">build</span>
                      Send to Service (Maintenance)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDispatchToServiceStation('Recall')}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">assignment_return</span>
                      Initiate Safety Recall
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDispatchToServiceStation('Replaced')}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">published_with_changes</span>
                      Order Unit Replacement
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('service-history')}
                      className="w-full bg-surface-container text-on-surface hover:bg-surface-container-high py-2.5 rounded-xl font-bold text-xs border border-outline-variant/40 transition-all flex items-center justify-center gap-2 mt-1"
                    >
                      <span className="material-symbols-outlined text-base">history</span>
                      View Service History Log
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 px-4 flex flex-col items-center justify-center text-center text-on-surface-variant gap-4">
                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-outline-variant">
                  <span className="material-symbols-outlined text-3xl">biotech</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface m-0 mb-1">Awaiting Telemetry Input</h3>
                  <p className="text-xs text-on-surface-variant m-0 max-w-xs">
                    Select a machine and click "Run Machine Health Prediction" to triage equipment into Service, Recall, or Replacement.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
