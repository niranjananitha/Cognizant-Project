import { useMemo, useState } from 'react';

const OUTCOMES = [
  { value: 'NOT_RESOLVED', label: 'Steps followed — issue not resolved' },
  { value: 'PARTIALLY_RESOLVED', label: 'Partially resolved / error recurs' },
  { value: 'NOT_ATTEMPTED', label: 'Not attempted (no documented procedure / unsafe)' },
];

const labelCls = 'text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5';
const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

export default function EscalationModal({ context, devices, onClose, onSubmit }) {
  const { answer, question, errorCode, equipment, conversationId, defaultOutcome } = context;
  const steps = answer?.troubleshooting_steps || [];
  const categoryDevices = useMemo(() => {
    const cat = (equipment.category || '').toLowerCase();
    const matches = devices.filter((d) => (d.category || '').toLowerCase() === cat);
    return matches.length ? matches : devices;
  }, [devices, equipment.category]);

  const [deviceId, setDeviceId] = useState(equipment.deviceId || categoryDevices[0]?.id || '');
  const [description, setDescription] = useState(
    `${errorCode ? `Device shows error ${errorCode}. ` : ''}${question || ''}`.trim()
  );
  const [attempted, setAttempted] = useState(() => steps.map(() => defaultOutcome === 'NOT_RESOLVED'));
  const [outcome, setOutcome] = useState(defaultOutcome || (steps.length ? 'NOT_RESOLVED' : 'NOT_ATTEMPTED'));
  const [safety, setSafety] = useState(answer?.escalation?.urgency === 'URGENT');
  const [priority, setPriority] = useState('HIGH');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!deviceId) return setError('Select the affected device.');
    if (description.trim().length < 5) return setError('Describe the problem (at least 5 characters).');
    setSubmitting(true);
    setError(null);
    const device = devices.find((d) => String(d.id) === String(deviceId));
    try {
      await onSubmit({
        equipment_id: Number(deviceId),
        issue: `[Equipment Assistance] ${errorCode ? `${errorCode} — ` : ''}${equipment.model || device?.machine_name || equipment.category}`.slice(0, 250),
        priority,
        observed_symptoms: description.trim(),
        escalation: {
          conversation_id: conversationId || null,
          error_code: errorCode || null,
          nurse_description: description.trim(),
          troubleshooting_attempted: steps.filter((_, i) => attempted[i]).map((s) => s.action),
          troubleshooting_outcome: outcome,
          patient_safety_concern: safety,
        },
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-100">
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">engineering</span> Biomedical Engineering
            </div>
            <h2 className="text-xl font-semibold text-slate-900 m-0 mt-1">Raise Technical Support Request</h2>
            <p className="text-[12px] text-slate-500 m-0 mt-1">
              {equipment.category}{equipment.model ? ` · ${equipment.manufacturer ? equipment.manufacturer + ' ' : ''}${equipment.model}` : ''}
              {errorCode && <> · Error <span className="font-mono-data font-semibold text-slate-700">{errorCode}</span></>}
            </p>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[13px] font-medium flex gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>{error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Affected device *</label>
              <select className={inputCls} value={deviceId} onChange={(e) => setDeviceId(e.target.value)} required>
                <option value="">Select device…</option>
                {categoryDevices.map((d) => (
                  <option key={d.id} value={d.id}>{d.machine_id} — {d.machine_name} ({d.department || 'No dept'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Requested priority</label>
              <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Problem description *</label>
            <textarea className={`${inputCls} min-h-[90px]`} value={description} maxLength={4000}
              onChange={(e) => setDescription(e.target.value)} />
          </div>

          {steps.length > 0 && (
            <div>
              <label className={labelCls}>Troubleshooting steps already attempted</label>
              <div className="space-y-2">
                {steps.map((s, i) => (
                  <label key={i} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 accent-[#003555]" checked={attempted[i]}
                      onChange={(e) => setAttempted((prev) => prev.map((v, j) => (j === i ? e.target.checked : v)))} />
                    <span className="text-[12.5px] text-slate-700"><strong className="text-slate-900">{s.step}.</strong> {s.action}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Troubleshooting outcome</label>
            <select className={inputCls} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              {OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer ${safety ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
            <input type="checkbox" className="mt-0.5 accent-red-600" checked={safety} onChange={(e) => setSafety(e.target.checked)} />
            <span className="text-[12.5px] text-slate-700">
              <strong className="text-slate-900">Patient-safety concern / safety-critical failure.</strong> Marks the request
              CRITICAL for urgent escalation per hospital policy.
            </span>
          </label>

          <p className="text-[11px] text-slate-400 m-0">
            Manual references and the identified issue are attached automatically from this conversation.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
          <button type="submit" disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-primary hover:bg-primary-container disabled:opacity-60 flex items-center gap-2">
            {submitting ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">send</span>}
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}
