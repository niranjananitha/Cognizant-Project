import React, { useState } from 'react';

export default function EquipmentHealthAssessment({ onNavigate }) {
  // Available categories and machines mapping
  const categoriesList = [
    { id: 'ventilators', name: 'Ventilators', catName: 'Ventilators' },
    { id: 'monitors', name: 'Patient Monitors', catName: 'Patient Monitors' },
    { id: 'defibrillators', name: 'Defibrillators', catName: 'Defibrillators' },
    { id: 'pumps', name: 'Infusion Pumps', catName: 'Infusion Pumps' },
    { id: 'imaging', name: 'Imaging Systems', catName: 'Imaging Systems' },
    { id: 'dialysis', name: 'Dialysis Machines', catName: 'Dialysis Machines' },
  ];

  const machinesByCategory = {
    ventilators: [
      { id: 'VEN-2023-8472', name: 'Respironics V60 Ventilator', location: 'ICU - Bed 04', dept: 'Intensive Care', status: 'Active', manufacturer: 'Philips' },
      { id: 'VEN-2023-9001', name: 'Servo-u ICU Ventilator', location: 'ICU - Bed 08', dept: 'Intensive Care', status: 'Active', manufacturer: 'Getinge' },
    ],
    monitors: [
      { id: 'MX700-04', name: 'IntelliVue MX700 Monitor', location: 'ICU - Bed 01', dept: 'Intensive Care', status: 'Active', manufacturer: 'Philips' },
      { id: 'MON-B650-01', name: 'GE Carescape B650', location: 'ICU - Bed 08', dept: 'Intensive Care', status: 'Active', manufacturer: 'GE HealthCare' },
    ],
    defibrillators: [
      { id: 'DEF-402-B', name: 'BeneHeart D3 Defibrillator', location: 'ER Bay 02', dept: 'Emergency', status: 'Maintenance', manufacturer: 'Mindray' },
      { id: 'DEF-ZOL-03', name: 'Zoll R Series / AED Plus', location: 'CCU - Bed 02', dept: 'Cardiology', status: 'Active', manufacturer: 'Zoll Medical' },
    ],
    pumps: [
      { id: 'INF-3301-P', name: 'Alaris System Infusion Pump', location: 'OR-3', dept: 'Surgery', status: 'Active', manufacturer: 'BD Alaris' },
      { id: 'INF-ALR-05', name: 'BD Alaris System', location: 'Pediatrics Room 204', dept: 'Pediatrics', status: 'Active', manufacturer: 'BD CareFusion' },
    ],
    imaging: [
      { id: 'MRI-102', name: 'Siemens Magnetom 3.0T MRI', location: 'Radiology Suite 1', dept: 'Radiology', status: 'Active', manufacturer: 'Siemens Healthineers' },
      { id: 'IMG-XRAY-08', name: 'Siemens Mobilett Elara Max X-ray', location: 'Radiology Suite 3', dept: 'Radiology', status: 'Active', manufacturer: 'Siemens' },
    ],
    dialysis: [
      { id: 'DIA-801-K', name: 'Fresenius 5008S Hemodialysis', location: 'Renal Unit Bay 04', dept: 'Nephrology', status: 'Active', manufacturer: 'Fresenius Medical' },
    ],
  };

  const [selectedCategory, setSelectedCategory] = useState('ventilators');
  const [selectedMachineId, setSelectedMachineId] = useState('VEN-2023-8472');

  const currentMachines = machinesByCategory[selectedCategory] || [];
  const selectedMachine = currentMachines.find((m) => m.id === selectedMachineId) || currentMachines[0] || {
    id: 'VEN-2023-8472',
    name: 'Respironics V60 Ventilator',
    location: 'ICU - Bed 04',
    dept: 'Intensive Care',
    status: 'Active',
    manufacturer: 'Philips',
  };

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

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    const available = machinesByCategory[catId] || [];
    if (available.length > 0) {
      setSelectedMachineId(available[0].id);
    }
  };

  const handleDiagnose = async (e) => {
    e.preventDefault();
    setAnalyzing(true);

    const currentCatObj = categoriesList.find((c) => c.id === selectedCategory);
    const categoryName = currentCatObj ? currentCatObj.catName : 'Ventilators';

    const payload = {
      machine_name: selectedMachine.name,
      category: categoryName,
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
      // Call FastAPI ML Server
      const res = await fetch('http://localhost:8000/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="p-8 flex flex-col gap-8 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="flex flex-col gap-2 border-b border-outline-variant/40 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
          <span className="material-symbols-outlined text-base">health_and_safety</span>
          Medical Equipment Diagnostics
        </div>
        <h1 className="font-display-lg text-3xl font-extrabold text-on-background m-0">Equipment Health Entry</h1>
        <p className="font-body-md text-sm text-on-surface-variant m-0">
          Select equipment category and machine, enter live telemetry readings, and run XGBoost Machine Learning diagnosis.
        </p>
      </div>

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
                    <span className="material-symbols-outlined text-base">
                      {cat.id === 'ventilators'
                        ? 'air'
                        : cat.id === 'monitors'
                        ? 'monitor_heart'
                        : cat.id === 'defibrillators'
                        ? 'ecg_heart'
                        : cat.id === 'pumps'
                        ? 'vaccines'
                        : cat.id === 'imaging'
                        ? 'radiology'
                        : 'water_drop'}
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Step 2: Select Specific Machine Dropdown */}
            <div className="mt-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                Select Specific Machine:
              </label>
              <select
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-sm font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm cursor-pointer"
              >
                {currentMachines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — ({m.id}) [{m.dept}]
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Machine Identity Card */}
            <div className="mt-2 p-4 rounded-xl bg-secondary-container/10 border border-secondary-container/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold shadow">
                  <span className="material-symbols-outlined text-xl">medical_services</span>
                </div>
                <div>
                  <div className="font-bold text-on-surface text-sm">{selectedMachine.name}</div>
                  <div className="text-xs text-on-surface-variant flex items-center gap-2 font-mono mt-0.5">
                    <span>ID: {selectedMachine.id}</span>
                    <span>•</span>
                    <span>Loc: {selectedMachine.location}</span>
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
                {selectedMachine.status}
              </span>
            </div>
          </div>

          {/* Medical Telemetry Inputs Form */}
          <form
            onSubmit={handleDiagnose}
            className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant flex flex-col gap-6"
          >
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2 m-0">
              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-extrabold">2</span>
              Enter Medical Health & Telemetry Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Operating Temp */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Operating Temperature (°C)
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-lg">thermostat</span>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-surface pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                  />
                </div>
              </div>

              {/* System Pressure */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  System Pressure (cmH2O / Output)
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-lg">speed</span>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.pressure}
                    onChange={(e) => setFormData({ ...formData, pressure: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-surface pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Total Operating Hours */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Total Operating Hours
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-lg">schedule</span>
                  <input
                    type="number"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: parseInt(e.target.value) || 0 })}
                    className="w-full bg-surface pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Downtime */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Recent Downtime (Hours)
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-lg">timer_off</span>
                  <input
                    type="number"
                    value={formData.downtime}
                    onChange={(e) => setFormData({ ...formData, downtime: parseInt(e.target.value) || 0 })}
                    className="w-full bg-surface pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Battery Voltage */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Backup Battery Voltage (V)
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-lg">battery_charging_full</span>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.batteryVoltage}
                    onChange={(e) => setFormData({ ...formData, batteryVoltage: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-surface pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              {/* Flow Rate */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Flow Rate / Output Stability (L/min)
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-lg">waves</span>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.flowRate}
                    onChange={(e) => setFormData({ ...formData, flowRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-surface pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Error Code & Observation */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  System Error Code (If Displayed)
                </label>
                <input
                  type="text"
                  value={formData.errorCode}
                  onChange={(e) => setFormData({ ...formData, errorCode: e.target.value })}
                  placeholder="e.g. ERR-042-T"
                  className="w-full bg-surface px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-mono text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none uppercase font-bold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Maintenance Observation & Clinical Notes
                </label>
                <textarea
                  rows="3"
                  value={formData.observation}
                  onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                  className="w-full bg-surface p-3 rounded-xl border border-outline-variant text-sm text-on-surface font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-y"
                  placeholder="Note any physical wear, unusual noise, fan speed, or calibration drift..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-outline-variant/50">
              <button
                type="submit"
                disabled={analyzing}
                className="bg-gradient-to-r from-primary to-secondary text-white hover:opacity-95 px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg cursor-pointer"
              >
                {analyzing ? (
                  <>
                    <span className="material-symbols-outlined text-xl animate-spin">sync</span>
                    Executing ML Inference...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">psychology</span>
                    Run Machine Diagnosis
                  </>
                )}
              </button>
            </div>
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
                  <div>Asset ID: {selectedMachine.id} • Dept: {selectedMachine.dept}</div>
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
                    Predicted Fix Category
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

                <div className="text-[11px] font-mono text-on-surface-variant text-center">
                  Engine: <strong className="text-primary">{diagnosisResult.modelUsed}</strong>
                </div>

                <button
                  onClick={() => onNavigate('service-history')}
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm shadow hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">history</span>
                  Save Diagnosis & View Service History
                </button>
              </div>
            ) : (
              <div className="py-16 px-4 flex flex-col items-center justify-center text-center text-on-surface-variant gap-4">
                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-outline-variant">
                  <span className="material-symbols-outlined text-3xl">biotech</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface m-0 mb-1">Awaiting Diagnosis Submission</h3>
                  <p className="text-xs text-on-surface-variant m-0 max-w-xs">
                    Select a machine and submit health parameters to run real-time Machine Learning risk predictions.
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
