import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createAssistanceApi, formatDate } from '../services/assistanceApi';
import AssistantAnswerCard from '../components/assistance/AssistantAnswerCard';
import EscalationModal from '../components/assistance/EscalationModal';
import TicketCard from '../components/assistance/TicketCard';
import ChatHistoryPanel from '../components/assistance/ChatHistoryPanel';

const labelCls = 'text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5';
const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50';

const suggestions = (equipment) => {
  const noun = (equipment || 'equipment').replace(/s$/, '').toLowerCase();
  return [
    `How do I operate this ${noun}?`,
    'What does error code E05 mean?',
    'How do I troubleshoot a battery warning?',
    'What should I check when the machine displays a pressure alarm?',
    "Where can I find the manufacturer's operating instructions?",
  ];
};

export default function EquipmentAssistance() {
  const { token, API_URL, user } = useAuth();
  const api = useMemo(() => createAssistanceApi(API_URL, token), [API_URL, token]);
  const isEngineer = user?.role === 'MAINTENANCE_ENGINEER';

  const [tab, setTab] = useState('assistant');
  const [machines, setMachines] = useState([]); // hospital inventory + manuals covering each machine
  const [machinesLoading, setMachinesLoading] = useState(true);
  const [setupError, setSetupError] = useState(null);

  const [categoryChoice, setCategoryChoice] = useState('');
  const [machineId, setMachineId] = useState('');
  const [fallbackCategory, setFallbackCategory] = useState(''); // old conversations saved without a machine
  const [modelKey, setModelKey] = useState(''); // "manufacturer||model"
  const [errorCode, setErrorCode] = useState('');
  const [question, setQuestion] = useState('');

  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [history, setHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [escalation, setEscalation] = useState(null);
  const [notice, setNotice] = useState(null);

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState(null);
  const [ticketBusy, setTicketBusy] = useState(false);
  const scrollRef = useRef(null);

  // ------------------------------------------------------------ data loading
  const loadHistory = useCallback(() => {
    api.history({ limit: 5 }).then(setHistory).catch(() => setHistory([]));
  }, [api]);

  useEffect(() => {
    api.machines()
      .then(setMachines)
      .catch((e) => setSetupError(e.message))
      .finally(() => setMachinesLoading(false));
    loadHistory();
  }, [api, loadHistory]);

  const loadTickets = useCallback(() => {
    setTicketsLoading(true);
    setTicketsError(null);
    (isEngineer ? api.escalationQueue() : api.myTickets())
      .then((d) => setTickets(d.items || []))
      .catch((e) => setTicketsError(e.message))
      .finally(() => setTicketsLoading(false));
  }, [api, isEngineer]);

  const openTab = (id) => {
    setTab(id);
    if (id === 'tickets') loadTickets();
    if (id === 'assistant') loadHistory();
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  // ------------------------------------------------------------ derived
  const machinesByCategory = useMemo(() => {
    const groups = {};
    machines.forEach((m) => { (groups[m.category] ||= []).push(m); });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [machines]);

  const categoryMachines = machinesByCategory.find(([cat]) => cat === categoryChoice)?.[1] || [];
  const machine = machines.find((m) => String(m.id) === String(machineId));
  const category = machine?.category || fallbackCategory;
  const models = machine?.category_models || [];
  const matchedKeys = new Set((machine?.matched_models || []).map((m) => `${m.manufacturer}||${m.equipment_model}`));
  const selectedModel = modelKey
    ? { manufacturer: modelKey.split('||')[0], equipment_model: modelKey.split('||')[1] }
    : null;
  const hasManuals = models.length > 0;
  const hasMatchedManual = matchedKeys.size > 0;

  // ------------------------------------------------------------ actions
  const resetConversation = () => {
    setMessages([]);
    setConversationId(null);
    setChatError(null);
    setErrorCode('');
    setQuestion('');
  };

  const chooseCategory = (value) => {
    setCategoryChoice(value);
    setMachineId('');
    setFallbackCategory('');
    setModelKey('');
    resetConversation();
  };

  const selectMachine = (id) => {
    const m = machines.find((x) => String(x.id) === String(id));
    setMachineId(id);
    setFallbackCategory('');
    // Auto-select the manual when exactly one uploaded manual matches this machine.
    const only = m?.matched_models?.length === 1 ? m.matched_models[0] : null;
    setModelKey(only ? `${only.manufacturer}||${only.equipment_model}` : '');
    resetConversation();
  };

  const selectModelByName = (name) => {
    const m = models.find((x) => x.equipment_model === name);
    if (m) setModelKey(`${m.manufacturer}||${m.equipment_model}`);
  };

  const send = async (text) => {
    const code = errorCode.trim();
    const q = (text ?? question).trim() || (code ? `What does error code ${code} mean and how do I troubleshoot it?` : '');
    if (!category) return setChatError('Select the machine first.');
    if (q.length < 2) return setChatError('Type a question or enter the error code shown on the device.');
    setChatError(null);
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', content: q, errorCode: code || null }]);
    setQuestion('');
    try {
      const res = await api.chat({
        question: q,
        equipment_category: category,
        equipment_model: selectedModel?.equipment_model || null,
        manufacturer: selectedModel?.manufacturer || null,
        error_code: code || null,
        equipment_id: machine ? machine.id : null,
        conversation_id: conversationId,
      });
      setConversationId(res.conversation_id);
      setMessages((prev) => [...prev, { role: 'assistant', answer: res.answer, question: q, errorCode: code || null }]);
      loadHistory();
    } catch (e) {
      setChatError(e.message);
      setMessages((prev) => prev.slice(0, -1));
      setQuestion(q);
    } finally {
      setSending(false);
    }
  };

  const openConversation = async (id) => {
    setChatError(null);
    try {
      const conv = await api.conversation(id);
      const linked = machines.find((m) => m.id === conv.equipment_id);
      const known = Boolean(linked);
      setCategoryChoice(linked ? linked.category : '');
      setMachineId(known ? String(conv.equipment_id) : '');
      setFallbackCategory(known ? '' : conv.equipment_category || '');
      setModelKey(conv.equipment_model && conv.manufacturer ? `${conv.manufacturer}||${conv.equipment_model}` : '');
      setConversationId(conv.id);
      let lastQuestion = null;
      setMessages(conv.messages.map((m) => {
        if (m.role === 'USER') {
          lastQuestion = m.content;
          return { role: 'user', content: m.content, errorCode: m.error_code };
        }
        return m.answer
          ? { role: 'assistant', answer: m.answer, question: lastQuestion, errorCode: m.answer.error_identification?.error_code || null }
          : { role: 'user', content: m.content };
      }));
      setTab('assistant');
    } catch (e) {
      setChatError(e.message);
    }
  };

  const startEscalation = (msg, defaultOutcome) => {
    setEscalation({
      answer: msg.answer,
      question: msg.question,
      errorCode: msg.errorCode,
      conversationId,
      defaultOutcome,
      equipment: {
        category,
        model: selectedModel?.equipment_model,
        manufacturer: selectedModel?.manufacturer,
        deviceId: machineId,
      },
    });
  };

  const handleDeleted = (id) => {
    if (id === conversationId) resetConversation();
    loadHistory();
  };

  const submitEscalation = async (body) => {
    const ticket = await api.escalate(body);
    setEscalation(null);
    setNotice(`Technical support request ${ticket.ticket_number} raised (${ticket.priority}). Biomedical Engineering has been notified via the service workqueue.`);
    setTimeout(() => setNotice(null), 8000);
  };

  const ticketAction = async (id, action) => {
    setTicketBusy(true);
    setTicketsError(null);
    try {
      const updated = await api.ticketAction(id, action);
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (e) {
      setTicketsError(e.message);
    } finally {
      setTicketBusy(false);
    }
  };

  // ------------------------------------------------------------ render
  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto text-slate-800">
      {/* Title */}
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
          <span className="material-symbols-outlined text-[16px]">support_agent</span>
          Clinical Technical Support
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 m-0 tracking-tight">Equipment Assistance</h1>
            <p className="text-[14px] text-slate-500 m-0 mt-2 font-medium max-w-3xl">
              Operating guidance and operator-level troubleshooting drawn only from manufacturer manuals uploaded by your Hospital Administrator.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-1.5 border border-slate-100 flex gap-1 shadow-sm">
            {[
              { id: 'assistant', label: 'Assistant', icon: 'forum' },
              { id: 'history', label: 'History', icon: 'history' },
              { id: 'tickets', label: isEngineer ? 'Escalation Queue' : 'My Support Tickets', icon: 'confirmation_number' },
            ].map((t) => (
              <button key={t.id} type="button" onClick={() => openTab(t.id)}
                className={`px-4 py-2 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 transition-all ${tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                <span className="material-symbols-outlined text-[17px]">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 font-medium text-[13px] flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-600">check_circle</span>
          <span className="flex-1">{notice}</span>
          <button type="button" onClick={() => { setNotice(null); openTab('tickets'); }} className="text-[12px] font-semibold underline">Track ticket</button>
        </div>
      )}
      {setupError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[13px] font-medium flex gap-2">
          <span className="material-symbols-outlined text-[18px]">cloud_off</span>{setupError}
        </div>
      )}

      {tab === 'assistant' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: equipment + history */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-4">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-2 m-0 border-b border-slate-100 pb-3">
                <span className="material-symbols-outlined text-slate-500 text-[18px]">medical_services</span>
                Equipment
              </h2>
              <div>
                <label className={labelCls}>Category *</label>
                <select className={inputCls} value={categoryChoice} disabled={machinesLoading}
                  onChange={(e) => chooseCategory(e.target.value)}>
                  <option value="">
                    {machinesLoading ? 'Loading inventory…' : machines.length ? 'Select category…' : 'No machines in inventory'}
                  </option>
                  {machinesByCategory.map(([cat, list]) => (
                    <option key={cat} value={cat}>{cat} ({list.length})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Machine *</label>
                <select className={inputCls} value={machineId} disabled={!categoryChoice}
                  onChange={(e) => selectMachine(e.target.value)}>
                  <option value="">{categoryChoice ? 'Select machine…' : 'Select a category first'}</option>
                  {categoryMachines.map((m) => (
                    <option key={m.id} value={m.id}>{m.machine_name} · {m.machine_id}</option>
                  ))}
                </select>
              </div>

              {machine && (
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-[12px] text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800">{machine.machine_name}</div>
                  <div>{machine.category} · {machine.machine_id}</div>
                  {(machine.department || machine.location) && (
                    <div>{[machine.department, machine.location].filter(Boolean).join(' · ')}</div>
                  )}
                </div>
              )}
              {!machine && fallbackCategory && (
                <p className="text-[12px] text-slate-500 m-0">This saved conversation is not linked to an inventory machine ({fallbackCategory}).</p>
              )}

              {machine && (
                <div>
                  <label className={labelCls}>Manual used for answers</label>
                  <select className={inputCls} value={modelKey} disabled={!hasManuals}
                    onChange={(e) => { setModelKey(e.target.value); resetConversation(); }}>
                    <option value="">{hasManuals ? 'Select manual…' : 'No manuals uploaded'}</option>
                    {models.map((m) => {
                      const key = `${m.manufacturer}||${m.equipment_model}`;
                      return (
                        <option key={key} value={key}>
                          {m.manufacturer} {m.equipment_model} ({m.document_count}){matchedKeys.has(key) ? ' ✓ matches machine' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {machine && hasMatchedManual && selectedModel && matchedKeys.has(modelKey) && (
                <p className="text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 m-0 flex gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Manufacturer manual found for this machine.
                </p>
              )}
              {machine && hasManuals && !hasMatchedManual && (
                <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2.5 m-0">
                  No manual is uploaded for this exact machine. Choose the {machine.category} manual that applies, or ask your Hospital Administrator to upload one.
                </p>
              )}
              {machine && !hasManuals && (
                <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2.5 m-0">
                  No manufacturer manuals are uploaded for {machine.category} yet. Ask your Hospital Administrator to upload them in the Knowledge Base.
                </p>
              )}
              {machine && hasManuals && !selectedModel && hasMatchedManual && (
                <p className="text-[12px] text-slate-500 m-0">Select the manual so only that manufacturer's instructions are used.</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-2 m-0">
                  <span className="material-symbols-outlined text-slate-500 text-[18px]">history</span>
                  Recent
                </h2>
                <button type="button" onClick={resetConversation}
                  className="text-[11px] font-semibold text-primary flex items-center gap-1 hover:text-primary/80">
                  <span className="material-symbols-outlined text-[15px]">add</span>New
                </button>
              </div>
              <div className="space-y-1.5 max-h-[340px] overflow-y-auto">
                {history.length === 0 && <p className="text-[12px] text-slate-400 m-0 py-2">No previous conversations.</p>}
                {history.map((h) => (
                  <button key={h.id} type="button" onClick={() => openConversation(h.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${h.id === conversationId ? 'border-primary/30 bg-primary-fixed/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <div className="text-[12.5px] font-semibold text-slate-800 line-clamp-1">{h.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {[h.machine_name || h.equipment_category, h.equipment_model].filter(Boolean).join(' · ')} · {formatDate(h.updated_at)}
                    </div>
                  </button>
                ))}
              </div>
              {history.length > 0 && (
                <button type="button" onClick={() => openTab('history')}
                  className="w-full text-[12px] font-semibold text-primary hover:text-primary/80 flex items-center justify-center gap-1 pt-1">
                  View all history<span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: chat */}
          <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-[640px] h-[calc(100vh-230px)]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                  <span className="material-symbols-outlined">clinical_notes</span>
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-slate-900">
                    {machine ? `${machine.machine_name} · ${machine.machine_id}` : category || 'Select a machine to begin'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {selectedModel ? `Manual: ${selectedModel.manufacturer} ${selectedModel.equipment_model} · ` : ''}Answers cite manual page numbers · Decision support only
                  </div>
                </div>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-5 bg-slate-50/40">
              {messages.length === 0 && !sending && (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-10">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[28px]">menu_book</span>
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-slate-800">Ask about operation, alarms or error codes</div>
                    <p className="text-[12.5px] text-slate-500 m-0 mt-1 max-w-md">
                      Enter the code exactly as shown on the device screen. Only operator-level actions documented by the manufacturer are shown.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                    {suggestions(category).map((s) => (
                      <button key={s} type="button" disabled={!category || sending} onClick={() => send(s)}
                        className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-[12px] font-medium text-slate-700 hover:border-primary hover:text-primary disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-slate-700 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[75%] bg-primary text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
                      {m.errorCode && (
                        <span className="inline-flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded-md bg-white/15 text-[11px] font-mono-data font-semibold">
                          <span className="material-symbols-outlined text-[13px]">error</span>{m.errorCode}
                        </span>
                      )}
                      <div className="text-[13.5px] leading-relaxed">{m.content}</div>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="max-w-[92%]">
                    <AssistantAnswerCard
                      answer={m.answer}
                      onEscalate={(outcome) => startEscalation(m, outcome)}
                      onSelectModel={selectModelByName}
                    />
                  </div>
                )
              )}

              {sending && (
                <div className="flex items-center gap-3 text-[12.5px] text-slate-500 font-medium bg-white border border-slate-100 rounded-2xl px-4 py-3 w-fit shadow-sm">
                  <span className="w-4 h-4 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
                  Searching manufacturer manuals…
                </div>
              )}
            </div>

            {/* Composer */}
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-slate-100 p-4 space-y-2.5">
              {chatError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 text-red-700 text-[12.5px] font-medium flex gap-2">
                  <span className="material-symbols-outlined text-[17px]">error</span>{chatError}
                </div>
              )}
              <div className="flex gap-3 items-end">
                <div className="w-40 shrink-0">
                  <label className={labelCls}>Error code</label>
                  <input className={`${inputCls} font-mono-data uppercase`} placeholder="e.g. E05" maxLength={50}
                    value={errorCode} onChange={(e) => setErrorCode(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className={labelCls}>Question</label>
                  <textarea rows={1} className={`${inputCls} resize-none`} maxLength={2000}
                    placeholder={category ? 'Describe what you see or ask how to operate the device…' : 'Select a machine first'}
                    value={question} onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
                </div>
                <button type="submit" disabled={sending || !category}
                  className="h-[42px] px-5 rounded-xl bg-primary text-white text-[13px] font-semibold flex items-center gap-2 hover:bg-primary-container disabled:opacity-50 shrink-0">
                  <span className="material-symbols-outlined text-[18px]">send</span>Send
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : tab === 'history' ? (
        <ChatHistoryPanel
          api={api}
          machines={machines}
          activeConversationId={conversationId}
          onOpen={openConversation}
          onDeleted={handleDeleted}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-slate-500 m-0 font-medium">
              {isEngineer
                ? 'Technical support requests escalated by clinical staff from Equipment Assistance.'
                : 'Requests you raised to Biomedical Engineering. Confirm the device works once a request is resolved.'}
            </p>
            <button type="button" onClick={loadTickets}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">refresh</span>Refresh
            </button>
          </div>
          {ticketsError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[13px] font-medium">{ticketsError}</div>
          )}
          {ticketsLoading ? (
            <div className="p-12 flex justify-center"><span className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin" /></div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-100 rounded-2xl text-slate-500 text-[13px] font-medium">
              No technical support requests yet.
            </div>
          ) : (
            tickets.map((t) => (
              <TicketCard key={t.id} ticket={t} mode={isEngineer ? 'engineer' : 'nurse'} onAction={ticketAction} busy={ticketBusy} />
            ))
          )}
        </div>
      )}

      {escalation && (
        <EscalationModal context={escalation} devices={machines} onClose={() => setEscalation(null)} onSubmit={submitEscalation} />
      )}
    </div>
  );
}
