import { useState, useEffect } from 'preact/hooks';
import { escapeHtml } from '../lib/store';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export default function ApiClientView({ storage, currentLabId: appLabId }) {
  const labId = appLabId || storage?.getCurrentLabId?.() || 'default';
  const [request, setRequest] = useState({ method: 'GET', url: '', headers: [{ key: '', value: '' }], body: '' });
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentCollectionId, setCurrentCollectionId] = useState(null);
  const [savedRequests, setSavedRequests] = useState([]);
  const [proxyId, setProxyId] = useState('');
  const [proxies, setProxies] = useState([]);

  useEffect(() => {
    const data = storage?.getRequestData?.(labId) || { collections: [], history: [] };
    setCollections(data.collections || []);
    setHistory(data.history || []);
  }, [labId, storage]);

  useEffect(() => {
    setProxies(storage?.getProxies?.(labId) || []);
  }, [labId, storage]);

  useEffect(() => {
    const col = collections.find((c) => c.id === currentCollectionId);
    setSavedRequests(col?.requests || []);
  }, [currentCollectionId, collections]);

  const persistRequestData = (cols, hist) => {
    const nextCols = cols != null ? cols : collections;
    const nextHist = hist != null ? hist : history;
    setCollections(nextCols);
    setHistory(nextHist);
    storage?.setRequestData?.(labId, { collections: nextCols, history: nextHist });
  };

  const addHeader = () => setRequest((r) => ({ ...r, headers: [...r.headers, { key: '', value: '' }] }));
  const removeHeader = (i) => setRequest((r) => ({ ...r, headers: r.headers.filter((_, idx) => idx !== i) }));
  const updateHeader = (i, field, val) =>
    setRequest((r) => ({ ...r, headers: r.headers.map((h, idx) => (idx === i ? { ...h, [field]: val } : h)) }));

  const sendRequest = async () => {
    const url = (request.url || '').trim();
    if (!url) {
      setError('Indique une URL');
      return;
    }
    setError(null);
    setResponse(null);
    setLoading(true);
    const headers = {};
    request.headers.forEach(({ key, value }) => {
      if ((key || '').trim()) headers[key.trim()] = value.trim();
    });
    try {
      const opts = { method: request.method, headers };
      if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
        opts.body = request.body;
      }
      if (proxyId && proxies.length) {
        const px = proxies.find((p) => p.id === proxyId);
        if (px) opts.mode = 'cors'; // browser may block; for same-origin or CORS-enabled targets
        // Note: fetch() in browser doesn't support custom proxy; user must use terminal or Postman for proxy. We document that.
      }
      const res = await fetch(url, opts);
      const text = await res.text();
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch (_) {}
      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: text,
        parsed,
      });
      persistRequestData(null, [{ method: request.method, url, ts: new Date().toISOString() }, ...history].slice(0, 50));
    } catch (e) {
      setError(e.message || 'Erreur réseau. Pour les cibles sans CORS, utilise le terminal (curl) ou un proxy.');
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (h) => {
    setRequest((r) => ({ ...r, method: h.method || 'GET', url: h.url || '' }));
  };

  const saveToCollection = () => {
    const name = prompt('Nom de la requête dans la collection ?', request.url || 'Requête');
    if (!name) return;
    const reqCopy = {
      method: request.method,
      url: request.url,
      headers: request.headers.map((h) => ({ ...h })),
      body: request.body,
    };
    if (currentCollectionId) {
      const next = collections.map((c) =>
        c.id === currentCollectionId ? { ...c, requests: [...(c.requests || []), { id: 'r' + Date.now(), name, ...reqCopy }] } : c
      );
      persistRequestData(next, null);
    } else {
      const colId = 'c' + Date.now();
      const next = [...collections, { id: colId, name: 'Nouvelle collection', requests: [{ id: 'r' + Date.now(), name, ...reqCopy }] }];
      persistRequestData(next, null);
      setCurrentCollectionId(colId);
    }
  };

  const loadSavedRequest = (req) => {
    const headers = Array.isArray(req.headers) && req.headers.length
      ? req.headers.map((h) => ({ key: h.key || '', value: h.value || '' }))
      : [{ key: '', value: '' }];
    setRequest({
      method: req.method || 'GET',
      url: req.url || '',
      headers,
      body: req.body || '',
    });
  };

  const createCollection = () => {
    const name = prompt('Nom de la collection ?', 'Ma collection');
    if (!name) return;
    const colId = 'c' + Date.now();
    persistRequestData([...collections, { id: colId, name, requests: [] }], null);
    setCurrentCollectionId(colId);
  };

  return (
    <div id="view-api-client" class="view">
      <header class="page-header">
        <h2>Requêtes API (Postman)</h2>
        <p class="room-description">
          Envoie des requêtes HTTP (méthode, URL, en-têtes, corps). Collections et historique sont enregistrés pour le lab actif. Pour les cibles sans CORS, utilise le terminal (curl) ou configure un proxy dans l’onglet Proxy.
        </p>
      </header>

      <div class="api-client-layout">
        <aside class="api-client-sidebar">
          <h4>Collections</h4>
          <button type="button" class="btn btn-secondary" onClick={createCollection} style={{ marginBottom: '0.5rem' }}>Nouvelle collection</button>
          <select
            class="api-client-select"
            value={currentCollectionId || ''}
            onInput={(e) => setCurrentCollectionId(e.target.value || null)}
          >
            <option value="">— Choisir —</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{escapeHtml(c.name)}</option>
            ))}
          </select>
          {savedRequests.length > 0 && (
            <ul class="api-client-req-list">
              {savedRequests.map((r) => (
                <li key={r.id}>
                  <button type="button" class="api-client-req-btn" onClick={() => loadSavedRequest(r)}>
                    <span class="api-client-req-method">{r.method}</span> {escapeHtml((r.name || r.url || '').slice(0, 30))}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <h4 style={{ marginTop: '1rem' }}>Historique</h4>
          <ul class="api-client-history">
            {history.slice(0, 20).map((h, i) => (
              <li key={i}>
                <button type="button" class="api-client-req-btn" onClick={() => loadFromHistory(h)}>
                  <span class="api-client-req-method">{h.method}</span> {escapeHtml((h.url || '').slice(0, 40))}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main class="api-client-main">
          <section class="room-section">
            <div class="proxy-tools-form">
              <div class="proxy-tools-row">
                <select value={request.method} onInput={(e) => setRequest((r) => ({ ...r, method: e.target.value }))} class="proxy-tools-method">
                  {METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="url"
                  class="proxy-tools-url"
                  placeholder="https://api.lab:4080/api/health ou http://vuln-api:5000/api/users/1"
                  value={request.url}
                  onInput={(e) => setRequest((r) => ({ ...r, url: e.target.value }))}
                />
                <button type="button" class="btn btn-primary" onClick={sendRequest} disabled={loading}>
                  {loading ? 'Envoi…' : 'Envoyer'}
                </button>
              </div>
              {proxies.length > 0 && (
                <div class="proxy-tools-row" style="marginTop:0.5rem">
                  <label>Proxy (rappel) :</label>
                  <select value={proxyId} onInput={(e) => setProxyId(e.target.value)}>
                    <option value="">Aucun</option>
                    {proxies.map((p) => (
                      <option key={p.id} value={p.id}>{p.name || p.host}:{p.port}</option>
                    ))}
                  </select>
                  <span class="text-muted" style="fontSize:0.85rem">Le navigateur ne peut pas utiliser un proxy pour fetch(). Utilise le terminal (export http_proxy) ou Postman.</span>
                </div>
              )}
              <div class="proxy-tools-headers">
                <h4>En-têtes</h4>
                {request.headers.map((h, i) => (
                  <div key={i} class="proxy-tools-header-row">
                    <input placeholder="Nom" value={h.key} onInput={(e) => updateHeader(i, 'key', e.target.value)} />
                    <input placeholder="Valeur" value={h.value} onInput={(e) => updateHeader(i, 'value', e.target.value)} />
                    <button type="button" class="topbar-btn danger" onClick={() => removeHeader(i)}>×</button>
                  </div>
                ))}
                <button type="button" class="btn btn-secondary" onClick={addHeader}>Ajouter un en-tête</button>
              </div>
              {['POST', 'PUT', 'PATCH'].includes(request.method) && (
                <div class="proxy-tools-body">
                  <h4>Corps</h4>
                  <textarea
                    class="proxy-tools-textarea"
                    rows={6}
                    placeholder='{"login":"admin","password":"admin123"}'
                    value={request.body}
                    onInput={(e) => setRequest((r) => ({ ...r, body: e.target.value }))}
                  />
                </div>
              )}
              <button type="button" class="btn btn-secondary" onClick={saveToCollection} style="marginTop:0.5rem">Enregistrer dans la collection</button>
            </div>
          </section>

          {error && <p class="proxy-tools-error">{escapeHtml(error)}</p>}

          {response && (
            <section class="room-section">
              <h3>Réponse</h3>
              <p class="proxy-tools-status">{response.status} {response.statusText}</p>
              <details>
                <summary>En-têtes</summary>
                <pre class="proxy-tools-pre">{Object.entries(response.headers).map(([k, v]) => k + ': ' + v).join('\n')}</pre>
              </details>
              <h4>Corps</h4>
              <pre class="proxy-tools-pre proxy-tools-body-pre">{response.parsed ? JSON.stringify(response.parsed, null, 2) : response.body}</pre>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
