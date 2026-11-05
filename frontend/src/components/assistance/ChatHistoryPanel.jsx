import { useEffect, useMemo, useState } from 'react';
import { formatDate } from '../../services/assistanceApi';

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

const STATUS = {
  GROUNDED_ANSWER: { label: 'Answered from manual', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  RETRIEVAL_ONLY: { label: 'Manual excerpts', cls: 'bg-sky-50 text-sky-700 border-sky-100' },
  NO_KNOWLEDGE_BASE: { label: 'No manual uploaded', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  NO_RELEVANT_CONTEXT: { label: 'Not found in manual', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  ERROR_CODE_NOT_FOUND: { label: 'Code not documented', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  NO_TROUBLESHOOTING_PROCEDURE: { label: 'No operator procedure', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  MODEL_SELECTION_REQUIRED: { label: 'Model selection needed', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export default function ChatHistoryPanel({ api, machines, activeConversationId, onOpen, onDeleted }) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [machineFilter, setMachineFilter] = useState('');
  const [items, setItems] = useState([]);
  const [loadedKey, setLoadedKey] = useState(null); // which search the current results belong to
  const [error, setError] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const requestKey = `${debounced}|${machineFilter}`;
  const loading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    api.history({ q: debounced, equipmentId: machineFilter, limit: 200 })
      .then((rows) => { if (!cancelled) { setItems(rows); setError(null); } })
      .catch((e) => { if (!cancelled) { setItems([]); setError(e.message); } })
      .finally(() => { if (!cancelled) setLoadedKey(`${debounced}|${machineFilter}`); });
    return () => { cancelled = true; };
  }, [api, debounced, machineFilter]);

  const machinesByCategory = useMemo(() => {
    const groups = {};
    machines.forEach((m) => { (groups[m.category] ||= []).push(m); });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [machines]);

  const remove = async (id) => {
    setBusyId(id);
    setError(null);
    try {
      await api.deleteConversation(id);
      setItems((prev) => prev.filter((h) => h.id !== id));
      setConfirmId(null);
      onDeleted(id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input className={`${inputCls} pl-10`} placeholder="Search questions, answers or error codes…" maxLength={200}
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className={`${inputCls} md:w-80`} value={machineFilter} onChange={(e) => setMachineFilter(e.target.value)}>
          <option value="">All machines</option>
          {machinesByCategory.map(([category, list]) => (
            <optgroup key={category} label={category}>
              {list.map((m) => <option key={m.id} value={m.id}>{m.machine_name} · {m.machine_id}</option>)}
            </optgroup>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[13px] font-medium">{error}</div>
      )}

      {loading ? (
        <div className="p-12 flex justify-center"><span className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-100 rounded-2xl text-slate-500 text-[13px] font-medium">
          {debounced || machineFilter ? 'No conversations match your search.' : 'No conversations yet. Questions you ask the assistant are saved here.'}
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-[12px] text-slate-500 m-0 font-medium">{items.length} conversation{items.length === 1 ? '' : 's'}</p>
          {items.map((h) => {
            const status = STATUS[h.last_answer_status];
            const machineLabel = h.machine_name ? `${h.machine_name} · ${h.machine_code}` : h.equipment_category;
            return (
              <div key={h.id}
                className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3 ${h.id === activeConversationId ? 'border-primary/40' : 'border-slate-100'}`}>
                <button type="button" onClick={() => onOpen(h.id)} className="flex-1 min-w-0 text-left">
                  <div className="text-[13.5px] font-semibold text-slate-900 line-clamp-1">{h.title}</div>
                  <div className="text-[12px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {machineLabel && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">medical_services</span>{machineLabel}
                      </span>
                    )}
                    {h.equipment_model && <span>Manual: {[h.manufacturer, h.equipment_model].filter(Boolean).join(' ')}</span>}
                    <span>{Math.ceil(h.message_count / 2)} question{Math.ceil(h.message_count / 2) === 1 ? '' : 's'}</span>
                    <span>{formatDate(h.updated_at)}</span>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  {status && (
                    <span className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${status.cls}`}>{status.label}</span>
                  )}
                  {confirmId === h.id ? (
                    <>
                      <span className="text-[12px] text-slate-600 font-medium">Delete?</span>
                      <button type="button" disabled={busyId === h.id} onClick={() => remove(h.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-[12px] font-semibold disabled:opacity-50">Delete</button>
                      <button type="button" onClick={() => setConfirmId(null)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => onOpen(h.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[12px] font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">forum</span>Open
                      </button>
                      <button type="button" onClick={() => setConfirmId(h.id)} title="Delete conversation"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 flex">
                        <span className="material-symbols-outlined text-[17px]">delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
