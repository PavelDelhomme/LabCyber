import { useMemo } from 'preact/hooks';
import { escapeHtml, getTerminalUrl, getDesktopUrl } from '../lib/store';

function byCategory(categories, categoryId) {
  return (categories || []).find(c => c.id === categoryId) || {};
}

export default function Dashboard({ data, scenarios, config, searchQuery, filterCategory, storage, onNavigate, onOpenScenario, onOpenRoom, onOpenTerminalInNewTab, onOpenTerminalInPanel }) {
  const categories = data?.categories || [];
  const rooms = data?.rooms || [];
  const termUrl = getTerminalUrl(config);

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
            <p class="card-category">Bureau graphique type Kali (XFCE) dans le navigateur. À activer avec <code>make desktop</code>.</p>
            <div class="terminal-card-actions">
              <a href={getDesktopUrl()} target="_blank" rel="noopener" class="btn btn-primary">Ouvrir le bureau</a>
            </div>
            <p class="terminal-help">URL : <code>{getDesktopUrl()}</code>. Mot de passe VNC : <code>alpine</code>. Si 502 : lancer <code>make desktop</code>.</p>
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
        <div class="dashboard-grid" id="dashboard-cards">
          {filteredRooms.length === 0 && <p class="section-desc">Aucune room ne correspond.</p>}
          {filteredRooms.map(room => {
            const cat = byCategory(categories, room.category);
            return (
              <article key={room.id} class="card" onClick={() => onOpenRoom(room.id)} style="cursor:pointer">
                <h3 class="card-title">{escapeHtml(room.title)}</h3>
                <p class="card-category">{escapeHtml(cat.name || room.category)}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section class="dashboard-section">
        <h3 class="section-title">Documentation et tests</h3>
        <div class="dashboard-grid" id="dashboard-docs-cards">
          <article class="card docs-card" onClick={() => onNavigate('docs')} style="cursor:pointer">
            <h3 class="card-title">Documentation du projet</h3>
            <p class="card-category">Index, usage, tests, Web, Réseau, API, Red/Blue, Forensique, OSINT, Stégano, Crypto, Phishing</p>
          </article>
        </div>
      </section>
    </div>
  );
}
