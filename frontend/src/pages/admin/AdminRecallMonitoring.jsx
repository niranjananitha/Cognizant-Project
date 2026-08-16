import React from 'react';
import { useEquipment } from '../../contexts/EquipmentContext';

export default function AdminRecallMonitoring() {
  const { serviceStationList } = useEquipment();

  const recallTasks = serviceStationList.filter(item => item.actionType === 'Recall');

  const recalls = recallTasks.map((task) => ({
    id: `RCL-${task.id}`,
    title: task.reason?.split('.')[0] || `${task.name} Safety Notice`,
    vendor: task.serviceVendor,
    level: task.priority === 'Critical' ? 'Critical Class I Safety Advisory' : 'Class II FDA Advisory',
    affectedCount: 1, // Simplified for 1:1 relation
    remediatedCount: 0,
    complianceRate: '0.0%',
    status: task.status,
    img: task.img,
  }));

  const activeRecalls = recalls.length;
  const affectedUnits = recalls.reduce((sum, r) => sum + r.affectedCount, 0);
  const remediatedUnits = recalls.reduce((sum, r) => sum + r.remediatedCount, 0);
  const totalCompliance = affectedUnits ? ((remediatedUnits / affectedUnits) * 100).toFixed(1) + '%' : '100%';

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto animate-in fade-in duration-200 text-slate-800">
      {/* Page Title */}
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-rose-600 uppercase tracking-widest">
          <span className="material-symbols-outlined text-[16px]">report_problem</span>
          Executive Risk & Compliance
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 m-0 tracking-tight">Recall Monitoring</h1>
        <p className="text-[14px] text-slate-500 m-0 mt-1 font-medium">
          Executive monitoring of FDA recalls, vendor safety notices, and hospital fleet remediation compliance.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Recall Advisories</div>
          <div className="text-3xl font-semibold text-rose-600 mt-1">{activeRecalls} Advisories</div>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col gap-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Affected Hospital Units</div>
          <div className="text-3xl font-semibold text-primary mt-1">{affectedUnits} Devices</div>
        </div>
        <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 shadow-sm flex flex-col gap-1">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Overall Fleet Remediation</div>
          <div className="text-3xl font-semibold text-emerald-700 mt-1">{totalCompliance}</div>
        </div>
      </div>

      {/* Recalls Detail Feed */}
      <div className="grid grid-cols-1 gap-6">
        {recalls.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start gap-6 hover:border-slate-200 transition-colors">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center shrink-0">
                <img src={r.img} alt={r.title} className="max-h-full max-w-full object-contain mix-blend-multiply" />
              </div>
              <div className="flex flex-col gap-2 mt-0.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-[11px] font-semibold text-primary">{r.id}</span>
                  <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-semibold rounded-md uppercase tracking-wider border border-rose-100/50">
                    {r.level}
                  </span>
                </div>
                <h2 className="text-[17px] font-semibold text-slate-900 m-0 leading-tight pr-4">{r.title}</h2>
                <div className="text-[12px] font-medium text-slate-500 mt-1">
                  Vendor: <strong className="text-slate-800">{r.vendor}</strong> • Affected Units: <strong className="text-primary font-mono">{r.affectedCount}</strong> • Remediated: <strong className="text-emerald-700 font-mono">{r.remediatedCount}</strong>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 shrink-0 mt-1 md:mt-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider block">Remediation Rate</span>
                <span className="text-xl font-mono font-semibold text-emerald-700 block mt-0.5">{r.complianceRate}</span>
              </div>
              <span className="px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200 text-[11px] font-semibold rounded-md">
                {r.status}
              </span>
            </div>
          </div>
        ))}
        {recalls.length === 0 && (
          <div className="p-8 text-center bg-white border border-slate-100 rounded-2xl">
            <p className="text-slate-500 font-medium">No active recalls or safety advisories currently.</p>
          </div>
        )}
      </div>
    </div>
  );
}
