import { useState, useEffect } from 'preact/hooks';
import { escapeHtml } from '../lib/store';

const PROXY_TYPES = [
  { value: 'http', label: 'HTTP' },
  { value: 'https', label: 'HTTPS' },
  { value: 'socks4', label: 'SOCKS4' },
  { value: 'socks5', label: 'SOCKS5' },
];

export default function ProxyConfigView({ storage, currentLabId: appLabId }) {
  const labId = appLabId || storage?.getCurrentLabId?.() || 'default';
  const [proxies, setProxies] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'http', host: '', port: '4080', username: '', password: '' });
  const [copyStatus, setCopyStatus] = useState('');

  useEffect(() => {
    setProxies(storage?.getProxies?.(labId) || []);
  }, [labId, storage]);

  const persistProxies = (next) => {
    setProxies(next);
    storage?.setProxies?.(labId, next);
  };

  const saveProxy = (e) => {
    e.preventDefault();
    const { name, type, host, port, username, password } = form;
    if (!host.trim()) return;
    const entry = {
      id: editingId || 'px' + Date.now(),
      name: (name || '').trim() || `${type} - ${host}:${port}`,
      type: type || 'http',
      host: host.trim(),
      port: String(port || '4080').trim(),
      username: (username || '').trim() || undefined,
      password: (password || '').trim() ? (password || '').trim() : undefined,
    };
    if (editingId) {
      persistProxies(proxies.map((x) => (x.id === editingId ? entry : x)));
    } else {
      persistProxies([...proxies, entry]);
    }
    setEditingId(null);
    setForm({ name: '', type: 'http', host: '', port: '4080', username: '', password: '' });
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name || '',
      type: p.type || 'http',
      host: p.host || '',
      port: p.port || '4080',
      username: p.username || '',
      password: p.password || '',
    });
  };

  const removeProxy = (id) => {
    persistProxies(proxies.filter((x) => x.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm({ name: '', type: 'http', host: '', port: '4080', username: '', password: '' });
    }
  };

  const exportForTerminal = (p) => {
    const url = `${p.type}://${p.username && p.password ? `${encodeURIComponent(p.username)}:${encodeURIComponent(p.password)}@` : ''}${p.host}:${p.port}`;
    const env = `export http_proxy="${url}"\nexport https_proxy="${url}"`;
    navigator.clipboard.writeText(env).then(() => {
      setCopyStatus('Copié (http_proxy, https_proxy)');
      setTimeout(() => setCopyStatus(''), 2000);
    });
  };

  return (
    <div id="view-proxy-config" class="view">
      <header class="page-header">
        <h2>Proxy (config)</h2>
        <p class="room-description">
          Configure un ou plusieurs proxies (ou VPN via proxy) pour le lab actif. Utilise ces réglages dans le terminal (export http_proxy=…), dans Burp ou dans l’outil Requêtes API. Pas d’envoi de requêtes ici : uniquement la configuration.
        </p>
      </header>

      <section class="room-section">
        <h3>Proxies du lab</h3>
        <p class="section-desc text-muted">Ajoute des proxies HTTP/HTTPS/SOCKS. Chaque lab a sa propre liste. Tu peux exporter les variables d’environnement pour le terminal.</p>

        <form class="proxy-config-form" onSubmit={saveProxy} style="margin-bottom:1rem">
          <div class="proxy-config-grid">
            <input type="text" placeholder="Nom (ex. Burp local)" value={form.name} onInput={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <select value={form.type} onInput={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {PROXY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input type="text" placeholder="Host (ex. 127.0.0.1)" value={form.host} onInput={(e) => setForm((f) => ({ ...f, host: e.target.value }))} required />
            <input type="text" placeholder="Port (4080)" value={form.port} onInput={(e) => setForm((f) => ({ ...f, port: e.target.value }))} />
            <input type="text" placeholder="Username (optionnel)" value={form.username} onInput={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
            <input type="password" placeholder="Password (optionnel)" value={form.password} onInput={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
          <button type="submit" class="btn btn-primary">{editingId ? 'Enregistrer' : 'Ajouter'}</button>
          {editingId && (
            <button type="button" class="btn btn-secondary" onClick={() => { setEditingId(null); setForm({ name: '', type: 'http', host: '', port: '4080', username: '', password: '' }); }}>Annuler</button>
          )}
        </form>

        {copyStatus && <p class="text-muted">{copyStatus}</p>}

        <ul class="proxy-config-list">
          {proxies.map((p) => (
            <li key={p.id} class="proxy-config-item">
              <span class="proxy-config-item-label">{escapeHtml(p.name || `${p.type} ${p.host}:${p.port}`)}</span>
              <span class="proxy-config-item-detail">{p.type} — {p.host}:{p.port}</span>
              <div class="proxy-config-item-actions">
                <button type="button" class="btn btn-secondary" onClick={() => exportForTerminal(p)} title="Copier export http_proxy pour le terminal">Exporter (terminal)</button>
                <button type="button" class="topbar-btn" onClick={() => startEdit(p)}>Éditer</button>
                <button type="button" class="topbar-btn danger" onClick={() => removeProxy(p.id)}>Supprimer</button>
              </div>
            </li>
          ))}
        </ul>
        {proxies.length === 0 && <p class="text-muted">Aucun proxy. Ajoute-en un avec le formulaire ci-dessus.</p>}
      </section>
    </div>
  );
}
