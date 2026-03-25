import { useMemo } from 'preact/hooks';
import { escapeHtml, getTerminalUrl, getDesktopUrl } from '../lib/store';

function byCategory(categories, categoryId) {
  return (categories || []).find(c => c.id === categoryId) || {};
}

export default function Dashboard({ data, scenarios, config, targets, challenges, searchQuery, filterCategory, storage, onNavigate, onOpenScenario, onOpenRoom, onOpenTerminalInNewTab, onOpenTerminalInPanel }) {
  const categories = data?.categories || [];
  const rooms = data?.rooms || [];
  const termUrl = getTerminalUrl();

  const filteredScenarios = useMemo(() => {
    let list = scenarios || [];
    const q = (searchQuery || '').toLowerCase().trim();
    if (q) list = list.filter(s => (s.title || '').toLowerCase().includes(q));
    if (filterCategory) list = list.filter(s => (s.category || '') === filterCategory);
    return list;
  }, [scenarios, searchQuery, filterCategory]);

  const filteredRooms = useMemo(() => {
    let list = rooms || [];
    const q = (searchQuery || '').toLowerCase().trim();
    if (q) list = list.filter(r => (r.title || '').toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q));
    if (filterCategory) list = list.filter(r => (r.category || '') === filterCategory);
    return list;
  }, [rooms, searchQuery, filterCategory]);

  const getProgress = (s) => {
    if (!storage || !s.tasks || !s.tasks.length) return { done: 0, total: 0 };
    let done = 0;
    s.tasks.forEach((_, i) => { if (storage.getTaskDone(s.id, i)) done++; });
    return { done, total: s.tasks.length };
  };
  const getRoomProgress = (r) => {
    if (!storage || !r.tasks || !r.tasks.length) return { done: 0, total: 0 };
    let done = 0;
    r.tasks.forEach((_, i) => { if (storage.getRoomTaskDone(r.id, i)) done++; });
    return { done, total: r.tasks.length };
  };

  const lastId = storage ? storage.getLastScenario() : null;

  return (
    <div id="view-dashboard" class="view active">
      <header class="page-header">
        <h2>Bienvenue sur le Lab Cyber</h2>
        <p>Scénarios guidés, rooms par catégorie. <strong>Un seul port</strong> pour tout le lab (gateway).</p>
      </header>
      <section class="dashboard-section">
        <h3 class="section-title">Mon poste (lab)</h3>
        <p class="section-desc">Terminal web = conteneur attaquant.</p>
        <div class="dashboard-grid" id="dashboard-terminal-cards">
          <article class="card terminal-card">
            <h3 class="card-title">⌨ Terminal web (attaquant)</h3>
            <p class="card-category">Ouvre le terminal du conteneur attaquant dans le navigateur.</p>
            <div class="terminal-card-actions">
              <button type="button" class="btn btn-primary" onClick={() => onOpenTerminalInNewTab?.()}>
                Ouvrir dans un nouvel onglet
              </button>
              <button type="button" class="btn btn-secondary" onClick={() => onOpenTerminalInPanel?.()}>
                Ouvrir à côté (panneau)
              </button>
            </div>
            <p class="terminal-help">URL : <code>{termUrl}</code>. Panneau = plusieurs onglets (sessions). Si 502 : attendre quelques secondes puis rouvrir, ou <code>make dev</code>.</p>
          </article>
          <article class="card desktop-card">
            <h3 class="card-title">🖥️ Interface bureau (noVNC / XFCE)</h3>
            <p class="card-category">Bureau graphique XFCE dans le navigateur (optionnel). Pour les outils et le terminal, utilise plutôt le <strong>Terminal web</strong> (Kali) ci-dessus.</p>
            <div class="terminal-card-actions">
              <a href={getDesktopUrl()} target="_blank" rel="noopener" class="btn btn-primary">Ouvrir le bureau</a>
            </div>
            <p class="terminal-help">Mot de passe VNC : <code>labcyber</code>. Que faire : ouvrir un terminal dans le bureau (Applications → Terminal), ou utiliser le <strong>Terminal web</strong> du lab pour nmap, hydra, etc. Si 502 : attendre le démarrage ou <code>docker compose logs desktop</code>.</p>
          </article>
        </div>
      </section>
      <section class="dashboard-section">
        <h3 class="section-title">Scénarios guidés</h3>
        <div class="dashboard-grid" id="dashboard-scenarios">
          {filteredScenarios.length === 0 && <p class="section-desc">Aucun scénario ne correspond.</p>}
          {filteredScenarios.map(s => {
            const prog = getProgress(s);
            return (
              <article key={s.id} class="card scenario-card" onClick={() => onOpenScenario(s.id)} style="cursor:pointer">
                <h3 class="scenario-card-title">{escapeHtml(s.title)}</h3>
                <p class="scenario-card-meta">
                  <span class={`difficulty-badge ${(s.difficulty || '').toLowerCase()}`}>{escapeHtml(s.difficulty || '')}</span>
                  <span>{escapeHtml(s.time || '')}</span>
                  {prog.done > 0 && <span>{prog.done}/{prog.total} ✓</span>}
                </p>
              </article>
            );
          })}
        </div>
      </section>
      <section class="dashboard-section">
        <h3 class="section-title">Rooms</h3>
        <p class="section-desc">Démarre une room comme un scénario (bouton Démarrer dans la vue room). Progression et barre des tâches identiques.</p>
        <div class="dashboard-grid" id="dashboard-cards">
          {filteredRooms.length === 0 && <p class="section-desc">Aucune room ne correspond.</p>}
          {filteredRooms.map(room => {
            const cat = byCategory(categories, room.category);
            const prog = getRoomProgress(room);
            return (
              <article key={room.id} class="card" onClick={() => onOpenRoom(room.id)} style="cursor:pointer">
                <h3 class="card-title">{escapeHtml(room.title)}</h3>
                <p class="card-category">{escapeHtml(cat.name || room.category)}</p>
                {prog.total > 0 && <p class="card-meta"><span class="difficulty-badge">{escapeHtml(room.difficulty || '')}</span> {prog.done}/{prog.total} tâches</p>}
              </article>
            );
          })}
        </div>
      </section>
      <section class="dashboard-section">
        <h3 class="section-title">Cibles du lab (targets)</h3>
        <p class="section-desc">Machines et services à attaquer : vuln-api, vuln-network, DVWA, Juice Shop, bWAPP, bureau. Détail dans la doc « Cibles du lab ».</p>
        <div class="dashboard-grid" id="dashboard-targets-cards">
          {Array.isArray(targets) && targets.length > 0 ? targets.slice(0, 7).map(t => (
            <article key={t.id} class="card target-card">
              <h3 class="card-title">{escapeHtml(t.name)}</h3>
              <p class="card-category">{escapeHtml(t.type || '')} – {escapeHtml((t.description || '').slice(0, 60))}{(t.description || '').length > 60 ? '…' : ''}</p>
            </article>
          )) : <p class="section-desc">Chargement des cibles…</p>}
        </div>
      </section>
      <section class="dashboard-section">
        <h3 class="section-title">Challenges</h3>
        <p class="section-desc">Défis style CTF / TryHackMe à valider (réseau, API, web, stégano, crypto). Clique pour aller à Ma progression.</p>
        <div class="dashboard-grid" id="dashboard-challenges-cards">
          {Array.isArray(challenges) && challenges.length > 0 ? challenges.slice(0, 8).map(c => (
            <article key={c.id} class="card challenge-card" onClick={() => onNavigate('progression')} style={{ cursor: 'pointer' }} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('progression'); } }} title="Ouvrir Ma progression pour valider les challenges">
              <h3 class="card-title">{escapeHtml(c.title)}</h3>
              <p class="card-category"><span class="difficulty-badge easy">{escapeHtml(c.difficulty || '')}</span> {c.category && <span class="challenge-card-category">{escapeHtml(c.category)}</span>} {escapeHtml((c.description || '').slice(0, 50))}{(c.description || '').length > 50 ? '…' : ''}</p>
            </article>
          )) : <p class="section-desc">Chargement des challenges…</p>}
        </div>
        {Array.isArray(challenges) && challenges.length > 0 && (
          <p class="section-desc" style={{ marginTop: '0.5rem' }}>
            <button type="button" class="btn btn-secondary" onClick={() => onNavigate('progression')}>Voir tous les challenges ({challenges.length})</button>
          </p>
        )}
      </section>
      <section class="dashboard-section">
        <h3 class="section-title">Labs &amp; outils (dont OSINT)</h3>
        <p class="section-desc">
          Ouvre <strong>Labs</strong> pour le simulateur réseau, le client API, la capture pcap, etc. L’outil <strong>OSINT Workbench</strong> est aussi dans la barre latérale sous « Labs &amp; outils ». Accès direct : <code>#/osint-workbench</code> dans l’URL du navigateur.
        </p>
        <div class="dashboard-grid" id="dashboard-labs-osint-cards">
          <article class="card" onClick={() => onNavigate('labs')} style="cursor:pointer" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('labs'); } }}>
            <h3 class="card-title">🧪 Labs &amp; outils</h3>
            <p class="card-category">Gestion des labs, terminal, simulateur, proxy, API, capture pcap.</p>
          </article>
          <article class="card" onClick={() => onNavigate('osint-workbench')} style="cursor:pointer" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate('osint-workbench'); } }}>
            <h3 class="card-title">🕵️ OSINT Workbench</h3>
            <p class="card-category">Entreprises, contacts RH/métiers, actifs, pistes, export, rapport — données sauvegardées localement.</p>
          </article>
        </div>
      </section>
      <section class="dashboard-section">
        <h3 class="section-title">Documentation et tests</h3>
        <div class="dashboard-grid" id="dashboard-docs-cards">
          <article class="card docs-card" onClick={() => onNavigate('docs')} style="cursor:pointer">
            <h3 class="card-title">Documentation du projet</h3>
            <p class="card-category">Index, usage, Cibles, Challenges, Web, Réseau, API, Sniffing/Spoofing, Topologie, Red/Blue, Forensique, OSINT, Stégano, Crypto, Phishing</p>
          </article>
        </div>
      </section>
    </div>
  );
}
