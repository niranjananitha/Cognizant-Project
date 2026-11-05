import { useState } from 'react';

const STATUS_META = {
  GROUNDED_ANSWER: { label: 'Verified from manufacturer manual', icon: 'verified', cls: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
  RETRIEVAL_ONLY: { label: 'Manual excerpts · AI explanation offline', icon: 'menu_book', cls: 'bg-sky-50 text-sky-800 border-sky-100' },
  ERROR_CODE_NOT_FOUND: { label: 'Error code not found in uploaded manuals', icon: 'search_off', cls: 'bg-amber-50 text-amber-800 border-amber-100' },
  NO_TROUBLESHOOTING_PROCEDURE: { label: 'No operator procedure documented', icon: 'block', cls: 'bg-amber-50 text-amber-800 border-amber-100' },
  NO_RELEVANT_CONTEXT: { label: 'No verified answer in manuals', icon: 'help_center', cls: 'bg-slate-50 text-slate-700 border-slate-200' },
  NO_KNOWLEDGE_BASE: { label: 'No manuals uploaded for this equipment', icon: 'folder_off', cls: 'bg-slate-50 text-slate-700 border-slate-200' },
  MODEL_SELECTION_REQUIRED: { label: 'Select the exact equipment model', icon: 'tune', cls: 'bg-amber-50 text-amber-800 border-amber-100' },
};

const SectionTitle = ({ icon, children }) => (
  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 m-0 mb-2.5">
    <span className="material-symbols-outlined text-[15px]">{icon}</span>
    {children}
  </h4>
);

const SourceChip = ({ refId, label }) =>
  refId ? (
    <span
      title={label || refId}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold font-mono-data whitespace-nowrap"
    >
      <span className="material-symbols-outlined text-[12px]">description</span>
      {refId}
      {label && <span className="font-body-md font-medium text-slate-500 hidden md:inline">· {label}</span>}
    </span>
  ) : null;

export default function AssistantAnswerCard({ answer, onEscalate, onSelectModel }) {
  const [showSources, setShowSources] = useState(false);
  const [outcome, setOutcome] = useState(null); // null | 'resolved' | 'unresolved'
  const meta = STATUS_META[answer.answer_status] || STATUS_META.NO_RELEVANT_CONTEXT;
  const ei = answer.error_identification;
  const steps = answer.troubleshooting_steps || [];
  const urgent = answer.escalation?.urgency === 'URGENT';
  const canEscalate = answer.escalation?.recommended || answer.answer_type === 'TROUBLESHOOTING';

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Status banner */}
      <div className={`px-5 py-2.5 border-b flex items-center justify-between gap-3 flex-wrap ${meta.cls}`}>
        <span className="flex items-center gap-2 text-[12px] font-semibold">
          <span className="material-symbols-outlined text-[18px]">{meta.icon}</span>
          {meta.label}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70 font-mono-data">
          {answer.retrieval?.chunks_returned ?? 0} refs · top {Number(answer.retrieval?.top_score || 0).toFixed(2)}
        </span>
      </div>

      <div className="p-5 space-y-5">
        {urgent && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-800 text-[13px] font-semibold flex items-start gap-2.5">
            <span className="material-symbols-outlined text-red-600 text-[20px]">emergency</span>
            <span>Possible safety-critical condition. Ensure patient safety per hospital protocol and escalate urgently.</span>
          </div>
        )}

        <p className="text-[14px] text-slate-800 leading-relaxed m-0 font-medium">{answer.summary}</p>

        {answer.available_models?.length > 0 && (
          <div>
            <SectionTitle icon="devices">Models with uploaded manuals</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {answer.available_models.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSelectModel?.(m)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:border-primary hover:text-primary transition-colors"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error identification */}
        {ei && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <SectionTitle icon="error">Error Identification</SectionTitle>
            <div className="flex items-start gap-4 flex-wrap">
              <span className={`px-3 py-1.5 rounded-lg font-mono-data text-[15px] font-semibold border ${ei.documented ? 'bg-white text-primary border-slate-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                {ei.error_code}
              </span>
              <div className="flex-1 min-w-[220px] space-y-1">
                <div className="text-[13px] text-slate-800 font-medium">
                  {ei.description || (ei.documented ? 'Listed in the manual without a description.' : 'Not documented in the uploaded manuals — no meaning is given.')}
                </div>
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 flex-wrap">
                  {ei.equipment_model && <span>Model: <strong className="text-slate-700">{ei.equipment_model}</strong></span>}
                  {ei.source_label && <span>Source: <strong className="text-slate-700">{ei.source_label}</strong></span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {answer.explanation && (
          <div>
            <SectionTitle icon="info">Possible Meaning</SectionTitle>
            <p className="text-[13px] text-slate-700 leading-relaxed m-0">{answer.explanation}</p>
          </div>
        )}

        {/* Steps */}
        {steps.length > 0 && (
          <div>
            <SectionTitle icon="checklist">
              {answer.answer_type === 'TROUBLESHOOTING' ? 'Safe Troubleshooting Steps' : 'Manufacturer Instructions'}
            </SectionTitle>
            <ol className="space-y-2.5 m-0 p-0 list-none">
              {steps.map((s) => (
                <li key={s.step} className="flex gap-3 p-3.5 rounded-xl border border-slate-100 bg-white">
                  <span className="w-7 h-7 shrink-0 rounded-lg bg-primary text-white text-[12px] font-semibold flex items-center justify-center">
                    {s.step}
                  </span>
                  <div className="flex-1 space-y-1.5">
                    {s.check && (
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Check: <span className="normal-case tracking-normal text-slate-700">{s.check}</span></div>
                    )}
                    <div className="text-[13px] text-slate-800 font-medium leading-relaxed">
                      {s.verbatim && <span className="text-slate-400 mr-1">“</span>}
                      {s.action}
                      {s.verbatim && <span className="text-slate-400 ml-0.5">”</span>}
                    </div>
                    {s.expected_result && (
                      <div className="text-[12px] text-emerald-700 font-medium flex items-start gap-1">
                        <span className="material-symbols-outlined text-[14px] mt-px">arrow_forward</span>
                        Expected: {s.expected_result}
                      </div>
                    )}
                    <SourceChip refId={s.source_ref} label={s.source_label} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {answer.expected_outcome && (
          <div>
            <SectionTitle icon="task_alt">Expected Outcome</SectionTitle>
            <p className="text-[13px] text-slate-700 leading-relaxed m-0">{answer.expected_outcome}</p>
          </div>
        )}

        {answer.warnings?.length > 0 && (
          <ul className="m-0 p-0 list-none space-y-1.5">
            {answer.warnings.map((w, i) => (
              <li key={i} className="text-[12px] text-amber-800 bg-amber-50/70 border border-amber-100 rounded-lg px-3 py-2 flex gap-2">
                <span className="material-symbols-outlined text-[15px] text-amber-600">warning</span>
                {w}
              </li>
            ))}
          </ul>
        )}

        {/* Resolution & escalation */}
        {canEscalate && (
          <div className="rounded-xl border border-slate-100 p-4 space-y-3">
            {steps.length > 0 && outcome === null && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[13px] font-semibold text-slate-700">Did the documented steps resolve the issue?</span>
                <button type="button" onClick={() => setOutcome('resolved')}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100">
                  Yes, resolved
                </button>
                <button type="button" onClick={() => setOutcome('unresolved')}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-red-50 text-red-700 border border-red-100 hover:bg-red-100">
                  No, still occurring
                </button>
              </div>
            )}
            {outcome === 'resolved' && (
              <p className="text-[12px] text-slate-600 m-0 flex gap-2">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">info</span>
                A cleared error does not by itself confirm the device is safe. Follow hospital protocol and report if it recurs.
              </p>
            )}
            {(outcome === 'unresolved' || steps.length === 0 || urgent) && (
              <>
                <SectionTitle icon="front_hand">If the Problem Continues</SectionTitle>
                <ul className="m-0 pl-5 space-y-1 text-[12.5px] text-slate-700 list-disc">
                  {(answer.if_problem_continues || []).map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </>
            )}
            <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
              <span className="text-[12px] text-slate-500 font-medium">{answer.escalation?.reason}</span>
              <button
                type="button"
                onClick={() => onEscalate?.(outcome === 'unresolved' ? 'NOT_RESOLVED' : null)}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white shadow-sm flex items-center gap-2 transition-colors ${urgent ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-container'}`}
              >
                <span className="material-symbols-outlined text-[18px]">engineering</span>
                Raise Technical Support Request
              </button>
            </div>
          </div>
        )}

        {/* Sources */}
        {answer.sources?.length > 0 && (
          <div>
            <button type="button" onClick={() => setShowSources((v) => !v)}
              className="text-[12px] font-semibold text-primary flex items-center gap-1.5 hover:text-primary/80">
              <span className="material-symbols-outlined text-[16px]">{showSources ? 'expand_less' : 'expand_more'}</span>
              Manual references ({answer.sources.length})
            </button>
            {showSources && (
              <div className="mt-3 space-y-2.5">
                {answer.sources.map((s) => (
                  <div key={s.ref_id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                    <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold text-slate-600">
                      <span className="font-mono-data text-primary">{s.ref_id}</span>
                      <span className="text-slate-800">{s.document_title}</span>
                      <span>v{s.version}</span>
                      <span className="text-slate-300">•</span>
                      <span>{s.manufacturer} {s.equipment_model}</span>
                      <span className="text-slate-300">•</span>
                      <span>Page {s.page_number}</span>
                      {s.section_heading && <><span className="text-slate-300">•</span><span>{s.section_heading}</span></>}
                      {s.error_code_match && <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">code match</span>}
                      <span className="ml-auto font-mono-data text-slate-400">score {Number(s.relevance_score).toFixed(2)}</span>
                    </div>
                    <pre className="mt-2 mb-0 whitespace-pre-wrap font-body-md text-[12px] leading-relaxed text-slate-700">{s.excerpt}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-[11px] text-slate-400 leading-relaxed m-0 border-t border-slate-100 pt-3">{answer.safety_disclaimer}</p>
      </div>
    </div>
  );
}
