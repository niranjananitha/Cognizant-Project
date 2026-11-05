// API client for the Equipment Assistance (RAG) chatbot, Knowledge Base and
// chatbot escalations. Reuses the JWT + base URL from AuthContext.

async function request(API_URL, token, path, { method = 'GET', body, form } = {}) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  let payload;
  if (form) {
    payload = form; // browser sets multipart boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: payload });
  } catch {
    throw new Error('Cannot reach the AURA server. Check that the backend is running.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    let detail = data?.detail;
    if (Array.isArray(detail)) {
      detail = detail.map((d) => `${(d.loc || []).slice(-1)[0] || 'field'}: ${d.msg}`).join('; ');
    }
    const err = new Error(detail || `Request failed (HTTP ${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const createAssistanceApi = (API_URL, token) => ({
  // Knowledge base
  catalog: () => request(API_URL, token, '/knowledge/catalog'),
  listDocuments: (includeInactive = false) =>
    request(API_URL, token, `/knowledge/documents${includeInactive ? '?include_inactive=true' : ''}`),
  getDocument: (id) => request(API_URL, token, `/knowledge/documents/${id}`),
  uploadDocument: (form) => request(API_URL, token, '/knowledge/upload', { method: 'POST', form }),
  replaceDocument: (id, form) => request(API_URL, token, `/knowledge/documents/${id}/replace`, { method: 'POST', form }),
  deleteDocument: (id) => request(API_URL, token, `/knowledge/documents/${id}`, { method: 'DELETE' }),

  // Chat
  chat: (body) => request(API_URL, token, '/rag/chat', { method: 'POST', body }),
  machines: () => request(API_URL, token, '/rag/machines'),
  history: ({ q, equipmentId, limit } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (equipmentId) params.set('equipment_id', equipmentId);
    if (limit) params.set('limit', limit);
    const qs = params.toString();
    return request(API_URL, token, `/rag/history${qs ? `?${qs}` : ''}`);
  },
  conversation: (id) => request(API_URL, token, `/rag/history/${id}`),
  deleteConversation: (id) => request(API_URL, token, `/rag/history/${id}`, { method: 'DELETE' }),

  // Equipment (existing endpoint)
  equipment: () => request(API_URL, token, '/equipment?page_size=100'),

  // Service requests (existing workqueue, extended with chatbot escalations)
  escalate: (body) => request(API_URL, token, '/service-requests', { method: 'POST', body }),
  myTickets: () => request(API_URL, token, '/service-requests?source=CHATBOT&raised_by_me=true&page_size=50'),
  escalationQueue: () => request(API_URL, token, '/service-requests?source=CHATBOT&page_size=50'),
  ticket: (id) => request(API_URL, token, `/service-requests/${id}`),
  ticketAction: (id, action) => request(API_URL, token, `/service-requests/${id}/${action}`, { method: 'POST' }),
});

export const DOCUMENT_TYPES = [
  { value: 'USER_MANUAL', label: 'User Manual' },
  { value: 'TROUBLESHOOTING_GUIDE', label: 'Troubleshooting Guide' },
  { value: 'MAINTENANCE_DOCUMENT', label: 'Maintenance Documentation' },
  { value: 'ERROR_CODE_REFERENCE', label: 'Error-Code Reference' },
];

export const docTypeLabel = (v) => DOCUMENT_TYPES.find((d) => d.value === v)?.label || v;

export const TICKET_FLOW = ['NEW', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'CLOSED'];

export const formatDate = (iso) => {
  if (!iso) return '—';
  // Backend stores naive UTC timestamps.
  const d = new Date(/Z|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
