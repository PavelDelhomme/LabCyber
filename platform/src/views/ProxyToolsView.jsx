import { useState } from 'preact/hooks';
import { escapeHtml } from '../lib/store';

const DEFAULT_METHOD = 'GET';
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export default function ProxyToolsView() {
  const [method, setMethod] = useState(DEFAULT_METHOD);
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const addHeader = () => setHeaders(h => [...h, { key: '', value: '' }]);
  const removeHeader = (i) => setHeaders(h => h.filter((_, idx) => idx !== i));
  const updateHeader = (i, field, val) => setHeaders(h => h.map((x, idx) => idx === i ? { ...x, [field]: val } : x));

  const sendRequest = async () => {
    const u = (url || '').trim();
    if (!u) { setError('Indique une URL'); return; }
    setError(null);
    setResponse(null);
    setLoading(true);
    const hdr = {};
    headers.forEach(({ key, value }) => { if ((key || '').trim()) hdr[key.trim()] = value.trim(); });
    try {
      const opts = { method, headers: hdr };
      if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        if (!hdr['Content-Type']) hdr['Content-Type'] = 'application/json';
        opts.body = body;
      }
      const res = await fetch(u, opts);
      const text = await res.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch (_) {}
      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: text,
        parsed,
      });
    } catch (e) {
      setError(e.message || 'Erreur réseau. Pour les cibles du lab sans CORS, utilise le terminal (curl).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="view-proxy-tools" class="view">
      <header class="page-header">
        <h2>Proxy / Requêtes HTTP</h2>
        <p class="room-description">Envoie des requêtes HTTP (méthode, en-têtes, corps). Type Burp Suite / Postman. Pour les cibles sans CORS, utilise le terminal attaquant (curl).</p>
      </header>

      <section class="room-section">
        <div class="proxy-tools-form">
          <div class="proxy-tools-row">
            <select value={method} onInput={e => setMethod(e.target.value)} class="proxy-tools-method">
              {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input
              type="url"
              class="proxy-tools-url"
              placeholder="https://api.lab:8080/api/health ou http://vuln-api:5000/api/users/1"
              value={url}
              onInput={e => setUrl(e.target.value)}
            />
            <button type="button" class="btn btn-primary" onClick={sendRequest} disabled={loading}>
              {loading ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
          <div class="proxy-tools-headers">
            <h4>En-têtes</h4>
            {headers.map((h, i) => (
              <div key={i} class="proxy-tools-header-row">
                <input placeholder="Nom" value={h.key} onInput={e => updateHeader(i, 'key', e.target.value)} />
                <input placeholder="Valeur" value={h.value} onInput={e => updateHeader(i, 'value', e.target.value)} />
                <button type="button" class="topbar-btn danger" onClick={() => removeHeader(i)}>×</button>
              </div>
            ))}
            <button type="button" class="btn btn-secondary" onClick={addHeader}>Ajouter un en-tête</button>
          </div>
          {['POST', 'PUT', 'PATCH'].includes(method) && (
            <div class="proxy-tools-body">
              <h4>Corps</h4>
              <textarea
                class="proxy-tools-textarea"
                rows={6}
                placeholder='{"login":"admin","password":"admin123"}'
                value={body}
                onInput={e => setBody(e.target.value)}
              />
            </div>
          )}
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
    </div>
  );
}
