import React, { useState } from 'react';
import { useEquipment } from '../contexts/EquipmentContext';

export default function ServiceStation({ onNavigate, initialTabFilter, searchQuery }) {
  const {
    serviceStationList,
    completeServiceStationItem,
    markServiceStationDelayed,
    recallServiceStationItem,
  } = useEquipment();

  const [activeTabFilter, setActiveTabFilter] = useState(initialTabFilter || 'All');
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  // Summary counts
  const serviceCount = serviceStationList.filter((m) => m.actionType === 'Service').length;
  const recallCount = serviceStationList.filter((m) => m.actionType === 'Recall').length;
  const replacedCount = serviceStationList.filter((m) => m.actionType === 'Replaced').length;

  const filteredMachines = serviceStationList.filter((item) => {
    const matchSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchTab = activeTabFilter === 'All' || item.actionType === activeTabFilter;

    return matchSearch && matchTab;
  });

  const handleComplete = (machine) => {
    completeServiceStationItem(machine.id);
    setActionNotice(`Service for ${machine.name} (${machine.id}) marked as COMPLETED and logged into Service History!`);
    setTimeout(() => {
      setSelectedMachine(null);
      setActionNotice(null);
    }, 1200);
  };

  const handleMarkLate = (machine) => {
    markServiceStationDelayed(machine.id, 'Delayed waiting for component delivery & calibration');
    setActionNotice(`Machine ${machine.name} marked as DELAYED / OVERDUE. Updated schedule logged into Service History.`);
    setTimeout(() => {
      setSelectedMachine(null);
      setActionNotice(null);
    }, 1200);
  };

  const handleRecall = (machine) => {
    recallServiceStationItem(machine.id, 'Manufacturer safety advisory notice');
    setActionNotice(`Machine ${machine.name} escalated to SAFETY RECALL. Status updated across system.`);
    setTimeout(() => {
      setSelectedMachine(null);
      setActionNotice(null);
    }, 1200);
  };

  // If a machine is selected, show detailed sub-page in-place
  if (selectedMachine) {
    // Get live item from context in case it was updated
    const liveItem = serviceStationList.find((m) => m.id === selectedMachine.id) || selectedMachine;

    return (
      <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-200">
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedMachine(null)}
            className="text-[13px] font-semibold text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Service Station Overview
          </button>

          <button
            onClick={() => onNavigate('service-history')}
            className="text-[13px] font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            View Completed Service History
          </button>
        </div>

        {actionNotice && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 font-medium text-[13px] flex items-center gap-3 animate-in fade-in">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Machine Header Banner */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-start gap-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-3 overflow-hidden">
              <img src={liveItem.img} alt={liveItem.name} className="max-h-full max-w-full object-contain drop-shadow-sm" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`whitespace-nowrap inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${liveItem.actionType === 'Service'
                      ? 'bg-blue-50 text-blue-700 border border-blue-100'
                      : liveItem.actionType === 'Recall'
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : 'bg-purple-50 text-purple-700 border border-purple-100'
                    }`}
                >
                  {liveItem.actionType} Record
                </span>
                <span className="whitespace-nowrap inline-flex items-center px-3 py-1 bg-slate-50 border border-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg">
                  {liveItem.status}
                </span>
              </div>
              <h1 className="text-3xl font-semibold text-slate-900 m-0 tracking-tight">{liveItem.name}</h1>
              <div className="text-[13px] text-slate-500 flex items-center gap-3 flex-wrap font-medium">
                <span>Asset ID: <span className="text-slate-800">{liveItem.id}</span></span>
                <span className="text-slate-300">•</span>
                <span>Category: <span className="text-slate-800">{liveItem.category}</span></span>
                <span className="text-slate-300">•</span>
                <span>Dept: <span className="text-slate-800">{liveItem.department}</span></span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5 min-w-[240px]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Expected Delivery Date</span>
            <span className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-600 text-[20px]">local_shipping</span>
              {liveItem.expectedDeliveryDate}
            </span>
          </div>
        </div>

        {/* Action Panel for Task 2 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-2 m-0">
              <span className="material-symbols-outlined text-slate-500 text-[18px]">touch_app</span>
              Service Workflow Action Controls (Task 2)
            </h2>
            <span className="text-[12px] text-slate-500 font-medium">Click action to update status & service history</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Complete Button */}
            <button
              type="button"
              onClick={() => handleComplete(liveItem)}
              className="p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[14px] shadow-sm transition-all flex flex-col items-center justify-center gap-1.5 group"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">task_alt</span>
                <span>Mark Service as Complete</span>
              </div>
              <span className="text-[11px] opacity-90 font-normal">Saves to Service History & marks machine Active</span>
            </button>

            {/* Mark as Late / Delayed Button */}
            <button
              type="button"
              onClick={() => handleMarkLate(liveItem)}
              className="p-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-[14px] shadow-sm transition-all flex flex-col items-center justify-center gap-1.5 group"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">warning</span>
                <span>Mark as Late / Delayed</span>
              </div>
              <span className="text-[11px] opacity-90 font-normal">Extends timeline & logs delay in History</span>
            </button>

            {/* Recall Button */}
            <button
              type="button"
              onClick={() => handleRecall(liveItem)}
              className="p-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-medium text-[14px] shadow-sm transition-all flex flex-col items-center justify-center gap-1.5 group"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">assignment_return</span>
                <span>Escalate to Safety Recall</span>
              </div>
              <span className="text-[11px] opacity-90 font-normal">Flags critical recall notice across hospital</span>
            </button>
          </div>
        </div>

        {/* Detailed Service Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Reason & Logistics */}
          <div className="lg:col-span-8 space-y-6">
            {/* Reason for Service / Recall / Replacement */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4 m-0">
                <span className="material-symbols-outlined text-slate-500 text-[18px]">report_problem</span>
                Reason Went for {liveItem.actionType}
              </h2>
              <p className="text-[14px] text-slate-700 leading-relaxed font-medium bg-slate-50 p-5 rounded-2xl border border-slate-100">
                {liveItem.reason}
              </p>
            </div>

            {/* Dates & Logistics */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4 m-0">
                <span className="material-symbols-outlined text-slate-500 text-[18px]">event</span>
                Service Timeline & Schedule
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative p-5 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-sky-500 text-[16px]">flight_takeoff</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Date Sent for Service
                  </span>
                  <span className="text-[18px] font-semibold text-slate-900">
                    {liveItem.sentDate}
                  </span>
                  <div className="mt-3 pt-3 border-t border-slate-200/80">
                    <span className="text-[11px] text-slate-400 font-medium">Service initiated</span>
                  </div>
                </div>

                <div className="relative p-5 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-emerald-500 text-[16px]">flight_land</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Expected Delivery Date
                  </span>
                  <span className="text-[18px] font-semibold text-slate-900">
                    {liveItem.expectedDeliveryDate}
                  </span>
                  <div className="mt-3 pt-3 border-t border-slate-200/80">
                    <span className="text-[11px] text-slate-400 font-medium">Estimated return to fleet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Service Vendor & Financials */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4 m-0">
                <span className="material-symbols-outlined text-slate-500 text-[18px]">engineering</span>
                Technician & Vendor Info
              </h2>

              <div className="space-y-4 text-[13px]">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-slate-400 text-[16px]">person</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium text-[11px] uppercase tracking-wider mb-0.5">Bio-Tech Engineer</span>
                    <span className="font-semibold text-slate-800">{liveItem.technician}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-slate-400 text-[16px]">storefront</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium text-[11px] uppercase tracking-wider mb-0.5">Service Vendor</span>
                    <span className="font-semibold text-slate-800">{liveItem.serviceVendor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Title Header */}
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
          <span className="material-symbols-outlined text-[16px]">build_circle</span>
          Maintenance Operations
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 m-0 tracking-tight">Service Station</h1>
        <p className="text-[14px] text-slate-500 m-0 font-medium">
          Track equipment sent for maintenance, safety recalls, and structural replacements with live workflow status.
        </p>
      </div>

      {/* Metric Cards: Service, Recall, Replaced */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Service */}
        <div
          onClick={() => setActiveTabFilter('Service')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-between ${activeTabFilter === 'Service'
              ? 'bg-blue-50/50 border-blue-200 ring-1 ring-blue-500/20'
              : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow'
            }`}
        >
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Machines in Service</span>
            <span className="text-3xl font-semibold text-slate-900 mt-1">{serviceCount}</span>
            <span className="text-[11px] text-slate-400 font-medium mt-1">Under active maintenance</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-[24px]">build</span>
          </div>
        </div>

        {/* Recall */}
        <div
          onClick={() => setActiveTabFilter('Recall')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-between ${activeTabFilter === 'Recall'
              ? 'bg-amber-50/50 border-amber-200 ring-1 ring-amber-500/20'
              : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow'
            }`}
        >
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Machines Recalled</span>
            <span className="text-3xl font-semibold text-slate-900 mt-1">{recallCount}</span>
            <span className="text-[11px] text-slate-400 font-medium mt-1">Manufacturer safety notices</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-[24px]">assignment_return</span>
          </div>
        </div>

        {/* Replaced */}
        <div
          onClick={() => setActiveTabFilter('Replaced')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-between ${activeTabFilter === 'Replaced'
              ? 'bg-purple-50/50 border-purple-200 ring-1 ring-purple-500/20'
              : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow'
            }`}
        >
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Machines Replaced</span>
            <span className="text-3xl font-semibold text-slate-900 mt-1">{replacedCount}</span>
            <span className="text-[11px] text-slate-400 font-medium mt-1">Unit replacement ordered</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined text-[24px]">published_with_changes</span>
          </div>
        </div>

        {/* Total Service Action */}
        <div
          onClick={() => setActiveTabFilter('All')}
          className={`p-6 rounded-2xl border transition-all cursor-pointer shadow-sm flex items-center justify-between ${activeTabFilter === 'All'
              ? 'bg-slate-900 border-slate-900 text-white'
              : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow'
            }`}
        >
          <div className="flex flex-col gap-1">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${activeTabFilter === 'All' ? 'text-slate-300' : 'text-slate-500'}`}>Total Service Action</span>
            <span className={`text-3xl font-semibold mt-1 ${activeTabFilter === 'All' ? 'text-white' : 'text-slate-900'}`}>{serviceStationList.length}</span>
            <span className={`text-[11px] font-medium mt-1 ${activeTabFilter === 'All' ? 'text-slate-400' : 'text-slate-400'}`}>Click to show all items</span>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeTabFilter === 'All' ? 'bg-white/10 text-white' : 'bg-slate-50 border border-slate-100 text-slate-400'}`}>
            <span className="material-symbols-outlined text-[24px]">inventory</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-100 flex items-center gap-2 shadow-sm overflow-x-auto">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider ml-2 mr-3 flex items-center gap-1.5 shrink-0">
          <span className="material-symbols-outlined text-[14px]">filter_list</span> Filter:
        </span>

        {['All', 'Service', 'Recall', 'Replaced'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTabFilter(tab)}
            className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap ${activeTabFilter === tab
                ? 'bg-slate-100 text-slate-800'
                : 'bg-transparent text-slate-500 hover:bg-slate-50'
              }`}
          >
            {tab === 'All' ? 'All Records' : `${tab} (${serviceStationList.filter((m) => m.actionType === tab).length})`}
          </button>
        ))}
      </div>

      {/* Machine Data Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 text-[11px] text-slate-500 uppercase font-semibold border-b border-slate-100">
            <tr>
              <th className="p-4 pl-6 font-semibold">Machine ID & Name</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Action Type</th>
              <th className="p-4 font-semibold">Reason / Issue</th>
              <th className="p-4 font-semibold">Sent Date</th>
              <th className="p-4 font-semibold">Expected Delivery</th>
              <th className="p-4 pr-6 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-[13px] font-medium text-slate-700">
            {filteredMachines.length > 0 ? (
              filteredMachines.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedMachine(item)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="p-4 pl-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden shrink-0 p-1.5">
                      <img src={item.img} alt={item.name} className="max-h-full max-w-full object-contain drop-shadow-sm" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">{item.id}</div>
                    </div>
                  </td>
                  <td className="p-4 text-[13px] text-slate-600 font-medium">{item.category}</td>
                  <td className="p-4">
                    <span
                      className={`whitespace-nowrap inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${item.actionType === 'Service'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100/50'
                          : item.actionType === 'Recall'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100/50'
                            : 'bg-purple-50 text-purple-700 border border-purple-100/50'
                        }`}
                    >
                      {item.actionType}
                    </span>
                  </td>
                  <td className="p-4 text-[12px] text-slate-500 max-w-[200px] leading-relaxed">
                    <span className="line-clamp-2">{item.reason}</span>
                  </td>
                  <td className="p-4 text-[12px] text-slate-500">{item.sentDate}</td>
                  <td className="p-4 text-[12px] font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">schedule</span>
                      <span>{item.expectedDeliveryDate}</span>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors">
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-12 text-center text-slate-500 text-[13px] font-medium">
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
