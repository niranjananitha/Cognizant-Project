import React, { useState } from 'react';
import { machineImages } from '../../assets/images';

export default function AdminEquipmentOverview({ searchQuery }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMachine, setSelectedMachine] = useState(null);

  const inventory = [
    {
      id: 'VEN-2023-8472',
      name: 'Respironics V60 Ventilator',
      category: 'Ventilators',
      dept: 'Intensive Care (ICU Bed 04)',
      purchaseDate: '15 Jan 2021',
      cost: '$32,000',
      status: 'Operational',
      backupStatus: 'Ready for Backup',
      serialNo: 'PH-V60-99824',
      hours: '12,450 Hrs',
      warranty: 'Active until Jan 2026',
      description: 'Advanced non-invasive and invasive ventilator for critical respiratory support in ICU.',
      img: machineImages.ventilator,
    },
    {
      id: 'MX700-04',
      name: 'IntelliVue MX700 Monitor',
      category: 'Patient Monitors',
      dept: 'Intensive Care (ICU Bed 01)',
      purchaseDate: '20 Aug 2022',
      cost: '$18,500',
      status: 'In Maintenance',
      backupStatus: 'Backup Deployed',
      serialNo: 'PH-MX700-1120',
      hours: '8,920 Hrs',
      warranty: 'Active until Aug 2025',
      description: 'High-acuity patient bedside monitor providing continuous ECG, NIBP, SpO2, and invasive pressure analytics.',
      img: machineImages.monitor,
    },
    {
      id: 'DEF-402-B',
      name: 'BeneHeart D3 Defibrillator',
      category: 'Defibrillators',
      dept: 'Emergency (ER Bay 02)',
      purchaseDate: '10 Nov 2020',
      cost: '$14,200',
      status: 'Operational',
      backupStatus: 'Ready for Backup',
      serialNo: 'MR-D3-44109',
      hours: '4,150 Hrs',
      warranty: 'Expired (Under AMC)',
      description: 'Biphasic defibrillator with integrated AED manual mode and external pacing capabilities.',
      img: machineImages.defibrillator,
    },
    {
      id: 'INF-3301-P',
      name: 'Alaris System Infusion Pump',
      category: 'Infusion Pumps',
      dept: 'Surgery OR-3',
      purchaseDate: '05 Mar 2022',
      cost: '$6,800',
      status: 'Operational',
      backupStatus: 'Ready for Backup',
      serialNo: 'BD-ALR-8841',
      hours: '6,300 Hrs',
      warranty: 'Active until Mar 2025',
      description: 'Modular volumetric infusion system with Guardrails safety software for precise medication delivery.',
      img: machineImages.infusionPump,
    },
    {
      id: 'MRI-102',
      name: 'Siemens Magnetom 3.0T MRI',
      category: 'Imaging Systems',
      dept: 'Radiology Room 102A',
      purchaseDate: '12 May 2019',
      cost: '$1,450,000',
      status: 'Operational',
      backupStatus: 'N/A (Primary Suite)',
      serialNo: 'SM-MAG-3001',
      hours: '18,600 Hrs',
      warranty: 'Comprehensive OEM Contract',
      description: 'High-field 3.0 Tesla magnetic resonance imaging suite with Tim+Dot technology.',
      img: machineImages.mri,
    },
  ];

  const categories = ['All', 'Ventilators', 'Patient Monitors', 'Defibrillators', 'Infusion Pumps', 'Imaging Systems'];

  const filteredInventory = inventory.filter((item) => {
    const matchSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dept.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;

    return matchSearch && matchCategory;
  });

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      {/* Page Title */}
      <div className="flex flex-col gap-2 border-b border-outline-variant/40 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
          <span className="material-symbols-outlined text-base">biotech</span>
          Capital Asset Management
        </div>
        <h1 className="font-display-lg text-3xl font-extrabold text-on-background m-0">Hospital Equipment Overview</h1>
        <p className="font-body-md text-sm text-on-surface-variant m-0">
          Refined capital equipment inventory, purchase history, department deployment, and backup readiness.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Category Filter:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow'
                  : 'bg-surface hover:bg-surface-container text-on-surface-variant border border-outline-variant/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono font-bold text-primary">Showing: {filteredInventory.length} Devices</span>
      </div>

      {/* Inventory Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInventory.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedMachine(item)}
            className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="px-3 py-1 bg-surface-container text-on-surface text-xs font-bold rounded-lg font-mono">
                  {item.category}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.status === 'Operational'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-surface-container-low border border-outline-variant/60 p-2 flex items-center justify-center shrink-0">
                  <img src={item.img} alt={item.name} className="max-h-full max-w-full object-contain" />
                </div>
                <div>
                  <h3 className="font-headline-sm text-lg font-bold text-on-surface group-hover:text-primary transition-colors m-0">
                    {item.name}
                  </h3>
                  <div className="text-xs font-mono font-bold text-primary mt-1">Asset ID: {item.id}</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">{item.dept}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-outline-variant/40 flex justify-between items-center text-xs">
              <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {item.backupStatus}
              </span>
              <button className="font-bold text-primary hover:underline flex items-center gap-1">
                View Detailed Review <span className="material-symbols-outlined text-sm">open_in_new</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Machine Review Modal */}
      {selectedMachine && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-outline-variant space-y-6 relative">
            <button
              onClick={() => setSelectedMachine(null)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="flex items-center gap-6 border-b border-outline-variant/40 pb-5">
              <div className="w-24 h-24 rounded-2xl bg-surface-container-low border border-outline-variant/60 p-3 flex items-center justify-center shrink-0">
                <img src={selectedMachine.img} alt={selectedMachine.name} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="space-y-1">
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full font-mono">
                  {selectedMachine.category}
                </span>
                <h2 className="font-display-lg text-2xl font-extrabold text-on-surface m-0">{selectedMachine.name}</h2>
                <div className="text-xs font-mono text-primary font-bold">Asset ID: {selectedMachine.id} • SN: {selectedMachine.serialNo}</div>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">{selectedMachine.description}</p>

            <div className="grid grid-cols-2 gap-4 text-xs bg-surface-container-low p-4 rounded-2xl border border-outline-variant/40">
              <div>
                <span className="text-on-surface-variant block font-medium">Department / Suite:</span>
                <strong className="text-on-surface text-sm">{selectedMachine.dept}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant block font-medium">Purchase Date:</span>
                <strong className="text-on-surface text-sm">{selectedMachine.purchaseDate}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant block font-medium">Capital Purchase Cost:</span>
                <strong className="text-primary text-sm font-mono">{selectedMachine.cost}</strong>
              </div>
              <div>
                <span className="text-on-surface-variant block font-medium">Warranty Coverage:</span>
                <strong className="text-emerald-700 text-sm">{selectedMachine.warranty}</strong>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedMachine(null)}
                className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow hover:bg-primary/90"
              >
                Close Detailed Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
