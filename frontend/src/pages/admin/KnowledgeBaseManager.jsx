import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createAssistanceApi, DOCUMENT_TYPES, docTypeLabel, formatDate } from '../../services/assistanceApi';

const labelCls = 'text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5';
const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

const STATUS_CLS = {
  READY: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-100',
  FAILED: 'bg-red-50 text-red-700 border-red-100',
  SUPERSEDED: 'bg-slate-50 text-slate-500 border-slate-200',
};

const EMPTY_FORM = { equipment_category: '', manufacturer: '', equipment_model: '', title: '', document_type: 'USER_MANUAL', version: '1.0' };

const bytes = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function KnowledgeBaseManager() {
  const { token, API_URL } = useAuth();
  const api = useMemo(() => createAssistanceApi(API_URL, token), [API_URL, token]);

  const [docs, setDocs] = useState([]);
  const [machines, setMachines] = useState([]); // hospital inventory
  const [machineId, setMachineId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showInactive, setShowInactive] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null); // {type, text}

  const [detail, setDetail] = useState(null);
  const [replaceDoc, setReplaceDoc] = useState(null);
  const [replaceFile, setReplaceFile] = useState(null);
  const [replaceVersion, setReplaceVersion] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Loading flag is raised by callers (initial state / filter toggle), not inside the effect.
  const load = useCallback(() => {
    api.listDocuments(showInactive)
      .then((d) => { setDocs(d.items); setLoadError(null); })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, [api, showInactive]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.machines().then(setMachines).catch(() => setMachines([])); }, [api]);

  const flash = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 7000); };

  const categories = useMemo(() => [...new Set(machines.map((m) => m.category).filter(Boolean))].sort(), [machines]);
  const categoryMachines = machines.filter((m) => m.category === form.equipment_category);

  const chooseCategory = (value) => {
    setMachineId('');
    setForm((f) => ({ ...f, equipment_category: value, manufacturer: '', equipment_model: '' }));
  };

  // Manufacturer + model come from the inventory record, so the manual matches the machine nurses select.
  const chooseMachine = (id) => {
    const m = machines.find((x) => String(x.id) === String(id));
    setMachineId(id);
    setForm((f) => ({
      ...f,
      manufacturer: m ? (m.manufacturer || 'Unknown manufacturer') : '',
      equipment_model: m ? m.machine_name : '',
      title: m && !f.title ? `${m.machine_name} ${docTypeLabel(f.document_type)}` : f.title,
    }));
  };
  const stats = useMemo(() => {
    const active = docs.filter((d) => d.is_active || d.status === 'FAILED');
    return {
      total: docs.filter((d) => d.is_active).length,
      ready: docs.filter((d) => d.status === 'READY').length,
      failed: docs.filter((d) => d.status === 'FAILED').length,
      models: new Set(docs.filter((d) => d.status === 'READY').map((d) => `${d.manufacturer}|${d.equipment_model}`)).size,
      chunks: active.reduce((s, d) => s + d.chunk_count, 0),
    };
  }, [docs]);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return flash('error', 'Choose a PDF or TXT file to upload.');
    if (!machineId) return flash('error', 'Select the equipment category and machine this manual belongs to.');
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(form).forEach(([k, v]) => fd.append(k, v.trim ? v.trim() : v));
    setUploading(true);
    try {
      const doc = await api.uploadDocument(fd);
      if (doc.status === 'READY') {
        flash('success', `“${doc.title}” processed: ${doc.page_count} pages, ${doc.chunk_count} searchable sections.`);
        // Keep the machine selected so several documents can be uploaded for it in a row.
        setForm((f) => ({ ...EMPTY_FORM, equipment_category: f.equipment_category, manufacturer: f.manufacturer, equipment_model: f.equipment_model }));
        setFile(null);
        const fileInput = e.target.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } else {
        flash('error', `“${doc.title}” could not be processed: ${doc.processing_error}`);
      }
      load();
    } catch (err) {
      flash('error', err.message);
    } finally {
      setUploading(false);
    }
  };

  const openDetail = async (id) => {
    setBusyId(id);
    try { setDetail(await api.getDocument(id)); } catch (e) { flash('error', e.message); } finally { setBusyId(null); }
  };

  const doReplace = async (e) => {
    e.preventDefault();
    if (!replaceFile || !replaceVersion.trim()) return;
    const fd = new FormData();
    fd.append('file', replaceFile);
    fd.append('version', replaceVersion.trim());
    setBusyId(replaceDoc.id);
    try {
      const doc = await api.replaceDocument(replaceDoc.id, fd);
      flash(doc.status === 'READY' ? 'success' : 'error', doc.status === 'READY'
        ? `Version ${doc.version} is now active; version ${replaceDoc.version} was retired from search.`
        : `New version failed processing (${doc.processing_error}); version ${replaceDoc.version} remains active.`);
      setReplaceDoc(null);
      load();
    } catch (err) {
      flash('error', err.message);
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async (doc) => {
    setBusyId(doc.id);
    try {
      const r = await api.deleteDocument(doc.id);
      flash('success', `Deleted “${doc.title}” and ${r.chunks_removed} indexed sections.`);
      setConfirmDelete(null);
      load();
    } catch (err) {
      flash('error', err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-8 flex flex-col gap-6 max-w-[1600px] mx-auto text-slate-800">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-primary uppercase tracking-widest">
          <span className="material-symbols-outlined text-[16px]">library_books</span>
          Equipment Assistance · Knowledge Base
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 m-0 tracking-tight">Knowledge Base Manager</h1>
        <p className="text-[14px] text-slate-500 m-0 mt-1 font-medium">
          Upload manufacturer user manuals, troubleshooting guides and error-code references. Clinical staff receive answers only from these documents.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Manuals', value: stats.total, icon: 'menu_book' },
          { label: 'Ready for Search', value: stats.ready, icon: 'task_alt', cls: 'text-emerald-700' },
          { label: 'Equipment Models Covered', value: stats.models, icon: 'devices' },
          { label: 'Processing Failures', value: stats.failed, icon: 'error', cls: stats.failed ? 'text-red-600' : '' },
        ].map((k) => (
          <div key={k.label} className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{k.label}</div>
              <div className={`text-3xl font-semibold mt-1 ${k.cls || 'text-slate-900'}`}>{k.value}</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-[24px]">{k.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-[13px] font-medium flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-700'}`}>
          <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Upload */}
        <form onSubmit={upload} className="xl:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-2 m-0 border-b border-slate-100 pb-4">
            <span className="material-symbols-outlined text-slate-500 text-[18px]">upload_file</span>
            Upload Document
          </h2>
          <label className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${file ? 'border-primary/40 bg-primary-fixed/20' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'}`}>
            <span className="material-symbols-outlined text-[30px] text-slate-400">{file ? 'description' : 'cloud_upload'}</span>
            <span className="text-[13px] font-semibold text-slate-700 text-center break-all">{file ? file.name : 'Choose PDF or TXT manual'}</span>
            <span className="text-[11px] text-slate-400">{file ? bytes(file.size) : 'Text-based PDFs only · max 20 MB'}</span>
            <input type="file" accept=".pdf,.txt" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>

          <div>
            <label className={labelCls}>Equipment category *</label>
            <select className={inputCls} required value={form.equipment_category} onChange={(e) => chooseCategory(e.target.value)}>
              <option value="">{categories.length ? 'Select category…' : 'No machines in inventory'}</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c} ({machines.filter((m) => m.category === c).length})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Machine *</label>
            <select className={inputCls} required value={machineId} disabled={!form.equipment_category}
              onChange={(e) => chooseMachine(e.target.value)}>
              <option value="">{form.equipment_category ? 'Select machine…' : 'Select a category first'}</option>
              {categoryMachines.map((m) => (
                <option key={m.id} value={m.id}>{m.machine_name} · {m.machine_id}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Manufacturer</label>
              <input className={`${inputCls} bg-slate-50 text-slate-600`} readOnly tabIndex={-1}
                placeholder="From inventory" value={form.manufacturer} />
            </div>
            <div>
              <label className={labelCls}>Model</label>
              <input className={`${inputCls} bg-slate-50 text-slate-600`} readOnly tabIndex={-1}
                placeholder="From inventory" value={form.equipment_model} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Document title *</label>
            <input className={inputCls} required maxLength={255} placeholder="e.g. V60 Ventilator User Manual"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Document type *</label>
              <select className={inputCls} value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })}>
                {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Version *</label>
              <input className={inputCls} required maxLength={30} value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={uploading}
            className="w-full py-3 rounded-xl bg-primary text-white text-[13px] font-semibold hover:bg-primary-container disabled:opacity-60 flex items-center justify-center gap-2">
            {uploading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Extracting & indexing…</> : <><span className="material-symbols-outlined text-[18px]">upload</span>Upload & Process</>}
          </button>
        </form>

        {/* Documents */}
        <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-2 m-0">
              <span className="material-symbols-outlined text-slate-500 text-[18px]">folder_open</span>
              Uploaded Documents
            </h2>
            <label className="flex items-center gap-2 text-[12px] font-medium text-slate-600 cursor-pointer">
              <input type="checkbox" className="accent-[#003555]" checked={showInactive} onChange={(e) => { setLoading(true); setShowInactive(e.target.checked); }} />
              Show superseded & failed
            </label>
          </div>
          {loadError && <div className="m-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[13px]">{loadError}</div>}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 text-[11px] text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-4 pl-6">Document</th>
                  <th className="p-4">Equipment</th>
                  <th className="p-4">Type / Version</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Uploaded</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[13px] font-medium text-slate-700">
                {loading ? (
                  <tr><td colSpan="6" className="p-12 text-center"><span className="inline-block w-7 h-7 border-2 border-slate-200 border-t-primary rounded-full animate-spin" /></td></tr>
                ) : docs.length === 0 ? (
                  <tr><td colSpan="6" className="p-12 text-center text-slate-500">No documents uploaded yet. Upload the first manufacturer manual to enable Equipment Assistance.</td></tr>
                ) : docs.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60">
                    <td className="p-4 pl-6">
                      <div className="font-semibold text-slate-900">{d.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">#{d.id} · {d.original_filename} · {bytes(d.file_size_bytes)}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800">{d.manufacturer} {d.equipment_model}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{d.equipment_category}</div>
                    </td>
                    <td className="p-4">
                      <div>{docTypeLabel(d.document_type)}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono-data">v{d.version}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${STATUS_CLS[d.status]}`}>{d.status}</span>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {d.status === 'FAILED' ? <span className="text-red-600" title={d.processing_error}>{d.processing_error?.slice(0, 48)}</span> : `${d.page_count} pages · ${d.chunk_count} sections`}
                      </div>
                    </td>
                    <td className="p-4 text-[12px]">
                      <div>{formatDate(d.uploaded_at)}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{d.uploaded_by_name || '—'}</div>
                    </td>
                    <td className="p-4 pr-6">
                      {confirmDelete === d.id ? (
                        <div className="flex justify-end items-center gap-2">
                          <span className="text-[11px] text-red-700 font-semibold">Delete?</span>
                          <button type="button" disabled={busyId === d.id} onClick={() => doDelete(d)} className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-semibold">Confirm</button>
                          <button type="button" onClick={() => setConfirmDelete(null)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          {[
                            { icon: 'visibility', title: 'View indexed sections', onClick: () => openDetail(d.id), show: true },
                            { icon: 'published_with_changes', title: 'Replace with new version', onClick: () => { setReplaceDoc(d); setReplaceFile(null); setReplaceVersion(''); }, show: d.status === 'READY' && d.is_active },
                            { icon: 'delete', title: 'Delete document', onClick: () => setConfirmDelete(d.id), show: true, danger: true },
                          ].filter((a) => a.show).map((a) => (
                            <button key={a.icon} type="button" title={a.title} onClick={a.onClick} disabled={busyId === d.id}
                              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${a.danger ? 'border-red-100 text-red-500 hover:bg-red-50' : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                              <span className="material-symbols-outlined text-[17px]">{a.icon}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Replace modal */}
      {replaceDoc && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={doReplace} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900 m-0">Replace with updated version</h2>
              <p className="text-[12px] text-slate-500 m-0 mt-1">{replaceDoc.title} · {replaceDoc.manufacturer} {replaceDoc.equipment_model} · current v{replaceDoc.version}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>New file (PDF/TXT) *</label>
                <input type="file" accept=".pdf,.txt" required onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                  className="block w-full text-[13px] text-slate-600 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-semibold" />
              </div>
              <div>
                <label className={labelCls}>New version *</label>
                <input className={inputCls} required maxLength={30} value={replaceVersion} onChange={(e) => setReplaceVersion(e.target.value)} placeholder="e.g. 3.0" />
              </div>
              <p className="text-[11.5px] text-slate-500 m-0">The current version stays searchable until the new file is processed successfully, then it is retired.</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setReplaceDoc(null)} className="px-4 py-2.5 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={busyId === replaceDoc.id} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-primary hover:bg-primary-container disabled:opacity-60">Replace Document</button>
            </div>
          </form>
        </div>
      )}

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex justify-end" onClick={() => setDetail(null)}>
          <div className="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 m-0">{detail.title}</h2>
                <p className="text-[12px] text-slate-500 m-0 mt-1">
                  {detail.manufacturer} {detail.equipment_model} · v{detail.version} · {detail.page_count} pages · {detail.chunks.length} indexed sections
                </p>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-3">
              {detail.processing_error && <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-[13px]">{detail.processing_error}</div>}
              {detail.chunks.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold text-slate-500">
                    <span className="font-mono-data text-primary">#{c.chunk_index}</span>
                    <span>Page {c.page_number}</span>
                    {c.section_heading && <><span className="text-slate-300">•</span><span className="text-slate-700">{c.section_heading}</span></>}
                    {c.error_codes.map((code) => <span key={code} className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono-data text-slate-700">{code}</span>)}
                  </div>
                  <pre className="mt-2 mb-0 whitespace-pre-wrap font-body-md text-[12px] leading-relaxed text-slate-700">{c.content}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
