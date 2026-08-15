import React, { useState } from 'react';
import { machineImages } from '../assets/images';

export default function HospitalEquipmentInventory({ onNavigate, onAddClick, searchQuery, currentUserRole }) {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMachine, setSelectedMachine] = useState(null); // For in-place detailed review sub-page
  const [showAddModal, setShowAddModal] = useState(false);

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

  // Initial list of hospital equipment assets with local image mappings
  const [assets, setAssets] = useState([
    {
      id: 'AST-8821-V',
      name: 'Respironics V60 Ventilator',
      category: 'Ventilators',
      type: 'Non-invasive Ventilator',
      department: 'Intensive Care (ICU)',
      location: 'ICU - Bed 04',
      status: 'Active',
      isBackupReady: true,
      purchaseDate: '15 Mar 2021',
      clinicalUse: 'Provides positive pressure ventilation support for respiratory failure and COPD patients in intensive care units.',
      manufacturer: 'Philips Healthcare',
      serialNo: 'PH-V60-99824',
      health: 98,
      nextPM: '12 Nov 2024',
      warranty: 'Active (Expires Mar 2026)',
      img: machineImages.ventilator,
    },
    {
      id: 'DEF-402-B',
      name: 'BeneHeart D3 Defibrillator',
      category: 'Defibrillators',
      type: 'Biphasic Defibrillator & Monitor',
      department: 'Emergency (ER)',
      location: 'ER Bay 02',
      status: 'Maintenance',
      isBackupReady: false,
      purchaseDate: '10 Aug 2022',
      clinicalUse: 'Emergency cardiac resuscitation, manual defibrillation, AED mode, and transcutaneous pacing during cardiac arrests.',
      manufacturer: 'Mindray Medical',
      serialNo: 'MR-D3-44109',
      health: 72,
      nextPM: 'Overdue (3 Days)',
      warranty: 'Active (Expires Aug 2025)',
      img: machineImages.defibrillator,
    },
    {
      id: 'MX700-04',
      name: 'IntelliVue MX700 Monitor',
      category: 'Patient Monitors',
      type: 'Multi-parameter Patient Monitor',
      department: 'Intensive Care (ICU)',
      location: 'ICU - Bed 01',
      status: 'Active',
      isBackupReady: true,
      purchaseDate: '01 Feb 2020',
      clinicalUse: 'Continuous monitoring of ECG, SpO2, NIBP, invasive blood pressure, end-tidal CO2, and temperature in critical care.',
      manufacturer: 'Philips Healthcare',
      serialNo: 'PH-MX700-1120',
      health: 95,
      nextPM: '15 Apr 2024',
      warranty: 'Expired (Coverage under Hospital AMC)',
      img: machineImages.monitor,
    },
    {
      id: 'MON-B650-01',
      name: 'GE Carescape B650',
      category: 'Patient Monitors',
      type: 'Bedside Critical Care Monitor',
      department: 'Intensive Care (ICU)',
      location: 'ICU - Bed 08',
      status: 'Active',
      isBackupReady: true,
      purchaseDate: '18 Jun 2022',
      clinicalUse: 'Comprehensive hemodynamic and respiratory patient monitoring with wireless telemetry integration.',
      manufacturer: 'GE HealthCare',
      serialNo: 'GE-B650-9901',
      health: 96,
      nextPM: '10 Jan 2025',
      warranty: 'Active (Expires Jun 2025)',
      img: machineImages.geCarescape,
    },
    {
      id: 'DEF-ZOL-03',
      name: 'Zoll R Series / AED Plus',
      category: 'Defibrillators',
      type: 'Clinical Biphasic Defibrillator',
      department: 'Emergency (ER)',
      location: 'Trauma Bay 01',
      status: 'Active',
      isBackupReady: true,
      purchaseDate: '05 Jan 2023',
      clinicalUse: 'CPR dashboard feedback and high-energy biphasic resuscitation for cardiac emergency response.',
      manufacturer: 'Zoll Medical',
      serialNo: 'ZL-RSER-4412',
      health: 99,
      nextPM: '05 Jan 2025',
      warranty: 'Active (Expires Jan 2026)',
      img: machineImages.zollLifepak,
    },
    {
      id: 'INF-ALR-05',
      name: 'BD Alaris System',
      category: 'Infusion Pumps',
      type: 'Smart Infusion Pump',
      department: 'Surgery',
      location: 'OR-1 Suite',
      status: 'Active',
      isBackupReady: true,
      purchaseDate: '12 Sep 2022',
      clinicalUse: 'Guardrails dose error reduction software and modular multi-channel intravenous medication infusion.',
      manufacturer: 'BD CareFusion',
      serialNo: 'BD-ALR-7701',
      health: 97,
      nextPM: '14 Oct 2024',
      warranty: 'Active (Expires Sep 2025)',
      img: machineImages.bdAlaris,
    },
    {
      id: 'IMG-CARM-07',
      name: 'GE OEC 3D C-Arm',
      category: 'Imaging Systems',
      type: 'Surgical Mobile C-Arm',
      department: 'Surgery',
      location: 'OR-Hybrid Suite',
      status: 'Active',
      isBackupReady: false,
      purchaseDate: '10 Feb 2021',
      clinicalUse: '3D intraoperative fluoroscopic imaging for orthopedic, vascular, and cardiac surgical procedures.',
      manufacturer: 'GE HealthCare',
      serialNo: 'GE-OEC-309',
      health: 93,
      nextPM: '10 Dec 2024',
      warranty: 'Full OEM AMC',
      img: machineImages.geOecCarm,
    },
    {
      id: 'IMG-XRAY-08',
      name: 'Siemens Mobilett Elara Max X-ray',
      category: 'Imaging Systems',
      type: 'Mobile Digital X-ray',
      department: 'Radiology',
      location: 'Mobile Bay R-02',
      status: 'Active',
      isBackupReady: true,
      purchaseDate: '14 Jul 2022',
      clinicalUse: 'High-speed bedside digital radiography for ICU and emergency ward immobile patients.',
      manufacturer: 'Siemens Healthineers',
      serialNo: 'SM-ELR-8802',
      health: 94,
      nextPM: '14 Jul 2025',
      warranty: 'Active (Expires Jul 2025)',
      img: machineImages.siemensXray,
    },
    {
      id: 'IMG-US-09',
      name: 'Fujifilm Sonosite Ultrasound',
      category: 'Imaging Systems',
      type: 'Point-of-Care Ultrasound (POCUS)',
      department: 'Emergency (ER)',
      location: 'ER Ultrasound Cart',
      status: 'Active',
      isBackupReady: true,
      purchaseDate: '01 Apr 2023',
      clinicalUse: 'Point-of-care emergency ultrasound, FAST exams, vascular access guidance, and cardiac imaging.',
      manufacturer: 'Fujifilm Sonosite',
      serialNo: 'FF-SONO-1022',
      health: 100,
      nextPM: '01 Apr 2025',
      warranty: 'Active (Expires Apr 2028)',
      img: machineImages.sonositeUltrasound,
    },
    {
      id: 'MRI-102',
      name: 'Siemens Magnetom 3.0T MRI',
      category: 'Imaging Systems',
      type: 'High-Field MRI Scanner',
      department: 'Radiology',
      location: 'Room 102A',
      status: 'Active',
      isBackupReady: false,
      purchaseDate: '20 Jan 2019',
      clinicalUse: 'High-resolution neuro, musculoskeletal, cardiac, and abdominal magnetic resonance diagnostic imaging.',
      manufacturer: 'Siemens Healthineers',
      serialNo: 'SM-MAG-3001',
      health: 91,
      nextPM: '20 Dec 2024',
      warranty: 'Full Service Contract',
      img: machineImages.mri,
    },
  ]);

  // New Machine Form State
  const [newMachine, setNewMachine] = useState({
    name: 'IntelliVue MX700 Monitor',
    category: 'Patient Monitors',
    department: 'Intensive Care (ICU)',
    location: 'ICU - Bed 10',
    purchaseDate: '2023-11-01',
    clinicalUse: '',
    manufacturer: '',
    isBackupReady: true,
  });

  const categories = ['All', 'Ventilators', 'Patient Monitors', 'Defibrillators', 'Imaging Systems', 'Infusion Pumps'];

  // Metrics computation
  const baseDeviceOffset = 1240;
  const totalHospitalDevices = baseDeviceOffset + assets.length;
  const readyBackupDevices = 180 + assets.filter((a) => a.isBackupReady).length;

  const filteredAssets = assets.filter((item) => {
    const matchSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;

    return matchSearch && matchCategory;
  });

  const handleCategorySelectChange = (cat) => {
    const defaultName = machineChoices[cat]?.[0] || '';
    setNewMachine({ ...newMachine, category: cat, name: defaultName });
  };

  const handleAddMachineSubmit = (e) => {
    e.preventDefault();
    if (!newMachine.name) return;

    let imgAsset = machineImages[newMachine.name] || machineImages.ventilator;
    if (!imgAsset) {
      if (newMachine.category === 'Patient Monitors') imgAsset = machineImages.monitor;
      if (newMachine.category === 'Defibrillators') imgAsset = machineImages.defibrillator;
      if (newMachine.category === 'Imaging Systems') imgAsset = machineImages.mri;
      if (newMachine.category === 'Infusion Pumps') imgAsset = machineImages.infusionPump;
    }

    const createdAsset = {
      id: `AST-${Math.floor(1000 + Math.random() * 9000)}-N`,
      name: newMachine.name,
      category: newMachine.category,
      type: `${newMachine.category} Standard Unit`,
      department: newMachine.department,
      location: newMachine.location,
      status: 'Active',
      isBackupReady: newMachine.isBackupReady,
      purchaseDate: newMachine.purchaseDate || 'Recent',
      clinicalUse: newMachine.clinicalUse || 'General clinical diagnosis and patient care.',
      manufacturer: newMachine.manufacturer || 'Certified Med Provider',
      serialNo: `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      health: 100,
      nextPM: '6 Months',
      warranty: 'Standard 2 Year Warranty',
      img: imgAsset,
    };

    setAssets([createdAsset, ...assets]);
    setShowAddModal(false);
  };

  // If a user clicks a machine, show the Detailed Review Page (In-Place)
  if (selectedMachine) {
    return (
      <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-200">
        {/* Back Button */}
        <div>
          <button
            onClick={() => setSelectedMachine(null)}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 bg-surface-container px-4 py-2 rounded-xl border border-outline-variant/50 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Hospital Equipment Inventory List
          </button>
        </div>

        {/* Detailed Machine Review Header Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant flex flex-col lg:flex-row gap-8 justify-between items-start">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-center shrink-0 shadow p-2 overflow-hidden">
              <img src={selectedMachine.img} alt={selectedMachine.name} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-primary-container text-on-primary-container text-xs font-bold rounded-lg uppercase tracking-wider">
                  {selectedMachine.category}
                </span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300">
                  {selectedMachine.status}
                </span>
                {selectedMachine.isBackupReady && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full border border-blue-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">verified</span> Ready for Backup
                  </span>
                )}
              </div>

              <h1 className="font-display-lg text-3xl font-extrabold text-on-surface m-0">{selectedMachine.name}</h1>

              <div className="flex items-center gap-4 text-xs font-mono text-on-surface-variant flex-wrap mt-1">
                <span>Asset ID: <strong className="text-primary font-bold">{selectedMachine.id}</strong></span>
                <span>•</span>
                <span>Serial #: <strong className="text-on-surface">{selectedMachine.serialNo}</strong></span>
                <span>•</span>
                <span>Manufacturer: <strong className="text-on-surface">{selectedMachine.manufacturer}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-surface-container-low p-4 rounded-xl border border-outline-variant/40 min-w-[240px]">
            <div className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Health Assessment Score</div>
            <div className="text-3xl font-extrabold text-primary flex items-center gap-2">
              {selectedMachine.health}%
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Optimal</span>
            </div>
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-primary rounded-full" style={{ width: `${selectedMachine.health}%` }} />
            </div>
          </div>
        </div>

        {/* Detailed Specs & Review Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Machine Overview & Primary Clinical Use */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant space-y-4">
              <h2 className="text-base font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 border-b border-outline-variant/40 pb-3">
                <span className="material-symbols-outlined text-primary">clinical_notes</span>
                Primary Clinical Use & Description
              </h2>
              <p className="text-sm text-on-surface leading-relaxed font-medium">
                {selectedMachine.clinicalUse}
              </p>
            </div>

            {/* Procurement & Purchase Details */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant space-y-4">
              <h2 className="text-base font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 border-b border-outline-variant/40 pb-3">
                <span className="material-symbols-outlined text-primary">shopping_bag</span>
                Purchase & Procurement History
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-surface border border-outline-variant/40">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Purchase Date</span>
                  <span className="text-base font-bold text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-lg">calendar_today</span>
                    {selectedMachine.purchaseDate}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-outline-variant/40">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Warranty Status</span>
                  <span className="text-sm font-bold text-secondary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-lg">verified_user</span>
                    {selectedMachine.warranty}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-outline-variant/40">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Backup Readiness</span>
                  <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">shield_with_heart</span>
                    {selectedMachine.isBackupReady ? 'Ready for Immediate Backup' : 'Standard Operational'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Location & Maintenance Schedule */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant space-y-4">
              <h2 className="text-base font-bold text-on-surface uppercase tracking-wider flex items-center gap-2 border-b border-outline-variant/40 pb-3">
                <span className="material-symbols-outlined text-primary">location_on</span>
                Location & Facility Info
              </h2>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-on-surface-variant block font-semibold">Department:</span>
                  <span className="font-bold text-on-surface">{selectedMachine.department}</span>
                </div>
                <div>
                  <span className="text-xs text-on-surface-variant block font-semibold">Assigned Location:</span>
                  <span className="font-mono font-bold text-primary">{selectedMachine.location}</span>
                </div>
                <div>
                  <span className="text-xs text-on-surface-variant block font-semibold">Next Scheduled PM:</span>
                  <span className="font-bold text-on-surface">{selectedMachine.nextPM}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto">
      {/* Title & Overall Hospital Device Counts */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant/40 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
            <span className="material-symbols-outlined text-base">local_hospital</span>
            Facility: Gen-Z Med Center / 02-FLOOR-C
          </div>
          <h1 className="font-display-lg text-3xl font-bold text-on-background mt-1 m-0">
            Hospital Equipment Inventory
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-1">
            Complete inventory catalog with category filtering, machine reviews, and backup availability tracking.
          </p>
        </div>

        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="h-11 px-6 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-xl">add_box</span> Add New Machine
          </button>
        </div>
      </div>

      {/* Summary Counters Bar: Total Hospital Devices & Ready For Backup */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Devices Present */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Devices Present in Hospital</span>
            <span className="text-4xl font-extrabold text-primary">{totalHospitalDevices}</span>
            <span className="text-xs text-on-surface-variant font-medium">Cataloged across 12 medical departments</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">devices_other</span>
          </div>
        </div>

        {/* Total Ready for Backup */}
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Machines Ready for Backup</span>
            <span className="text-4xl font-extrabold text-emerald-700">{readyBackupDevices}</span>
            <span className="text-xs text-emerald-800 font-medium">Standby units available for instant deployment</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-200/60 flex items-center justify-center text-emerald-800">
            <span className="material-symbols-outlined text-3xl">shield_with_heart</span>
          </div>
        </div>

        {/* Active In-Use */}
        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Active Clinical Machines</span>
            <span className="text-4xl font-extrabold text-secondary">1,012</span>
            <span className="text-xs text-on-surface-variant font-medium">Currently attached to patient beds/ORs</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-3xl">monitor_heart</span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills & View Mode Bar */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mr-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-base">filter_alt</span> Category:
          </span>
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

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg border transition-all ${
              viewMode === 'grid'
                ? 'bg-primary text-white border-primary shadow'
                : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
            }`}
            title="Grid View"
          >
            <span className="material-symbols-outlined text-lg">grid_view</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg border transition-all ${
              viewMode === 'list'
                ? 'bg-primary text-white border-primary shadow'
                : 'bg-surface text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
            }`}
            title="List View"
          >
            <span className="material-symbols-outlined text-lg">view_list</span>
          </button>
        </div>
      </div>

      {/* Equipment Display Grid or List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => setSelectedMachine(asset)}
              className="bg-surface-container-lowest rounded-2xl flex flex-col group hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-xl border border-outline-variant/60 overflow-hidden cursor-pointer relative"
            >
              <div className="h-48 bg-surface-container-low relative flex items-center justify-center p-4">
                <img
                  src={asset.img}
                  alt={asset.name}
                  className="h-full w-auto object-contain mix-blend-darken filter contrast-125 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 bg-primary text-white px-2.5 py-1 rounded-md text-[11px] font-bold shadow">
                  {asset.category}
                </div>
                {asset.isBackupReady && (
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow">
                    <span className="material-symbols-outlined text-xs">shield</span> Backup Ready
                  </div>
                )}
              </div>

              <div className="p-6 flex-1 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-primary">{asset.id}</span>
                  <span className="text-on-surface-variant font-medium">Purchased: {asset.purchaseDate}</span>
                </div>

                <h3 className="font-headline-sm text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                  {asset.name}
                </h3>

                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                  {asset.clinicalUse}
                </p>

                <div className="mt-auto pt-4 border-t border-outline-variant/30 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant">Assigned Location</span>
                    <span className="text-xs font-bold text-on-surface">{asset.location}</span>
                  </div>

                  <button className="text-xs font-bold text-secondary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Detail Review <span className="material-symbols-outlined text-sm">arrow_forward</span>
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
                <th className="p-4">Primary Clinical Use</th>
                <th className="p-4">Purchase Date</th>
                <th className="p-4">Backup Ready</th>
                <th className="p-4 text-right">Action</th>
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
                  <td className="p-4 text-xs text-on-surface-variant max-w-xs truncate">{asset.clinicalUse}</td>
                  <td className="p-4 text-xs font-medium text-on-surface">{asset.purchaseDate}</td>
                  <td className="p-4">
                    {asset.isBackupReady ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Ready
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant">
                        Standard
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-xs font-bold text-secondary hover:underline">View Review</button>
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
                    Machine Name * (Select Dropdown)
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
                    Department & Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ICU - Bed 12"
                    value={newMachine.location}
                    onChange={(e) => setNewMachine({ ...newMachine, location: e.target.value })}
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
                  className="w-4 h-4 text-primary rounded"
                />
                <label htmlFor="backupReady" className="text-xs font-bold text-on-surface">
                  Mark machine as "Ready for Backup Standby"
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
    </div>
  );
}
