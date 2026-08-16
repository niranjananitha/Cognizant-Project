import React, { useState } from 'react';
import { useEquipment } from '../../contexts/EquipmentContext';

export default function AdminEquipmentOverview({ searchQuery }) {
  const { assets } = useEquipment();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMachine, setSelectedMachine] = useState(null);

  const categories = ['All', 'Ventilators', 'Patient Monitors', 'Defibrillators', 'Infusion Pumps', 'Imaging Systems'];

  const filteredInventory = assets.filter((item) => {
    const matchSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;

    return matchSearch && matchCategory;
  });

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-200 text-slate-800">
      {/* Page Title */}
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-primary uppercase tracking-widest">
          <span className="material-symbols-outlined text-[16px]">biotech</span>
          Capital Asset Management
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 m-0 tracking-tight">Hospital Equipment Overview</h1>
        <p className="text-[14px] text-slate-500 m-0 font-medium mt-1">
          Refined capital equipment inventory, purchase history, department deployment, and backup readiness.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Category Filter:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <span className="text-[12px] font-mono font-semibold text-primary px-3 py-1 bg-primary/5 rounded-lg">Showing: {filteredInventory.length} Devices</span>
      </div>

      {/* Inventory Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInventory.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedMachine(item)}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-slate-200 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-medium rounded-md tracking-wider uppercase">
                  {item.category}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
                    item.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50'
                      : 'bg-amber-50 text-amber-700 border border-amber-100/50'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="flex items-start gap-5">
                <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center shrink-0">
                  <img src={item.img} alt={item.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                </div>
                <div className="mt-1">
                  <h3 className="text-[17px] font-semibold text-slate-900 group-hover:text-primary transition-colors m-0 leading-tight">
                    {item.name}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 mt-1.5 flex items-center gap-1">
                     <span className="material-symbols-outlined text-[14px]">tag</span> {item.id}
                  </div>
                  <div className="text-[12px] font-medium text-slate-500 mt-1 flex items-center gap-1">
                     <span className="material-symbols-outlined text-[14px]">location_on</span> {item.department}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-[12px]">
              <span className={`font-medium px-2.5 py-1 rounded-md border ${
                item.isBackupReady ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-amber-700 bg-amber-50 border-amber-100'
              }`}>
                {item.isBackupReady ? 'Ready for Backup' : 'In Use'}
              </span>
              <button className="font-semibold text-slate-500 group-hover:text-primary flex items-center gap-1 transition-colors">
                View Detailed Review <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Machine Review Modal */}
      {selectedMachine && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 space-y-6 relative overflow-hidden">
            <button
              onClick={() => setSelectedMachine(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <div className="flex items-start gap-6 border-b border-slate-100 pb-6">
              <div className="w-28 h-28 rounded-2xl bg-slate-50 border border-slate-100 p-3 flex items-center justify-center shrink-0">
                <img src={selectedMachine.img} alt={selectedMachine.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
              </div>
              <div className="space-y-2 mt-2">
                <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-[11px] font-medium rounded-md uppercase tracking-wider">
                  {selectedMachine.category}
                </span>
                <h2 className="text-2xl font-semibold text-slate-900 m-0 tracking-tight">{selectedMachine.name}</h2>
                <div className="text-[12px] font-mono text-slate-500 font-medium">
                  Asset ID: <span className="text-slate-800">{selectedMachine.id}</span> • SN: <span className="text-slate-800">{selectedMachine.serialNo}</span>
                </div>
              </div>
            </div>

            <p className="text-[14px] text-slate-600 leading-relaxed font-medium">{selectedMachine.clinicalUse}</p>

            <div className="grid grid-cols-2 gap-4 text-[13px] bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <span className="text-slate-400 block font-semibold text-[11px] uppercase tracking-wider">Department / Suite:</span>
                <strong className="text-slate-800 block">{selectedMachine.department}</strong>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block font-semibold text-[11px] uppercase tracking-wider">Location:</span>
                <strong className="text-slate-800 block">{selectedMachine.location}</strong>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block font-semibold text-[11px] uppercase tracking-wider">Purchase Date:</span>
                <strong className="text-slate-800 block font-mono">{selectedMachine.purchaseDate}</strong>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 block font-semibold text-[11px] uppercase tracking-wider">Warranty Coverage:</span>
                <strong className="text-emerald-700 block">{selectedMachine.warranty}</strong>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedMachine(null)}
                className="bg-slate-900 text-white font-medium px-5 py-2.5 rounded-xl text-[13px] shadow-sm hover:bg-slate-800 transition-colors"
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
