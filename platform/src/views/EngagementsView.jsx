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
  osintCases: [],
  osintPeople: [],
  osintCompanies: [],
  osintSources: [],
  osintFindings: [],
  osintTimeline: [],
  osintTasks: [],
  osintNotes: '',
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
        osintCases: d.osintCases || [],
        osintPeople: d.osintPeople || [],
        osintCompanies: d.osintCompanies || [],
        osintSources: d.osintSources || [],
        osintFindings: d.osintFindings || [],
        osintTimeline: d.osintTimeline || [],
        osintTasks: d.osintTasks || [],
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

  const addOsintCase = (e) => {
    e.preventDefault();
    const form = e.target;
    const title = form.querySelector('[name="caseTitle"]')?.value?.trim();
    if (!title) return;
    const item = {
      id: Date.now().toString(),
      title,
      objective: form.querySelector('[name="caseObjective"]')?.value?.trim() || '',
      scope: form.querySelector('[name="caseScope"]')?.value?.trim() || '',
      status: form.querySelector('[name="caseStatus"]')?.value || 'open',
      createdAt: new Date().toISOString(),
    };
    save({ ...engagement, osintCases: [...(engagement.osintCases || []), item] });
    form.reset();
  };

  const removeOsintCase = (id) => {
    save({ ...engagement, osintCases: (engagement.osintCases || []).filter((c) => c.id !== id) });
  };

  const addOsintCompany = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('[name="companyName"]')?.value?.trim();
    if (!name) return;
    const item = {
      id: Date.now().toString(),
      name,
      website: form.querySelector('[name="companyWebsite"]')?.value?.trim() || '',
      linkedin: form.querySelector('[name="companyLinkedin"]')?.value?.trim() || '',
      notes: form.querySelector('[name="companyNotes"]')?.value?.trim() || '',
    };
    save({ ...engagement, osintCompanies: [...(engagement.osintCompanies || []), item] });
    form.reset();
  };

  const removeOsintCompany = (id) => {
    save({ ...engagement, osintCompanies: (engagement.osintCompanies || []).filter((c) => c.id !== id) });
  };

  const addOsintPerson = (e) => {
    e.preventDefault();
    const form = e.target;
    const fullName = form.querySelector('[name="personName"]')?.value?.trim();
    if (!fullName) return;
    const item = {
      id: Date.now().toString(),
      fullName,
      role: form.querySelector('[name="personRole"]')?.value?.trim() || '',
      company: form.querySelector('[name="personCompany"]')?.value?.trim() || '',
      profileUrl: form.querySelector('[name="personProfile"]')?.value?.trim() || '',
      confidence: form.querySelector('[name="personConfidence"]')?.value || 'medium',
      notes: form.querySelector('[name="personNotes"]')?.value?.trim() || '',
      createdAt: new Date().toISOString(),
    };
    save({ ...engagement, osintPeople: [...(engagement.osintPeople || []), item] });
    form.reset();
  };

  const removeOsintPerson = (id) => {
    save({ ...engagement, osintPeople: (engagement.osintPeople || []).filter((p) => p.id !== id) });
  };

  const addOsintSource = (e) => {
    e.preventDefault();
    const form = e.target;
    const url = form.querySelector('[name="sourceUrl"]')?.value?.trim();
    if (!url) return;
    const item = {
      id: Date.now().toString(),
      type: form.querySelector('[name="sourceType"]')?.value || 'web',
      url,
      credibility: form.querySelector('[name="sourceCredibility"]')?.value || 'medium',
      notes: form.querySelector('[name="sourceNotes"]')?.value?.trim() || '',
      createdAt: new Date().toISOString(),
    };
    save({ ...engagement, osintSources: [...(engagement.osintSources || []), item] });
    form.reset();
  };

  const removeOsintSource = (id) => {
    save({ ...engagement, osintSources: (engagement.osintSources || []).filter((s) => s.id !== id) });
  };

  const addOsintFinding = (e) => {
    e.preventDefault();
    const form = e.target;
    const title = form.querySelector('[name="findingTitle"]')?.value?.trim();
    if (!title) return;
    const item = {
      id: Date.now().toString(),
      title,
      severity: form.querySelector('[name="findingSeverity"]')?.value || 'medium',
      relatedPerson: form.querySelector('[name="findingPerson"]')?.value?.trim() || '',
      evidenceUrl: form.querySelector('[name="findingEvidence"]')?.value?.trim() || '',
      status: form.querySelector('[name="findingStatus"]')?.value || 'open',
      notes: form.querySelector('[name="findingNotes"]')?.value?.trim() || '',
      createdAt: new Date().toISOString(),
    };
    save({ ...engagement, osintFindings: [...(engagement.osintFindings || []), item] });
    form.reset();
  };

  const removeOsintFinding = (id) => {
    save({ ...engagement, osintFindings: (engagement.osintFindings || []).filter((f) => f.id !== id) });
  };

  const addOsintTimelineEntry = (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input[name="timelineText"], textarea[name="timelineText"]');
    const text = (input?.value || '').trim();
    if (!text) return;
    const osintTimeline = [...(engagement.osintTimeline || []), { id: Date.now().toString(), text, createdAt: new Date().toISOString() }];
    save({ ...engagement, osintTimeline });
    input.value = '';
  };

  const removeOsintTimelineEntry = (id) => {
    save({ ...engagement, osintTimeline: (engagement.osintTimeline || []).filter((t) => t.id !== id) });
  };

  const addOsintTask = (e) => {
    e.preventDefault();
    const input = e.target.querySelector('input[name="osintTaskText"]');
    const text = (input?.value || '').trim();
    if (!text) return;
    const osintTasks = [...(engagement.osintTasks || []), { id: Date.now().toString(), text, status: 'pending', createdAt: new Date().toISOString() }];
    save({ ...engagement, osintTasks });
    input.value = '';
  };

  const toggleOsintTask = (id) => {
    const osintTasks = (engagement.osintTasks || []).map((t) => (t.id === id ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t));
    save({ ...engagement, osintTasks });
  };

  const removeOsintTask = (id) => {
    save({ ...engagement, osintTasks: (engagement.osintTasks || []).filter((t) => t.id !== id) });
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
  const labTargets = Array.isArray(targets) ? targets : (targets?.targets ? targets.targets : []);

  return (
    <div id="view-engagements" class="view">
      <header class="page-header">
        <h2>Cibles &amp; Proxy</h2>
        <p class="section-desc">Gère tes cibles (machines, URLs), sessions d’engagement, notes et données récupérées. Tout est enregistré localement. Utilise les raccourcis ci-dessous pour les outils intégrés.</p>
        <div class="engagement-shortcuts">
          <button type="button" class="btn btn-primary" onClick={() => onNavigate?.('osint-workbench')}>🕵️ OSINT Workbench</button>
          <button type="button" class="btn topbar-btn" onClick={() => onNavigate?.('labs')}>🧪 Labs &amp; outils</button>
          <button type="button" class="btn topbar-btn" onClick={() => onNavigate?.('proxy-tools')}>📤 Proxy / Requêtes HTTP</button>
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
            placeholder="Colle ici les proxies (un par ligne)&#10;Ex: 192.168.1.1:4080&#10;10.0.0.2:3128"
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
      <section class="dashboard-section">
        <h3 class="section-title">OSINT complet (entreprise / RH / personnes)</h3>
        <p class="section-desc">
          Espace de travail OSINT pour enregistrer tes enquêtes, sources, profils, preuves, résultats et actions. Données sauvegardées localement avec la session.
        </p>
        <div class="engagement-shortcuts">
          <button type="button" class="btn btn-primary" onClick={() => onNavigate?.('osint-workbench')}>🕵️ Ouvrir OSINT Workbench</button>
          <button type="button" class="btn topbar-btn" onClick={() => onNavigate?.('learning')}>📖 Doc &amp; Cours (OSINT)</button>
          <button type="button" class="btn topbar-btn" onClick={() => onNavigate?.('api-client')}>📤 Outil requêtes API</button>
        </div>
      </section>

      <section class="dashboard-section">
        <h3 class="section-title">Cas d’enquête OSINT</h3>
        <form class="engagement-form osint-form-grid" onSubmit={addOsintCase}>
          <input name="caseTitle" placeholder="Nom du cas (ex: Vérification RH - Acme)" required />
          <input name="caseObjective" placeholder="Objectif (ex: vérifier parcours et cohérence)" />
          <input name="caseScope" placeholder="Périmètre (ex: public web, LinkedIn, presse)" />
          <select name="caseStatus" defaultValue="open">
            <option value="open">Ouvert</option>
            <option value="in_progress">En cours</option>
            <option value="closed">Clôturé</option>
          </select>
          <button type="submit" class="topbar-btn">Ajouter le cas</button>
        </form>
        <ul class="engagement-list">
          {(engagement.osintCases || []).map((c) => (
            <li key={c.id} class="engagement-target-item">
              <span class="engagement-target-name">{escapeHtml(c.title)}</span>
              {c.objective && <span class="engagement-target-notes">Objectif: {escapeHtml(c.objective)}</span>}
              {c.scope && <span class="engagement-target-notes">Périmètre: {escapeHtml(c.scope)}</span>}
              <span class="engagement-target-notes">Statut: {escapeHtml(c.status)}</span>
              <button type="button" class="topbar-btn danger" onClick={() => removeOsintCase(c.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      </section>

      <section class="dashboard-section">
        <h3 class="section-title">Entreprises suivies</h3>
        <form class="engagement-form osint-form-grid" onSubmit={addOsintCompany}>
          <input name="companyName" placeholder="Nom de l’entreprise" required />
          <input name="companyWebsite" placeholder="Site web" />
          <input name="companyLinkedin" placeholder="Page LinkedIn" />
          <input name="companyNotes" placeholder="Notes (secteur, localisation, taille...)" />
          <button type="submit" class="topbar-btn">Ajouter l’entreprise</button>
        </form>
        <ul class="engagement-list">
          {(engagement.osintCompanies || []).map((c) => (
            <li key={c.id} class="engagement-target-item">
              <span class="engagement-target-name">{escapeHtml(c.name)}</span>
              {c.website && <a href={c.website} target="_blank" rel="noopener nofollow" class="engagement-target-url">{escapeHtml(c.website)}</a>}
              {c.linkedin && <a href={c.linkedin} target="_blank" rel="noopener nofollow" class="engagement-target-url">LinkedIn</a>}
              {c.notes && <span class="engagement-target-notes">{escapeHtml(c.notes)}</span>}
              <button type="button" class="topbar-btn danger" onClick={() => removeOsintCompany(c.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      </section>

      <section class="dashboard-section">
        <h3 class="section-title">Profils personnes (RH, direction, équipes)</h3>
        <form class="engagement-form osint-form-grid" onSubmit={addOsintPerson}>
          <input name="personName" placeholder="Nom complet" required />
          <input name="personRole" placeholder="Rôle (ex: RH, CTO, Recruteur...)" />
          <input name="personCompany" placeholder="Entreprise associée" />
          <input name="personProfile" placeholder="URL profil public" />
          <select name="personConfidence" defaultValue="medium">
            <option value="low">Confiance faible</option>
            <option value="medium">Confiance moyenne</option>
            <option value="high">Confiance élevée</option>
          </select>
          <input name="personNotes" placeholder="Notes (éléments vérifiés / à vérifier)" />
          <button type="submit" class="topbar-btn">Ajouter le profil</button>
        </form>
        <ul class="engagement-list">
          {(engagement.osintPeople || []).map((p) => (
            <li key={p.id} class="engagement-target-item">
              <span class="engagement-target-name">{escapeHtml(p.fullName)}</span>
              {p.role && <span class="engagement-target-notes">{escapeHtml(p.role)}</span>}
              {p.company && <span class="engagement-target-notes">{escapeHtml(p.company)}</span>}
              {p.profileUrl && <a href={p.profileUrl} target="_blank" rel="noopener nofollow" class="engagement-target-url">Profil</a>}
              <span class="engagement-target-notes">Fiabilité: {escapeHtml(p.confidence)}</span>
              {p.notes && <span class="engagement-target-notes">{escapeHtml(p.notes)}</span>}
              <button type="button" class="topbar-btn danger" onClick={() => removeOsintPerson(p.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      </section>

      <section class="dashboard-section">
        <h3 class="section-title">Sources et preuves (avec fiabilité)</h3>
        <form class="engagement-form osint-form-grid" onSubmit={addOsintSource}>
          <select name="sourceType" defaultValue="web">
            <option value="web">Web</option>
            <option value="linkedin">LinkedIn</option>
            <option value="press">Presse</option>
            <option value="registry">Registre public</option>
            <option value="social">Réseau social</option>
            <option value="other">Autre</option>
          </select>
          <input name="sourceUrl" placeholder="URL de la source / preuve" required />
          <select name="sourceCredibility" defaultValue="medium">
            <option value="low">Crédibilité faible</option>
            <option value="medium">Crédibilité moyenne</option>
            <option value="high">Crédibilité élevée</option>
          </select>
          <input name="sourceNotes" placeholder="Pourquoi cette source est pertinente" />
          <button type="submit" class="topbar-btn">Ajouter la source</button>
        </form>
        <ul class="engagement-list">
          {(engagement.osintSources || []).map((s) => (
            <li key={s.id} class="engagement-target-item">
              <span class="engagement-target-notes">[{escapeHtml(s.type)}]</span>
              <a href={s.url} target="_blank" rel="noopener nofollow" class="engagement-target-url">{escapeHtml(s.url)}</a>
              <span class="engagement-target-notes">Crédibilité: {escapeHtml(s.credibility)}</span>
              {s.notes && <span class="engagement-target-notes">{escapeHtml(s.notes)}</span>}
              <button type="button" class="topbar-btn danger" onClick={() => removeOsintSource(s.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      </section>

      <section class="dashboard-section">
        <h3 class="section-title">Résultats / Findings OSINT</h3>
        <form class="engagement-form osint-form-grid" onSubmit={addOsintFinding}>
          <input name="findingTitle" placeholder="Résumé du résultat" required />
          <select name="findingSeverity" defaultValue="medium">
            <option value="low">Impact faible</option>
            <option value="medium">Impact moyen</option>
            <option value="high">Impact élevé</option>
          </select>
          <input name="findingPerson" placeholder="Personne concernée (optionnel)" />
          <input name="findingEvidence" placeholder="URL preuve principale" />
          <select name="findingStatus" defaultValue="open">
            <option value="open">Ouvert</option>
            <option value="validated">Validé</option>
            <option value="dismissed">Écarté</option>
          </select>
          <input name="findingNotes" placeholder="Notes / recommandations" />
          <button type="submit" class="topbar-btn">Ajouter le résultat</button>
        </form>
        <ul class="engagement-list">
          {(engagement.osintFindings || []).map((f) => (
            <li key={f.id} class="engagement-target-item">
              <span class="engagement-target-name">{escapeHtml(f.title)}</span>
              <span class="engagement-target-notes">Impact: {escapeHtml(f.severity)}</span>
              {f.relatedPerson && <span class="engagement-target-notes">Personne: {escapeHtml(f.relatedPerson)}</span>}
              <span class="engagement-target-notes">Statut: {escapeHtml(f.status)}</span>
              {f.evidenceUrl && <a href={f.evidenceUrl} target="_blank" rel="noopener nofollow" class="engagement-target-url">Preuve</a>}
              {f.notes && <span class="engagement-target-notes">{escapeHtml(f.notes)}</span>}
              <button type="button" class="topbar-btn danger" onClick={() => removeOsintFinding(f.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      </section>

      <section class="dashboard-section">
        <h3 class="section-title">Timeline OSINT</h3>
        <form class="engagement-form" onSubmit={addOsintTimelineEntry}>
          <input name="timelineText" placeholder="Ex: 10:32 vérification profil RH + recoupement presse" />
          <button type="submit" class="topbar-btn">Ajouter à la timeline</button>
        </form>
        <ul class="engagement-list engagement-history">
          {(engagement.osintTimeline || []).slice().reverse().map((t) => (
            <li key={t.id} class="engagement-history-item">
              <span class="engagement-history-date">{t.createdAt ? new Date(t.createdAt).toLocaleString('fr-FR') : ''}</span>
              <span class="engagement-history-text">{escapeHtml(t.text)}</span>
              <button type="button" class="topbar-btn danger" onClick={() => removeOsintTimelineEntry(t.id)} aria-label="Supprimer">×</button>
            </li>
          ))}
        </ul>
      </section>

      <section class="dashboard-section">
        <h3 class="section-title">Checklist OSINT</h3>
        <form class="engagement-form" onSubmit={addOsintTask}>
          <input name="osintTaskText" placeholder="Ex: recouper 2e source pour le poste RH" required />
          <button type="submit" class="topbar-btn">Ajouter</button>
        </form>
        <ul class="engagement-list engagement-todos">
          {(engagement.osintTasks || []).map((t) => (
            <li key={t.id} class="engagement-target-item engagement-todo-item">
              <label class="engagement-todo-label">
                <input type="checkbox" checked={t.status === 'done'} onChange={() => toggleOsintTask(t.id)} />
                <span class={t.status === 'done' ? 'engagement-todo-done' : ''}>{escapeHtml(t.text)}</span>
              </label>
              <button type="button" class="topbar-btn danger" onClick={() => removeOsintTask(t.id)} aria-label="Supprimer">×</button>
            </li>
          ))}
        </ul>
      </section>

      <section class="dashboard-section">
        <h3 class="section-title">Synthèse OSINT</h3>
        <p class="section-desc">Rédige ici ta synthèse finale (constats, niveau de confiance, actions recommandées, limites).</p>
        <textarea
          class="engagement-notes"
          rows={8}
          value={engagement.osintNotes || ''}
          onInput={e => save({ ...engagement, osintNotes: e.target.value })}
          placeholder="Synthèse: ce qui est confirmé, ce qui reste incertain, plan de vérification complémentaire..."
        />
      </section>
    </div>
  );
}
