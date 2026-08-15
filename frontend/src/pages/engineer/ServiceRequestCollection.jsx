import React, { useState } from 'react';
import { machineImages } from '../../assets/images';

export default function ServiceRequestCollection({ onNavigate, searchQuery, onOpenMachineWorkspace }) {
  const [filterCategory, setFilterCategory] = useState('All');

  const requests = [
    {
      id: 'REQ-2023-901',
      assetId: 'VEN-2023-8472',
      equipment: 'Respironics V60 Ventilator',
      category: 'Ventilators',
      department: 'Intensive Care (ICU Bed 04)',
      submittedBy: 'Nurse Dr. Priya',
      time: '15 mins ago',
      issue: 'High compressor vibration alarm during peak oxygen delivery. Airway pressure sensor drift noted.',
      priority: 'Urgent',
      status: 'Pending Assignment',
      serialNo: 'PH-V60-99824',
      img: machineImages.ventilator,
    },
    {
      id: 'REQ-2023-884',
      assetId: 'MX700-04',
      equipment: 'IntelliVue MX700 Monitor',
      category: 'Patient Monitors',
      department: 'Intensive Care (ICU Bed 01)',
      submittedBy: 'Nurse S. Thomas',
      time: '1 hour ago',
      issue: 'Touchscreen unresponsive during patient admission. Calibration failure code ERR-09.',
      priority: 'High',
      status: 'Triaged',
      serialNo: 'PH-MX700-1120',
      img: machineImages.monitor,
    },
    {
      id: 'REQ-2023-762',
      assetId: 'DEF-402-B',
      equipment: 'BeneHeart D3 Defibrillator',
      category: 'Defibrillators',
      department: 'Emergency (ER Bay 02)',
      submittedBy: 'Clinical Lead Nurse',
      time: '3 hours ago',
      issue: 'Manufacturer safety recall notice #2023-REV4 for capacitor timer update.',
      priority: 'Critical',
      status: 'In Queue',
      serialNo: 'MR-D3-44109',
      img: machineImages.defibrillator,
    },
    {
      id: 'REQ-2023-610',
      assetId: 'INF-3301-P',
      equipment: 'Alaris System Infusion Pump',
      category: 'Infusion Pumps',
      department: 'Surgery OR-3',
      submittedBy: 'OR Technician',
      time: 'Yesterday',
      issue: 'Occlusion sensor threshold false alarm during drug delivery protocol.',
      priority: 'Medium',
      status: 'Assigned',
      serialNo: 'BD-ALR-8841',
      img: machineImages.infusionPump,
    },
    {
      id: 'REQ-2023-512',
      assetId: 'MRI-102',
      equipment: 'Siemens Magnetom 3.0T MRI',
      category: 'Imaging Systems',
      department: 'Radiology Room 102A',
      submittedBy: 'Radiology Tech',
      time: '2 days ago',
      issue: 'Helium compressor chiller loop pressure warning during high gradient pulse sequences.',
      priority: 'High',
      status: 'Diagnostics',
      serialNo: 'SM-MAG-3001',
      img: machineImages.mri,
    },
  ];

  const filteredRequests = requests.filter((r) => {
    const matchSearch =
      !searchQuery ||
      r.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.issue.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory = filterCategory === 'All' || r.status === filterCategory || r.category === filterCategory;

    return matchSearch && matchCategory;
  });

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto">
      {/* Title Header */}
      <div className="flex flex-col gap-2 border-b border-outline-variant/40 pb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest">
          <span className="material-symbols-outlined text-base">medical_services</span>
          Triage & Dispatch Queue
        </div>
        <h1 className="font-display-lg text-3xl font-extrabold text-on-background m-0">Service Request</h1>
        <p className="font-body-md text-sm text-on-surface-variant m-0">
          Review incoming service requests submitted by clinical staff and launch machine-specific repair workspaces.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status Triage:</span>
          {['All', 'Pending Assignment', 'Triaged', 'In Queue', 'Assigned'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterCategory(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterCategory === tab
                  ? 'bg-primary text-white shadow'
                  : 'bg-surface hover:bg-surface-container text-on-surface-variant border border-outline-variant/40'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <span className="text-xs text-on-surface-variant font-mono font-semibold shrink-0">Total Requests: {requests.length}</span>
      </div>

      {/* Requests List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.map((req) => (
          <div
            key={req.id}
            className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline-variant/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-primary/40 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-low border border-outline-variant/50 p-2 flex items-center justify-center shrink-0">
                <img src={req.img} alt={req.equipment} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-extrabold text-primary">{req.id}</span>
                  <span className="text-xs font-mono text-on-surface-variant">• Asset: {req.assetId}</span>
                  <span className="text-xs font-mono text-on-surface-variant">• Submitted {req.time}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                      req.priority === 'Critical' || req.priority === 'Urgent'
                        ? 'bg-error-container text-on-error-container border border-error-container'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {req.priority}
                  </span>
                </div>
                <h3 className="font-headline-sm text-lg font-bold text-on-surface m-0">{req.equipment}</h3>
                <div className="text-xs font-semibold text-primary">{req.department} — <span className="text-on-surface-variant">Req by {req.submittedBy}</span></div>
                <p className="text-xs text-on-surface-variant mt-1 max-w-3xl leading-relaxed">{req.issue}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onOpenMachineWorkspace && onOpenMachineWorkspace(req)}
                className="bg-gradient-to-r from-primary to-secondary text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow hover:opacity-90 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">engineering</span>
                Assign & Open Workspace
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
