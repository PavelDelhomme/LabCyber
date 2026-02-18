import { useState, useEffect } from 'preact/hooks';
import { escapeHtml, useStorageReady } from '../lib/store';

const PROXYSCRAPE_URL = 'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all';
const FREE_PROXY_CZ_URL = 'http://free-proxy.cz/fr/';

function parseProxyLine(line) {
  const s = line.trim().replace(/^https?:\/\//i, '');
  const m = s.match(/^([^\s:]+):(\d+)$/);
  return m ? `${m[1]}:${m[2]}` : null;
}

const defaultEngagement = () => ({
  targets: [],
  proxies: [],
  proxyNotes: '',
  notes: '',
  dataCollected: '',
  sessions: [],
  todos: [],
  history: [],
});

export default function EngagementsView({ storage, targets, onNavigate }) {
  const storageReady = useStorageReady();
  const [engagement, setEngagement] = useState(defaultEngagement());
  const [proxyUrl, setProxyUrl] = useState('');
  const [proxyNotes, setProxyNotes] = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [fetchMax, setFetchMax] = useState(30);
  const [bulkPaste, setBulkPaste] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [sessionTag, setSessionTag] = useState('');

  useEffect(() => {
    if (storageReady && storage) {
      const d = storage.getEngagement();
      setEngagement({
        ...defaultEngagement(),
        ...d,
        sessions: d.sessions || [],
        todos: d.todos || [],
        history: d.history || [],
      });
    }
  }, [storageReady, storage]);

  const save = (next) => {
    const d = typeof next === 'function' ? next(engagement) : next;
    const full = { ...defaultEngagement(), ...engagement, ...d, sessions: d.sessions !== undefined ? d.sessions : (engagement.sessions || []) };
    setEngagement(full);
    storage?.setEngagement(full);
  };

  const saveAsSession = () => {
    const name = (sessionName || '').trim() || `Session ${new Date().toLocaleString('fr-FR')}`;
    const tag = (sessionTag || '').trim();
    const sessions = [...(engagement.sessions || [])];
    sessions.push({
      id: Date.now().toString(),
      name,
      tag,
      targets: (engagement.targets || []).map(t => ({ ...t })),
      proxies: (engagement.proxies || []).map(p => ({ ...p })),
      proxyNotes: engagement.proxyNotes || '',
      notes: engagement.notes || '',
      dataCollected: engagement.dataCollected || '',
      todos: (engagement.todos || []).map(t => ({ ...t })),
      history: (engagement.history || []).map(h => ({ ...h })),
      createdAt: new Date().toISOString(),
    });
    save({ ...engagement, sessions });
    setSessionName('');
    setSessionTag('');
  };

  const loadSession = (s) => {
    const next = {
      ...engagement,
      targets: (s.targets || []).map(t => ({ ...t })),
      proxies: (s.proxies || []).map(p => ({ ...p })),
      proxyNotes: s.proxyNotes || '',
      notes: s.notes || '',
      dataCollected: s.dataCollected || '',
      todos: (s.todos || []).map(t => ({ ...t })),
      history: (s.history || []).map(h => ({ ...h })),
    };
    setEngagement(next);
    storage?.setEngagement({ ...next, sessions: engagement.sessions || [] });
  };

  const newSession = () => {
    const next = { ...defaultEngagement(), sessions: engagement.sessions || [] };
    setEngagement(next);
    storage?.setEngagement(next);
  };

  const addTodo = (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input[name="todoText"]');
    const text = (input?.value || '').trim();
    if (!text) return;
    const todos = [...(engagement.todos || []), { id: Date.now().toString(), text, status: 'pending', createdAt: new Date().toISOString() }];
    save({ ...engagement, todos });
    input.value = '';
  };

  const toggleTodo = (id) => {
    const todos = (engagement.todos || []).map(t => t.id === id ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t);
    save({ ...engagement, todos });
  };

  const removeTodo = (id) => {
    const todos = (engagement.todos || []).filter(t => t.id !== id);
    save({ ...engagement, todos });
  };

  const addHistoryEntry = (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input[name="historyText"], textarea[name="historyText"]');
    const text = (input?.value || '').trim();
    if (!text) return;
    const history = [...(engagement.history || []), { id: Date.now().toString(), text, createdAt: new Date().toISOString() }];
    save({ ...engagement, history });
    input.value = '';
  };

  const removeHistoryEntry = (id) => {
    const history = (engagement.history || []).filter(h => h.id !== id);
    save({ ...engagement, history });
  };

  const addTarget = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('[name="name"]')?.value?.trim();
    if (!name) return;
    save({ ...engagement, targets: [...(engagement.targets || []), { name, url: form.querySelector('[name="url"]')?.value?.trim() || '', notes: form.querySelector('[name="notes"]')?.value?.trim() || '' }] });
    form.reset();
  };

  const removeTarget = (i) => {
    const t = [...(engagement.targets || [])];
    t.splice(i, 1);
    save({ ...engagement, targets: t });
  };

  const addProxy = (e) => {
    e.preventDefault();
    if (!proxyUrl.trim()) return;
    save({ ...engagement, proxies: [...(engagement.proxies || []), { url: proxyUrl.trim(), notes: proxyNotes.trim() }] });
    setProxyUrl('');
    setProxyNotes('');
  };

  const removeProxy = (i) => {
    const p = [...(engagement.proxies || [])];
    p.splice(i, 1);
    save({ ...engagement, proxies: p });
  };

  const fetchProxiesFromApi = async () => {
    setFetchError('');
    setFetchLoading(true);
    try {
      const res = await fetch(PROXYSCRAPE_URL);
      if (!res.ok) throw new Error('Erreur réseau');
      const text = await res.text();
      const lines = text.split(/\r?\n/).map(parseProxyLine).filter(Boolean);
      const existing = new Set((engagement.proxies || []).map(p => p.url.replace(/^https?:\/\//i, '')));
      const max = Math.max(1, Math.min(200, parseInt(fetchMax, 10) || 30));
      const toAdd = [];
      for (const line of lines) {
        if (toAdd.length >= max) break;
        const norm = line.replace(/^https?:\/\//i, '');
        if (!existing.has(norm)) {
          existing.add(norm);
          toAdd.push({ url: line, notes: 'ProxyScrape' });
        }
      }
      if (toAdd.length) save({ ...engagement, proxies: [...(engagement.proxies || []), ...toAdd] });
      setFetchError(toAdd.length ? `${toAdd.length} proxy(s) ajouté(s).` : 'Aucun nouveau proxy (déjà en liste ou liste vide).');
    } catch (err) {
      setFetchError('Impossible de récupérer la liste (CORS ou réseau). Utilise « Depuis free-proxy.cz » ci-dessous.');
    } finally {
      setFetchLoading(false);
    }
  };

  const addBulkProxies = () => {
    const lines = bulkPaste.split(/\r?\n/).map(parseProxyLine).filter(Boolean);
    const existing = new Set((engagement.proxies || []).map(p => p.url.replace(/^https?:\/\//i, '')));
    const toAdd = [];
    for (const line of lines) {
      const norm = line.replace(/^https?:\/\//i, '');
      if (!existing.has(norm)) {
        existing.add(norm);
        toAdd.push({ url: line, notes: 'Import' });
      }
    }
    if (toAdd.length) save({ ...engagement, proxies: [...(engagement.proxies || []), ...toAdd] });
    setBulkPaste('');
    setFetchError(toAdd.length ? `${toAdd.length} proxy(s) ajouté(s) depuis la liste collée.` : 'Aucun proxy valide (format IP:port, un par ligne).');
  };

  const sessions = engagement.sessions || [];
  const labTargets = Array.isArray(targets) ? targets : [];

  return (
    <div id="view-engagements" class="view">
      <header class="page-header">
        <h2>Cibles &amp; Proxy</h2>
        <p class="section-desc">Gère tes cibles (machines, URLs), sessions d’engagement, notes et données récupérées. Tout est enregistré localement. Utilise les raccourcis ci-dessous pour les outils intégrés.</p>
        <div class="engagement-shortcuts">
          <button type="button" class="btn btn-primary" onClick={() => onNavigate?.('proxy-tools')}>📤 Proxy / Requêtes HTTP</button>
          <button type="button" class="btn topbar-btn" onClick={() => onNavigate?.('capture')}>📡 Capture pcap (Wireshark)</button>
          <button type="button" class="btn topbar-btn" onClick={() => onNavigate?.('progression')}>📊 Ma progression</button>
        </div>
      </header>
      {labTargets.length > 0 && (
        <section class="dashboard-section">
          <h3 class="section-title">Cibles du lab (machines disponibles)</h3>
          <p class="section-desc">URLs des cibles pour tes tests. Utilise Proxy/Requêtes pour envoyer des requêtes (configurer /etc/hosts si besoin).</p>
          <ul class="engagement-list engagement-targets-lab">
            {labTargets.map(t => (
              <li key={t.id} class="engagement-target-item">
                <span class="engagement-target-name">{escapeHtml(t.name || t.id)}</span>
                {t.url && <a href={t.url} target="_blank" rel="noopener nofollow" class="engagement-target-url">{escapeHtml(t.url)}</a>}
                {t.credentials && <span class="engagement-target-notes">Identifiants : {escapeHtml(t.credentials)}</span>}
                {t.description && <span class="section-desc" style="display:block; margin-top:0.25rem">{escapeHtml(t.description)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section class="dashboard-section">
        <h3 class="section-title">Sessions</h3>
        <p class="section-desc">Enregistre l’état actuel (cibles, proxies, notes) sous un nom et un tag pour le retrouver plus tard.</p>
        <div class="engagement-form" style="flex-wrap: wrap; gap: 0.5rem;">
          <input type="text" value={sessionName} onInput={e => setSessionName(e.target.value)} placeholder="Nom de la session" />
          <input type="text" value={sessionTag} onInput={e => setSessionTag(e.target.value)} placeholder="Tag (ex: client, audit)" />
          <button type="button" class="topbar-btn" onClick={saveAsSession}>Enregistrer cette session</button>
          <button type="button" class="topbar-btn" onClick={newSession}>Nouvelle session (effacer l’affichage)</button>
        </div>
        {sessions.length > 0 && (
          <ul class="engagement-list" style="margin-top: 0.75rem;">
            {sessions.map(s => (
              <li key={s.id} class="engagement-target-item">
                <span class="engagement-target-name">{escapeHtml(s.name)}</span>
                {s.tag && <span class="engagement-target-notes">#{escapeHtml(s.tag)}</span>}
                <span class="text-muted" style="font-size: 0.9em;">{s.createdAt ? new Date(s.createdAt).toLocaleDateString('fr-FR') : ''}</span>
                <button type="button" class="topbar-btn" onClick={() => loadSession(s)}>Charger</button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section class="dashboard-section">
        <h3 class="section-title">Proxies (liste)</h3>
        <p class="section-desc">Ajout à la main ou récupération dynamique (ProxyScrape) / import depuis free-proxy.cz.</p>
        <form class="engagement-form" onSubmit={addProxy}>
          <input type="text" value={proxyUrl} onInput={e => setProxyUrl(e.target.value)} placeholder="host:port ou http://host:port" required />
          <input type="text" value={proxyNotes} onInput={e => setProxyNotes(e.target.value)} placeholder="Notes (optionnel)" />
          <button type="submit" class="topbar-btn">Ajouter le proxy</button>
        </form>
        <div class="engagement-block" style="margin-top:1rem">
          <h4 class="section-title">Récupérer des proxies disponibles (ProxyScrape)</h4>
          <p class="section-desc">Charge une liste à jour depuis l’API ProxyScrape (HTTP).</p>
          <div class="engagement-form">
            <label>Nombre max à ajouter</label>
            <input type="number" min={1} max={200} value={fetchMax} onInput={e => setFetchMax(e.target.value)} style="width:80px" />
            <button type="button" class="topbar-btn" onClick={fetchProxiesFromApi} disabled={fetchLoading}>
              {fetchLoading ? 'Chargement…' : 'Récupérer des proxies'}
            </button>
          </div>
          {fetchError && <p class="section-desc" style={{ color: 'var(--accent)', marginTop: '0.5rem' }}>{fetchError}</p>}
        </div>
        <div class="engagement-block" style="margin-top:1rem">
          <h4 class="section-title">Ou depuis free-proxy.cz</h4>
          <p class="section-desc">
            Ouvre <a href={FREE_PROXY_CZ_URL} target="_blank" rel="noopener nofollow">free-proxy.cz/fr/</a>, copie les proxies (IP:port), colle ci‑dessous (un par ligne), puis clique sur « Ajouter ces proxies ».
          </p>
          <textarea
            class="engagement-notes"
            rows={5}
            value={bulkPaste}
            onInput={e => setBulkPaste(e.target.value)}
            placeholder="Colle ici les proxies (un par ligne)&#10;Ex: 192.168.1.1:8080&#10;10.0.0.2:3128"
          />
          <button type="button" class="topbar-btn" onClick={addBulkProxies} style="margin-top:0.5rem">Ajouter ces proxies à la liste</button>
        </div>
        <ul class="engagement-list">
          {(engagement.proxies || []).map((p, i) => (
            <li key={i} class="engagement-target-item">
              <span class="engagement-target-url">{escapeHtml(p.url)}</span>
              {p.notes && <span class="engagement-target-notes">{escapeHtml(p.notes)}</span>}
              <button type="button" class="topbar-btn danger" onClick={() => removeProxy(i)}>Supprimer</button>
            </li>
          ))}
        </ul>
      </section>
      <section class="dashboard-section">
        <h3 class="section-title">Proxy / Anonymat (notes)</h3>
        <textarea
          class="engagement-notes"
          rows={2}
          value={engagement.proxyNotes || ''}
          onInput={e => save({ ...engagement, proxyNotes: e.target.value })}
          placeholder="Ex: export HTTP_PROXY=..."
        />
      </section>
      <section class="dashboard-section">
        <h3 class="section-title">Cibles</h3>
        <form class="engagement-form" onSubmit={addTarget}>
          <input name="name" placeholder="Nom" required />
          <input name="url" placeholder="URL ou IP" />
          <input name="notes" placeholder="Notes" />
          <button type="submit" class="topbar-btn">Ajouter la cible</button>
        </form>
        <ul class="engagement-list">
          {(engagement.targets || []).map((t, i) => (
            <li key={i} class="engagement-target-item">
              <span class="engagement-target-name">{escapeHtml(t.name)}</span>
              {t.url && <span class="engagement-target-url">{escapeHtml(t.url)}</span>}
              {t.notes && <span class="engagement-target-notes">{escapeHtml(t.notes)}</span>}
              <button type="button" class="topbar-btn danger" onClick={() => removeTarget(i)}>Supprimer</button>
            </li>
          ))}
        </ul>
      </section>
      <section class="dashboard-section">
        <h3 class="section-title">TODOs (environnement / cible)</h3>
        <p class="section-desc">Tâches à faire pour cet environnement. Enregistrez la session pour les conserver.</p>
        <form class="engagement-form" onSubmit={addTodo}>
          <input name="todoText" placeholder="Nouvelle tâche (ex: Scan nmap, Test SQLi…)" required />
          <button type="submit" class="topbar-btn">Ajouter</button>
        </form>
        <ul class="engagement-list engagement-todos">
          {(engagement.todos || []).map(t => (
            <li key={t.id} class="engagement-target-item engagement-todo-item">
              <label class="engagement-todo-label">
                <input type="checkbox" checked={t.status === 'done'} onChange={() => toggleTodo(t.id)} />
                <span class={t.status === 'done' ? 'engagement-todo-done' : ''}>{escapeHtml(t.text)}</span>
              </label>
              <button type="button" class="topbar-btn danger" onClick={() => removeTodo(t.id)} aria-label="Supprimer">×</button>
            </li>
          ))}
        </ul>
      </section>
      <section class="dashboard-section">
        <h3 class="section-title">Historique / Résultats (notes par entrée)</h3>
        <p class="section-desc">Ajoutez des lignes de résultats ou d’actions (scans, vulns, etc.). Sauvegardées avec la session.</p>
        <form class="engagement-form" onSubmit={addHistoryEntry}>
          <input name="historyText" placeholder="Ex: nmap -sV 192.168.1.1 → port 80 open" />
          <button type="submit" class="topbar-btn">Ajouter une entrée</button>
        </form>
        <ul class="engagement-list engagement-history">
          {(engagement.history || []).slice().reverse().map(h => (
            <li key={h.id} class="engagement-history-item">
              <span class="engagement-history-date">{h.createdAt ? new Date(h.createdAt).toLocaleString('fr-FR') : ''}</span>
              <span class="engagement-history-text">{escapeHtml(h.text)}</span>
              <button type="button" class="topbar-btn danger" onClick={() => removeHistoryEntry(h.id)} aria-label="Supprimer">×</button>
            </li>
          ))}
        </ul>
      </section>
      <section class="dashboard-section">
        <h3 class="section-title">Notes (bloc libre)</h3>
        <textarea
          class="engagement-notes"
          rows={6}
          value={engagement.notes || ''}
          onInput={e => save({ ...engagement, notes: e.target.value })}
          placeholder="Notes générales, observations..."
        />
      </section>
      <section class="dashboard-section">
        <h3 class="section-title">Données récupérées</h3>
        <p class="section-desc">Colle ici les données extraites (flags, hashes, extraits de base, etc.) pour les garder avec la session.</p>
        <textarea
          class="engagement-notes"
          rows={8}
          value={engagement.dataCollected || ''}
          onInput={e => save({ ...engagement, dataCollected: e.target.value })}
          placeholder="Ex: flag{...}, hash récupéré, extrait SQL..."
        />
      </section>
    </div>
  );
}
