import React, { useState } from 'react';

export default function LogServiceModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    assetId: 'AST-8821-V',
    serviceType: 'Preventative Maintenance',
    technician: 'J. Miller',
    priority: 'Normal',
    notes: 'Routine calibration check and filter replacement.',
  });
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      if (onSave) onSave(formData);
      setSubmitted(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl">build</span>
            <h3 className="font-headline-sm font-semibold text-lg">Log Equipment Service</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Select Equipment Asset
            </label>
            <select
              value={formData.assetId}
              onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
              className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="AST-8821-V">Respironics V60 (AST-8821-V)</option>
              <option value="MRI-102">Siemens Magnetom MRI (MRI-102)</option>
              <option value="8992-A">Philips IntelliVue MX700 (8992-A)</option>
              <option value="DEF-402-B">Mindray BeneHeart D3 (DEF-402-B)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Service Type
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Preventative Maintenance">Preventative Maintenance</option>
                <option value="Emergency Repair">Emergency Repair</option>
                <option value="Calibration">Calibration Check</option>
                <option value="Recall Service">Recall Inspection</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Assigned Technician
              </label>
              <input
                type="text"
                value={formData.technician}
                onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Work Notes / Resolution Summary
            </label>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-surface border border-outline-variant rounded-lg p-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Describe findings, parts replaced, or service actions..."
            />
          </div>

          {/* Modal Footer */}
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
              disabled={submitted}
              className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow transition-all"
            >
              {submitted ? (
                <>
                  <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                  Logging Service...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">check</span>
                  Save Service Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
