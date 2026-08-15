import React, { useState } from 'react';

export default function AddEquipmentModal({ isOpen, onClose, onAdd }) {
  const machineOptions = {
    Ventilators: [
      'Respironics V60 Ventilator',
      'Servo-u ICU Ventilator',
    ],
    'Patient Monitors': [
      'IntelliVue MX700 Monitor',
      'GE Carescape B650',
      'Mindray BeneVision N15',
    ],
    Defibrillators: [
      'BeneHeart D3 Defibrillator',
      'Zoll R Series / AED Plus',
      'Physio-Control LIFEPAK 15/20e',
    ],
    'Infusion Pumps': [
      'Alaris System Infusion Pump',
      'BD Alaris System',
      'Fresenius Kabi Agilia',
    ],
    'Imaging Systems': [
      'Siemens Magnetom 3.0T MRI',
      'GE OEC 3D C-Arm',
      'Siemens Mobilett Elara Max X-ray',
      'Fujifilm Sonosite Ultrasound',
    ],
  };

  const [equipment, setEquipment] = useState({
    id: `AST-${Math.floor(1000 + Math.random() * 9000)}-M`,
    category: 'Patient Monitors',
    name: 'IntelliVue MX700 Monitor',
    department: 'Intensive Care (ICU)',
    location: 'Room 201-B',
    status: 'Optimal',
    riskLevel: 'Low',
  });

  if (!isOpen) return null;

  const handleCategoryChange = (cat) => {
    const defaultName = machineOptions[cat]?.[0] || '';
    setEquipment({ ...equipment, category: cat, name: defaultName });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!equipment.name) return;
    if (onAdd) onAdd(equipment);
    onClose();
  };

  const availableMachines = machineOptions[equipment.category] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">add_box</span>
            <h3 className="font-headline-sm font-semibold text-lg">Add New Equipment Asset</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Asset ID Code
              </label>
              <input
                type="text"
                value={equipment.id}
                onChange={(e) => setEquipment({ ...equipment, id: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={equipment.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Patient Monitors">Patient Monitors</option>
                <option value="Defibrillators">Defibrillators</option>
                <option value="Infusion Pumps">Infusion Pumps</option>
                <option value="Imaging Systems">Imaging Systems</option>
                <option value="Ventilators">Ventilators</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Machine Name * (Dropdown Select)
            </label>
            <select
              value={equipment.name}
              onChange={(e) => setEquipment({ ...equipment, name: e.target.value })}
              className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              {availableMachines.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={equipment.department}
                onChange={(e) => setEquipment({ ...equipment, department: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Intensive Care (ICU)">Intensive Care (ICU)</option>
                <option value="Emergency (ER)">Emergency (ER)</option>
                <option value="Radiology">Radiology</option>
                <option value="Surgery">Surgery</option>
                <option value="Oncology">Oncology</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Risk Classification
              </label>
              <select
                value={equipment.riskLevel}
                onChange={(e) => setEquipment({ ...equipment, riskLevel: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Specific Room Location
            </label>
            <input
              type="text"
              value={equipment.location}
              onChange={(e) => setEquipment({ ...equipment, location: e.target.value })}
              className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="pt-4 border-t border-outline-variant/40 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-outline-variant text-sm font-medium hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow transition-all font-bold"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Add Machine to Inventory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
