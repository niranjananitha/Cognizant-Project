import React, { useState } from 'react';
import { TICKET_FLOW, formatDate } from '../../services/assistanceApi';

const PRIORITY_CLS = {
  CRITICAL: 'bg-red-50 text-red-700 border-red-100',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-100',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-100',
  LOW: 'bg-slate-50 text-slate-600 border-slate-200',
};

// Engineer actions on the existing service workflow endpoints.
const ENGINEER_ACTIONS = {
  RAISED: [{ action: 'acknowledge', label: 'Acknowledge', icon: 'thumb_up' }],
  ACKNOWLEDGED: [{ action: 'start-diagnosis', label: 'Start Diagnosis', icon: 'troubleshoot' }],
  ASSIGNED: [{ action: 'start-diagnosis', label: 'Start Diagnosis', icon: 'troubleshoot' }],
  IN_DIAGNOSIS: [{ action: 'start-service', label: 'Start Service', icon: 'build' }, { action: 'complete', label: 'Mark Resolved', icon: 'task_alt' }],
  IN_SERVICE: [{ action: 'waiting-for-parts', label: 'Waiting for Parts', icon: 'inventory' }, { action: 'complete', label: 'Mark Resolved', icon: 'task_alt' }],
  WAITING_FOR_PARTS: [{ action: 'start-service', label: 'Resume Service', icon: 'build' }],
  SERVICE_DELAYED: [{ action: 'start-service', label: 'Resume Service', icon: 'build' }],
};

function StatusTrack({ display }) {
  if (display === 'REJECTED') {
    return <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600">Rejected</span>;
  }
  const idx = TICKET_FLOW.indexOf(display);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {TICKET_FLOW.map((s, i) => (
        <React.Fragment key={s}>
          <span className={`px-2 py-1 rounded-md text-[9.5px] font-semibold uppercase tracking-wider whitespace-nowrap ${
            i < idx ? 'bg-emerald-50 text-emerald-700' : i === idx ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400'}`}>
            {s.replace('_', ' ')}
          </span>
          {i < TICKET_FLOW.length - 1 && <span className={`w-2.5 h-px ${i < idx ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function TicketCard({ ticket, mode, onAction, busy }) {
  const [open, setOpen] = useState(false);
  const e = ticket.escalation || {};
  const actions = mode === 'engineer' ? ENGINEER_ACTIONS[ticket.status] || [] : [];

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 space-y-4 ${e.safety_critical ? 'border-red-200' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono-data text-[13px] font-semibold text-primary">{ticket.ticket_number}</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${PRIORITY_CLS[ticket.priority]}`}>{ticket.priority}</span>
            {e.safety_critical && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-red-600 text-white flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">emergency</span> Urgent
              </span>
            )}
            {e.error_code && <span className="px-2 py-0.5 rounded-md text-[11px] font-mono-data font-semibold bg-slate-100 text-slate-700">{e.error_code}</span>}
          </div>
          <h3 className="text-[15px] font-semibold text-slate-900 m-0">
            {[e.manufacturer, e.equipment_model].filter(Boolean).join(' ') || e.equipment_category || ticket.issue}
          </h3>
          <div className="text-[11.5px] text-slate-500 font-medium flex gap-2 flex-wrap">
            <span>{e.equipment_category}</span><span className="text-slate-300">•</span>
            <span>{e.department || '—'}</span><span className="text-slate-300">•</span>
            <span>Device #{ticket.equipment_id}</span><span className="text-slate-300">•</span>
            <span>Raised {formatDate(ticket.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {actions.map((a) => (
            <button key={a.action} type="button" disabled={busy} onClick={() => onAction(ticket.id, a.action)}
              className="px-3 py-2 rounded-xl text-[12px] font-semibold bg-primary text-white hover:bg-primary-container disabled:opacity-50 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">{a.icon}</span>{a.label}
            </button>
          ))}
          {mode === 'nurse' && ticket.display_status === 'RESOLVED' && (
            <button type="button" disabled={busy} onClick={() => onAction(ticket.id, 'verify')}
              className="px-3 py-2 rounded-xl text-[12px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">verified</span>Confirm Device Working
            </button>
          )}
        </div>
      </div>

      <StatusTrack display={ticket.display_status} />

      <button type="button" onClick={() => setOpen((v) => !v)} className="text-[12px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1">
        <span className="material-symbols-outlined text-[16px]">{open ? 'expand_less' : 'expand_more'}</span>
        Troubleshooting details
      </button>

      {open && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12.5px]">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">Reported by nurse</div>
            <p className="m-0 text-slate-800">{e.nurse_description}</p>
            {e.identified_issue && (<>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 pt-1">Chatbot-identified issue</div>
              <p className="m-0 text-slate-700">{e.identified_issue}</p>
            </>)}
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 pt-1">Outcome</div>
            <p className="m-0 text-slate-700 font-mono-data text-[11.5px]">{e.troubleshooting_outcome}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">Steps attempted</div>
            {e.troubleshooting_attempted?.length ? (
              <ol className="m-0 pl-4 space-y-1 text-slate-700">{e.troubleshooting_attempted.map((s, i) => <li key={i}>{s}</li>)}</ol>
            ) : <p className="m-0 text-slate-400">None recorded</p>}
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 pt-1">Manual references</div>
            {e.manual_references?.length ? (
              <ul className="m-0 pl-4 space-y-1 text-slate-700">
                {e.manual_references.map((r, i) => <li key={i}>{r.document_title} v{r.version}, p.{r.page_number}{r.section_heading ? ` — ${r.section_heading}` : ''}</li>)}
              </ul>
            ) : <p className="m-0 text-slate-400">None attached</p>}
          </div>
        </div>
      )}
    </div>
  );
}
