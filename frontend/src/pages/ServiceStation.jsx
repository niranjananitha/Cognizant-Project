import React, { useState } from 'react';
import { machineImages } from '../assets/images';

export default function ServiceStation({ onNavigate, initialTabFilter, searchQuery }) {
  const [activeTabFilter, setActiveTabFilter] = useState(initialTabFilter || 'All');
  const [selectedMachine, setSelectedMachine] = useState(null); // In-place detail sub-page state

  // Service Station Machine Registry
  const serviceMachinesList = [
    {
      id: 'AST-8821-V',
      name: 'Respironics V60 Ventilator',
      category: 'Ventilators',
      department: 'Intensive Care (ICU)',
      actionType: 'Service',
      status: 'In Maintenance',
      reason: 'Compressor motor bearing vibration and pressure valve recalibration drift under continuous high load.',
      sentDate: '12 Oct 2023',
      expectedDeliveryDate: '24 Oct 2023',
      technician: 'J. Miller (Bio-Tech Lead)',
      serviceVendor: 'Philips Factory Authorized Service',
      estimatedCost: '$450.00',
      priority: 'High',
      img: machineImages.ventilator,
    },
    {
      id: 'DEF-402-B',
      name: 'Mindray BeneHeart D3 Defibrillator',
      category: 'Defibrillators',
      department: 'Emergency (ER)',
      actionType: 'Recall',
      status: 'Safety Recall In-Progress',
      reason: 'Manufacturer safety recall (Notice #2023-REV4) for firmware update to internal capacitor discharge timer circuit.',
      sentDate: '05 Sep 2023',
      expectedDeliveryDate: '01 Nov 2023',
      technician: 'S. Chen (MedTech Corp)',
      serviceVendor: 'Mindray Global Safety Team',
      estimatedCost: '$0.00 (Warranty Recall)',
      priority: 'Critical',
      img: machineImages.defibrillator,
    },
    {
      id: 'CT-500-X',
      name: 'GE Revolution CT Tube Unit',
      category: 'Imaging Systems',
      department: 'Radiology',
      actionType: 'Replaced',
      status: 'Unit Replacement Ordered',
      reason: 'X-ray cathode tube assembly exceeded maximum recommended exposure filament hours; full tube replacement required.',
      sentDate: '01 Oct 2023',
      expectedDeliveryDate: '18 Nov 2023',
      technician: 'R. Davis (Lead Imaging Engineer)',
      serviceVendor: 'GE Healthcare Systems',
      estimatedCost: '$18,500.00',
      priority: 'High',
      img: machineImages.mri,
    },
    {
      id: 'MRI-102',
      name: 'Siemens Magnetom Cryo Loop',
      category: 'Imaging Systems',
      department: 'Radiology',
      actionType: 'Service',
      status: 'Cooling Overhaul',
      reason: 'Helium compressor chiller loop pressure warning during high gradient pulse sequences.',
      sentDate: '10 Oct 2023',
      expectedDeliveryDate: '28 Oct 2023',
      technician: 'M. Vance (Siemens Tech Specialist)',
      serviceVendor: 'Siemens Healthineers Chiller Division',
      estimatedCost: '$2,850.00',
      priority: 'Medium',
      img: machineImages.mri,
    },
    {
      id: 'INF-3301-P',
      name: 'Alaris System Infusion Pump #3',
      category: 'Infusion Pumps',
      department: 'Surgery',
      actionType: 'Recall',
      status: 'Software Recall',
      reason: 'Manufacturer recall for drug library sync protocol update and occlusion sensor calibration standard.',
      sentDate: '18 Sep 2023',
      expectedDeliveryDate: '20 Oct 2023',
      technician: 'S. Chen',
      serviceVendor: 'BD Alaris Safety Dept',
      estimatedCost: '$0.00 (Recall)',
      priority: 'Medium',
      img: machineImages.infusionPump,
    },
    {
      id: 'MON-9910-A',
      name: 'Philips IntelliVue MX700 Screen',
      category: 'Patient Monitors',
      department: 'Intensive Care (ICU)',
      actionType: 'Replaced',
      status: 'Display Replacement',
      reason: 'Touchscreen digitizer physical damage and backlight dimming; replacing front glass digitizer module.',
      sentDate: '02 Oct 2023',
      expectedDeliveryDate: '15 Oct 2023',
      technician: 'J. Miller',
      serviceVendor: 'Philips Components Inc',
      estimatedCost: '$620.00',
      priority: 'Low',
      img: machineImages.monitor,
    },
  ];

  // Summary counts
  const serviceCount = serviceMachinesList.filter((m) => m.actionType === 'Service').length;
  const recallCount = serviceMachinesList.filter((m) => m.actionType === 'Recall').length;
  const replacedCount = serviceMachinesList.filter((m) => m.actionType === 'Replaced').length;

  const filteredMachines = serviceMachinesList.filter((item) => {
    const matchSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchTab = activeTabFilter === 'All' || item.actionType === activeTabFilter;

    return matchSearch && matchTab;
  });

  // If a machine is selected, show detailed sub-page in-place
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
            Back to Service Station Overview
          </button>
        </div>

        {/* Machine Header Banner */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant flex flex-col lg:flex-row justify-between items-start gap-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-surface-container-low border border-outline-variant/60 flex items-center justify-center shrink-0 shadow p-2 overflow-hidden">
              <img src={selectedMachine.img} alt={selectedMachine.name} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                    selectedMachine.actionType === 'Service'
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : selectedMachine.actionType === 'Recall'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-purple-100 text-purple-900 border border-purple-300'
                  }`}
                >
                  {selectedMachine.actionType} Record
                </span>
                <span className="px-3 py-1 bg-surface-container text-on-surface text-xs font-bold rounded-lg font-mono">
                  {selectedMachine.status}
                </span>
              </div>
              <h1 className="font-display-lg text-3xl font-extrabold text-on-surface m-0">{selectedMachine.name}</h1>
              <div className="text-xs font-mono text-on-surface-variant flex items-center gap-3">
                <span>Asset ID: <strong className="text-primary font-bold">{selectedMachine.id}</strong></span>
                <span>•</span>
                <span>Category: <strong className="text-on-surface">{selectedMachine.category}</strong></span>
                <span>•</span>
                <span>Dept: <strong className="text-on-surface">{selectedMachine.department}</strong></span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col gap-1 min-w-[240px]">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Estimated Delivery Date</span>
            <span className="text-xl font-extrabold text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">local_shipping</span>
              {selectedMachine.expectedDeliveryDate}
            </span>
          </div>
        </div>

        {/* Detailed Service Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Reason & Logistics */}
          <div className="lg:col-span-8 space-y-6">
            {/* Reason for Service / Recall / Replacement */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2 border-b border-outline-variant/40 pb-3 m-0">
                <span className="material-symbols-outlined text-primary">report_problem</span>
                Reason Went for {selectedMachine.actionType}
              </h2>
              <p className="text-sm text-on-surface leading-relaxed font-semibold bg-surface-container-low p-4 rounded-xl border border-outline-variant/30">
                {selectedMachine.reason}
              </p>
            </div>

            {/* Dates & Logistics */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2 border-b border-outline-variant/40 pb-3 m-0">
                <span className="material-symbols-outlined text-primary">event</span>
                Service Timeline & Dates
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface border border-outline-variant/40">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Date Sent for Service
                  </span>
                  <span className="text-base font-extrabold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">flight_takeoff</span>
                    {selectedMachine.sentDate}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-outline-variant/40">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Expected Delivery Date
                  </span>
                  <span className="text-base font-extrabold text-secondary flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-lg">flight_land</span>
                    {selectedMachine.expectedDeliveryDate}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Vendor & Financials */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface flex items-center gap-2 border-b border-outline-variant/40 pb-3 m-0">
                <span className="material-symbols-outlined text-primary">engineering</span>
                Technician & Vendor Info
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-on-surface-variant block font-semibold">Assigned Bio-Tech Engineer:</span>
                  <span className="font-bold text-on-surface text-sm">{selectedMachine.technician}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block font-semibold">Service Vendor / Partner:</span>
                  <span className="font-bold text-on-surface text-sm">{selectedMachine.serviceVendor}</span>
                </div>
                <div>
                  <span className="text-on-surface-variant block font-semibold">Estimated Repair Cost:</span>
                  <span className="font-mono font-bold text-primary text-base">{selectedMachine.estimatedCost}</span>
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
      {/* Title Header */}
      <div className="flex flex-col gap-2 border-b border-outline-variant/40 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
          <span className="material-symbols-outlined text-base">build_circle</span>
          Maintenance Operations
        </div>
        <h1 className="font-display-lg text-3xl font-bold text-on-background m-0">Service Station</h1>
        <p className="font-body-md text-sm text-on-surface-variant m-0">
          Track equipment sent for maintenance, safety recalls, and structural replacements with expected delivery dates.
        </p>
      </div>

      {/* Metric Cards: Service, Recall, Replaced */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Service */}
        <div
          onClick={() => setActiveTabFilter('Service')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-between ${
            activeTabFilter === 'Service'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-surface-container-lowest border-outline-variant/60 hover:border-blue-300'
          }`}
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">Machines Sent for Service</span>
            <span className="text-4xl font-extrabold text-blue-700">{serviceCount}</span>
            <span className="text-xs text-blue-800 font-medium">Under active maintenance/repair</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-800">
            <span className="material-symbols-outlined text-3xl">build</span>
          </div>
        </div>

        {/* Recall */}
        <div
          onClick={() => setActiveTabFilter('Recall')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-between ${
            activeTabFilter === 'Recall'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20'
              : 'bg-surface-container-lowest border-outline-variant/60 hover:border-amber-300'
          }`}
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Machines Recalled</span>
            <span className="text-4xl font-extrabold text-amber-700">{recallCount}</span>
            <span className="text-xs text-amber-800 font-medium">Manufacturer safety notices</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800">
            <span className="material-symbols-outlined text-3xl">assignment_return</span>
          </div>
        </div>

        {/* Replaced */}
        <div
          onClick={() => setActiveTabFilter('Replaced')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-between ${
            activeTabFilter === 'Replaced'
              ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-500/20'
              : 'bg-surface-container-lowest border-outline-variant/60 hover:border-purple-300'
          }`}
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-900">Machines Replaced</span>
            <span className="text-4xl font-extrabold text-purple-700">{replacedCount}</span>
            <span className="text-xs text-purple-800 font-medium">Unit replacement ordered</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-800">
            <span className="material-symbols-outlined text-3xl">published_with_changes</span>
          </div>
        </div>

        {/* Total Service Action */}
        <div
          onClick={() => setActiveTabFilter('All')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-between ${
            activeTabFilter === 'All'
              ? 'bg-primary-container border-primary text-white'
              : 'bg-surface-container-lowest border-outline-variant/60'
          }`}
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">Total Service Action</span>
            <span className="text-4xl font-extrabold">{serviceMachinesList.length}</span>
            <span className="text-xs opacity-80 font-medium">Click to show all items</span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">inventory</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant flex items-center gap-3 shadow-sm overflow-x-auto">
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mr-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-base">filter_list</span> Filter View:
        </span>

        {['All', 'Service', 'Recall', 'Replaced'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTabFilter(tab)}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
              activeTabFilter === tab
                ? 'bg-primary text-white shadow-md'
                : 'bg-surface text-on-surface-variant hover:bg-surface-container border border-outline-variant/40'
            }`}
          >
            {tab === 'All' ? 'All Machine Records' : `${tab} (${serviceMachinesList.filter(m => m.actionType === tab).length})`}
          </button>
        ))}
      </div>

      {/* Machine Data Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low text-xs text-on-surface-variant uppercase font-bold border-b border-outline-variant/40">
            <tr>
              <th className="p-4">Machine ID & Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Action Type</th>
              <th className="p-4">Reason Went for Service / Recall</th>
              <th className="p-4">Sent Date</th>
              <th className="p-4">Expected Delivery Date</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 text-sm font-body-md">
            {filteredMachines.length > 0 ? (
              filteredMachines.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedMachine(item)}
                  className="hover:bg-surface-container-low/60 transition-colors cursor-pointer"
                >
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface border border-outline-variant/40 flex items-center justify-center overflow-hidden shrink-0">
                      <img src={item.img} alt={item.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div>
                      <div className="font-bold text-on-surface">{item.name}</div>
                      <div className="text-xs font-mono text-primary font-semibold">{item.id}</div>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-bold text-on-surface">{item.category}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                        item.actionType === 'Service'
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : item.actionType === 'Recall'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-purple-100 text-purple-900 border border-purple-300'
                      }`}
                    >
                      {item.actionType}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-on-surface-variant max-w-sm font-medium leading-normal">
                    <span className="line-clamp-2">{item.reason}</span>
                  </td>
                  <td className="p-4 text-xs font-medium text-on-surface font-mono">{item.sentDate}</td>
                  <td className="p-4 text-xs font-extrabold text-secondary font-mono flex items-center gap-1 pt-5">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {item.expectedDeliveryDate}
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-xs font-bold text-secondary hover:underline bg-surface px-3 py-1.5 rounded-lg border border-outline-variant/40">
                      View Reason
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-8 text-center text-on-surface-variant text-sm font-medium">
                  No service records matched the selected filter or search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
