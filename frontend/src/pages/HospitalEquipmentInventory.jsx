import React, { useState } from 'react';
import { useEquipment } from '../contexts/EquipmentContext';
import { machineImages } from '../assets/images';

export default function HospitalEquipmentInventory({ onNavigate, onAddClick, searchQuery, currentUserRole }) {
  const { assets, addEquipment, deleteEquipment } = useEquipment();

  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toastNotice, setToastNotice] = useState(null);

  const showToast = (msg) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Preset machine choices for dropdown select
  const machineChoices = {
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

  // New Machine Form State
  const [newMachine, setNewMachine] = useState({
    name: 'IntelliVue MX700 Monitor',
    category: 'Patient Monitors',
    department: 'Intensive Care (ICU)',
    location: 'ICU - Bed 10',
    purchaseDate: new Date().toISOString().split('T')[0],
    clinicalUse: 'Continuous multi-parameter hemodynamic vital signs monitoring in intensive care unit.',
    manufacturer: 'Philips Healthcare',
    serialNo: '',
    isBackupReady: true,
  });

  const categories = ['All', 'Ventilators', 'Patient Monitors', 'Defibrillators', 'Imaging Systems', 'Infusion Pumps'];

  // Metrics computation
  const totalHospitalDevices = assets.length;
  const readyBackupDevices = assets.filter((a) => a.isBackupReady).length;
  const activeOperational = assets.filter((a) => a.status === 'Active' || a.status === 'AVAILABLE').length;

  const filteredAssets = assets.filter((item) => {
    const matchSearch =
      !searchQuery ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;

    return matchSearch && matchCategory;
  });

  const handleCategorySelectChange = (cat) => {
    const defaultName = machineChoices[cat]?.[0] || '';
    setNewMachine({ ...newMachine, category: cat, name: defaultName });
  };

  const handleAddMachineSubmit = async (e) => {
    e.preventDefault();
    if (!newMachine.name) return;

    const created = await addEquipment(newMachine);
    setShowAddModal(false);
    showToast(`Machine ${created.name} (${created.id}) added to Hospital Inventory & database!`);
  };

  const handleDelete = async (e, machineId) => {
    e.stopPropagation();
    setDeleteConfirmId(machineId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    const target = assets.find((a) => a.id === deleteConfirmId);
    await deleteEquipment(deleteConfirmId);
    if (selectedMachine && selectedMachine.id === deleteConfirmId) {
      setSelectedMachine(null);
    }
    setDeleteConfirmId(null);
    showToast(`Machine ${target?.name || deleteConfirmId} removed from inventory & database!`);
  };

  // If a user clicks a machine, show the Detailed Review Page (In-Place)
  if (selectedMachine) {
    // Read live asset from list in case it changed
    const liveAsset = assets.find((a) => a.id === selectedMachine.id) || selectedMachine;

    return (
      <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-200">
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedMachine(null)}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 bg-surface-container px-4 py-2 rounded-xl border border-outline-variant/50 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Hospital Equipment Inventory
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('health-assessment')}
              className="text-xs font-bold text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-xl shadow flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">health_and_safety</span>
              Run Health Assessment
            </button>

            {/* Delete Button */}
            <button
              onClick={(e) => handleDelete(e, liveAsset.id)}
              className="text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 border border-red-300 px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Delete Machine
            </button>
          </div>
        </div>

        {/* Detailed Machine Review Header Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant flex flex-col lg:flex-row gap-8 justify-between items-start">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-center shrink-0 shadow p-2 overflow-hidden">
              <img src={liveAsset.img || machineImages.ventilator} alt={liveAsset.name} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-primary-container text-on-primary-container text-xs font-bold rounded-lg uppercase tracking-wider">
                  {liveAsset.category}
                </span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
                  {liveAsset.status}
                </span>
                {liveAsset.isBackupReady && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full border border-blue-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">verified</span> Ready for Backup
                  </span>
                )}
              </div>

              <h1 className="font-display-lg text-3xl font-extrabold text-on-surface m-0">{liveAsset.name}</h1>

              <div className="flex items-center gap-4 text-xs font-mono text-on-surface-variant flex-wrap mt-1">
                <span>Asset ID: <strong className="text-primary font-bold">{liveAsset.id}</strong></span>
                <span>•</span>
                <span>Serial #: <strong className="text-on-surface">{liveAsset.serialNo}</strong></span>
                <span>•</span>
                <span>Dept: <strong className="text-on-surface">{liveAsset.department}</strong></span>
                <span>•</span>
                <span>Manufacturer: <strong className="text-on-surface">{liveAsset.manufacturer}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-surface-container-low p-4 rounded-xl border border-outline-variant/40 min-w-[240px]">
            <div className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Health Assessment Score</div>
            <div className="text-3xl font-extrabold text-primary flex items-center gap-2">
              {liveAsset.health}%
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {liveAsset.health > 70 ? 'Operational' : 'Check Telemetry'}
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-primary rounded-full" style={{ width: `${liveAsset.health}%` }} />
            </div>
          </div>
        </div>

        {/* Detailed Specs & Review Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant space-y-4">
              <h2 className="text-base font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 border-b border-outline-variant/40 pb-3 m-0">
                <span className="material-symbols-outlined text-primary">clinical_notes</span>
                Primary Clinical Use & Description
              </h2>
              <p className="text-sm text-on-surface leading-relaxed font-medium">
                {liveAsset.clinicalUse}
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant space-y-4">
              <h2 className="text-base font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 border-b border-outline-variant/40 pb-3 m-0">
                <span className="material-symbols-outlined text-primary">shopping_bag</span>
                Purchase & Procurement History
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-surface border border-outline-variant/40">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Purchase Date</span>
                  <span className="text-base font-bold text-on-surface flex items-center gap-1.5 font-mono">
                    <span className="material-symbols-outlined text-primary text-lg">calendar_today</span>
                    {liveAsset.purchaseDate}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-outline-variant/40">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Warranty Status</span>
                  <span className="text-sm font-bold text-secondary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-lg">verified_user</span>
                    {liveAsset.warranty}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-outline-variant/40">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Backup Readiness</span>
                  <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">shield_with_heart</span>
                    {liveAsset.isBackupReady ? 'Ready for Immediate Standby' : 'Standard Operational'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant space-y-4">
              <h2 className="text-base font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 border-b border-outline-variant/40 pb-3 m-0">
                <span className="material-symbols-outlined text-primary">room</span>
                Location & Clinical Unit
              </h2>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-on-surface-variant block font-semibold">Department:</span>
                  <span className="font-bold text-on-surface text-sm">{liveAsset.department}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block font-semibold">Room / Bay Location:</span>
                  <span className="font-bold text-on-surface text-sm">{liveAsset.location}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block font-semibold">Next Scheduled Maintenance:</span>
                  <span className="font-mono font-bold text-primary text-sm">{liveAsset.nextPM}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-2xl border border-outline-variant space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <span className="material-symbols-outlined text-2xl">warning</span>
                <h3 className="font-bold text-lg text-on-surface m-0">Confirm Equipment Deletion</h3>
              </div>
              <p className="text-sm text-on-surface-variant">
                Are you sure you want to delete <strong>{liveAsset.name} ({liveAsset.id})</strong>? This will remove the machine from inventory and database.
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-outline-variant"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow"
                >
                  Yes, Delete Machine
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/40 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
            <span className="material-symbols-outlined text-base">inventory_2</span>
            Hospital Master Catalog & Fleet
          </div>
          <h1 className="font-display-lg text-3xl font-bold text-on-background mt-1 m-0">Hospital Equipment Inventory</h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-1">
            Comprehensive registry of all medical machines, active telemetry status, and equipment management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            Add Machine to Inventory
          </button>
        </div>
      </div>

      {toastNotice && (
        <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-sm flex items-center gap-3 animate-in fade-in">
          <span className="material-symbols-outlined text-emerald-700">check_circle</span>
          <span>{toastNotice}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Total Fleet Devices</div>
            <div className="text-4xl font-extrabold text-primary mt-2">{totalHospitalDevices}</div>
            <div className="text-xs text-on-surface-variant font-medium mt-1">Hospital-wide catalog assets</div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">medical_information</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-900">Active Operational</div>
            <div className="text-4xl font-extrabold text-emerald-700 mt-2">{activeOperational}</div>
            <div className="text-xs text-emerald-800 font-medium mt-1">In active patient clinical use</div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-900">Emergency Backup Ready</div>
            <div className="text-4xl font-extrabold text-blue-700 mt-2">{readyBackupDevices}</div>
            <div className="text-xs text-blue-800 font-medium mt-1">Standby ready for emergency transfer</div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">shield_with_heart</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-900">In Service / Maintenance</div>
            <div className="text-4xl font-extrabold text-amber-700 mt-2">
              {assets.filter((a) => a.status === 'Maintenance' || a.status === 'Recall').length}
            </div>
            <div className="text-xs text-amber-800 font-medium mt-1">Currently in Service Station</div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">build</span>
          </div>
        </div>
      </div>

      {/* Category Tabs & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-primary text-white shadow'
                  : 'bg-surface text-on-surface-variant hover:bg-surface-container border border-outline-variant/40'
              }`}
            >
              {cat} ({cat === 'All' ? assets.length : assets.filter((a) => a.category === cat).length})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-surface-container p-1 rounded-xl border border-outline-variant/50 self-end md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 ${
              viewMode === 'grid' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">grid_view</span> Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1 ${
              viewMode === 'table' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">table_rows</span> Table
          </button>
        </div>
      </div>

      {/* Equipment Inventory View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => setSelectedMachine(asset)}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 hover:border-primary/50 transition-all p-5 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md cursor-pointer group relative"
            >
              <div>
                <div className="h-44 rounded-xl bg-surface-container-low border border-outline-variant/40 flex items-center justify-center p-3 overflow-hidden relative">
                  <img
                    src={asset.img || machineImages.ventilator}
                    alt={asset.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <span
                      className={`whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        asset.status === 'Active' || asset.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {asset.status}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">{asset.category}</span>
                  <h3 className="font-bold text-on-surface text-base m-0 mt-0.5 line-clamp-1 group-hover:text-primary transition-colors">
                    {asset.name}
                  </h3>
                  <div className="text-xs font-mono text-on-surface-variant mt-1">ID: {asset.id}</div>
                  <p className="text-xs text-on-surface-variant mt-2 line-clamp-2">{asset.clinicalUse}</p>
                </div>
              </div>

              <div className="border-t border-outline-variant/40 pt-3 flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-mono">{asset.department}</span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, asset.id)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Machine"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>

                  <button className="font-bold text-primary hover:underline flex items-center gap-0.5">
                    Review <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low text-xs text-on-surface-variant uppercase font-bold border-b border-outline-variant/40">
              <tr>
                <th className="p-4">Machine ID & Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Department & Location</th>
                <th className="p-4">Purchase Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-sm font-body-md">
              {filteredAssets.map((asset) => (
                <tr
                  key={asset.id}
                  onClick={() => setSelectedMachine(asset)}
                  className="hover:bg-surface-container-low/60 transition-colors cursor-pointer"
                >
                  <td className="p-4">
                    <div className="font-bold text-on-surface">{asset.name}</div>
                    <div className="text-xs font-mono text-primary font-semibold">{asset.id}</div>
                  </td>
                  <td className="p-4 text-xs font-bold text-on-surface">{asset.category}</td>
                  <td className="p-4 text-xs text-on-surface-variant">{asset.department} • {asset.location}</td>
                  <td className="p-4 text-xs font-medium text-on-surface font-mono">{asset.purchaseDate}</td>
                  <td className="p-4">
                    <span
                      className={`whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        asset.status === 'Active' || asset.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {asset.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, asset.id)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Machine"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                      <button className="text-xs font-bold text-secondary hover:underline">View Review</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add New Machine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant max-w-xl w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 m-0">
                <span className="material-symbols-outlined text-primary">add_box</span>
                Add New Machine to Hospital Inventory
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddMachineSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Category *
                  </label>
                  <select
                    value={newMachine.category}
                    onChange={(e) => handleCategorySelectChange(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 font-bold outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Patient Monitors">Patient Monitors</option>
                    <option value="Defibrillators">Defibrillators</option>
                    <option value="Infusion Pumps">Infusion Pumps</option>
                    <option value="Imaging Systems">Imaging Systems</option>
                    <option value="Ventilators">Ventilators</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Machine Model *
                  </label>
                  <select
                    value={newMachine.name}
                    onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
                    className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 font-bold outline-none focus:border-primary cursor-pointer"
                  >
                    {(machineChoices[newMachine.category] || []).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Department
                  </label>
                  <select
                    value={newMachine.department}
                    onChange={(e) => setNewMachine({ ...newMachine, department: e.target.value })}
                    className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 font-semibold outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Intensive Care (ICU)">Intensive Care (ICU)</option>
                    <option value="Emergency (ER)">Emergency (ER)</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Surgery">Surgery</option>
                    <option value="General Wards">General Wards</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Location (Room / Bed)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ICU - Bed 12"
                    value={newMachine.location}
                    onChange={(e) => setNewMachine({ ...newMachine, location: e.target.value })}
                    className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 font-semibold outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={newMachine.purchaseDate}
                    onChange={(e) => setNewMachine({ ...newMachine, purchaseDate: e.target.value })}
                    className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 font-semibold outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Manufacturer / Vendor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Philips Healthcare"
                    value={newMachine.manufacturer}
                    onChange={(e) => setNewMachine({ ...newMachine, manufacturer: e.target.value })}
                    className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 font-semibold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Primary Clinical Use / Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Describe the clinical purpose of this machine..."
                  value={newMachine.clinicalUse}
                  onChange={(e) => setNewMachine({ ...newMachine, clinicalUse: e.target.value })}
                  className="w-full bg-surface border border-outline-variant rounded-xl p-2.5 outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="backupReady"
                  checked={newMachine.isBackupReady}
                  onChange={(e) => setNewMachine({ ...newMachine, isBackupReady: e.target.checked })}
                  className="w-4 h-4 text-primary rounded cursor-pointer"
                />
                <label htmlFor="backupReady" className="text-xs font-bold text-on-surface cursor-pointer">
                  Mark machine as "Ready for Emergency Backup"
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-outline-variant text-on-surface-variant"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-primary text-white shadow hover:bg-primary/90"
                >
                  Add Machine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full shadow-2xl border border-outline-variant space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
              <h3 className="font-bold text-lg text-on-surface m-0">Confirm Equipment Deletion</h3>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Are you sure you want to permanently delete machine <strong>ID: {deleteConfirmId}</strong> from Hospital Inventory and the database?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-outline-variant"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow"
              >
                Yes, Delete Machine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
