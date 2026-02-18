import { useState, useMemo } from 'preact/hooks';
import { escapeHtml } from '../lib/store';

function byCategory(categories, categoryId) {
  if (!categories || !categoryId) return {};
  const cat = (categories || []).find(c => c.id === categoryId);
  return cat || {};
}

export default function Sidebar({
  view,
  currentScenarioId,
  currentRoomId,
  scenarios,
  data,
  config,
  onNavigate,
  onOpenScenario,
  onOpenRoom,
}) {
  const [labsOpen, setLabsOpen] = useState(true);
  const [scenarioOpen, setScenarioOpen] = useState(true);
  const [roomOpen, setRoomOpen] = useState(true);
  const [scenarioSearch, setScenarioSearch] = useState('');
  const [scenarioCategory, setScenarioCategory] = useState('');
  const [roomSearch, setRoomSearch] = useState('');

  const categories = data?.categories || [];
  const rooms = data?.rooms || [];
  const termPort = config?.terminalPort || 7681;
  const termUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:${termPort}` : '#';
  const desktopUrl = typeof window !== 'undefined' ? `${window.location.origin.replace(/\/$/, '')}/desktop/` : '#';

  const byCat = useMemo(() => {
    const o = {};
    rooms.forEach(r => {
      if (!o[r.category]) o[r.category] = [];
      o[r.category].push(r);
    });
    return o;
  }, [rooms]);

  const scenarioCategories = useMemo(() => {
    const set = new Set();
    (scenarios || []).forEach(s => { if (s.category) set.add(s.category); });
    return Array.from(set).sort();
  }, [scenarios]);

  const scenarioQuery = (scenarioSearch || '').toLowerCase().trim();
  const filteredScenarios = useMemo(() => {
    let list = scenarios || [];
    if (scenarioCategory) list = list.filter(s => s.category === scenarioCategory);
    if (!scenarioQuery) return list;
    return list.filter(s => (s.title || '').toLowerCase().includes(scenarioQuery) || (s.category || '').toLowerCase().includes(scenarioQuery));
  }, [scenarios, scenarioQuery, scenarioCategory]);

  const roomQuery = (roomSearch || '').toLowerCase().trim();
  const filteredRooms = useMemo(() => {
    if (!roomQuery) return rooms;
    return rooms.filter(r =>
      (r.title || '').toLowerCase().includes(roomQuery) ||
      (r.category || '').toLowerCase().includes(roomQuery)
    );
  }, [rooms, roomQuery]);

  return (
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="logo">Lab Cyber</h1>
        <p class="tagline">Scénarios guidés · Style TryHackMe / HackTheBox</p>
      </div>
      <nav class="nav">
        <button
          class={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          <span class="nav-icon">◆</span>
          <span>Accueil</span>
        </button>

        <div class="nav-section nav-section-toggle" onClick={() => setLabsOpen(o => !o)}>
          <span class="nav-section-label">Labs &amp; outils</span>
          <span class={`nav-section-chevron ${labsOpen ? 'open' : ''}`}>▼</span>
        </div>
        {labsOpen && (
          <div class="nav-section-content">
            <div class="nav-section-list">
              <button class={`nav-item nav-item-sub ${view === 'labs' ? 'active' : ''}`} onClick={() => onNavigate('labs')}>🧪 Labs (gérer, config)</button>
              <a class="nav-item nav-item-sub" href={termUrl} target="_blank" rel="noopener" title="Terminal Kali">⌨ Terminal Kali</a>
              <a class="nav-item nav-item-sub" href={desktopUrl} target="_blank" rel="noopener" title="Bureau noVNC">🖥 Bureau noVNC</a>
              <button class={`nav-item nav-item-sub ${view === 'network-sim' ? 'active' : ''}`} onClick={() => onNavigate('network-sim')}>🔌 Simulateur réseau</button>
              <button class={`nav-item nav-item-sub ${view === 'proxy-tools' ? 'active' : ''}`} onClick={() => onNavigate('proxy-tools')}>📤 Proxy / Requêtes</button>
              <button class={`nav-item nav-item-sub ${view === 'capture' ? 'active' : ''}`} onClick={() => onNavigate('capture')}>📡 Capture pcap (Wireshark)</button>
            </div>
          </div>
        )}

        <button class={`nav-item ${view === 'docs' ? 'active' : ''}`} onClick={() => onNavigate('docs')}>📚 Doc. projet</button>
        <button class={`nav-item ${view === 'learning' ? 'active' : ''}`} onClick={() => onNavigate('learning')}>📖 Doc &amp; Cours</button>
        <button class={`nav-item ${view === 'engagements' ? 'active' : ''}`} onClick={() => onNavigate('engagements')}>🎯 Cibles &amp; Proxy</button>
        <button class={`nav-item ${view === 'progression' ? 'active' : ''}`} onClick={() => onNavigate('progression')}>📊 Progression</button>

        <div class="nav-section nav-section-toggle" onClick={() => setScenarioOpen(o => !o)}>
          <span class="nav-section-label">Scénarios guidés</span>
          <span class="nav-section-count">{(scenarios || []).length}</span>
          <span class={`nav-section-chevron ${scenarioOpen ? 'open' : ''}`}>▼</span>
        </div>
        {scenarioOpen && (
          <div class="nav-section-content">
            <input
              type="search"
              class="sidebar-search"
              placeholder="Rechercher (titre ou catégorie)…"
              value={scenarioSearch}
              onInput={e => setScenarioSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
            {scenarioCategories.length > 0 && (
              <select
                class="sidebar-search sidebar-category-select"
                value={scenarioCategory}
                onInput={e => setScenarioCategory(e.target.value)}
                onClick={e => e.stopPropagation()}
              >
                <option value="">Toutes les catégories</option>
                {scenarioCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
            <div class="nav-section-list">
              {filteredScenarios.length === 0 && <span class="sidebar-empty">Aucun scénario</span>}
              {filteredScenarios.map(s => (
                <button
                  key={s.id}
                  class={`nav-item nav-item-sub ${view === 'scenario' && currentScenarioId === s.id ? 'active' : ''}`}
                  onClick={() => onOpenScenario(s.id)}
                >
                  <span class="nav-icon" style="color:var(--accent)">◆</span>
                  <span>{escapeHtml(s.title)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div class="nav-section nav-section-toggle" onClick={() => setRoomOpen(o => !o)}>
          <span class="nav-section-label">Rooms</span>
          <span class="nav-section-count">{rooms.length}</span>
          <span class={`nav-section-chevron ${roomOpen ? 'open' : ''}`}>▼</span>
        </div>
        {roomOpen && (
          <div class="nav-section-content">
            <input
              type="search"
              class="sidebar-search"
              placeholder="Rechercher une room…"
              value={roomSearch}
              onInput={e => setRoomSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
            <div class="nav-section-list">
              {filteredRooms.length === 0 && <span class="sidebar-empty">Aucune room</span>}
              {roomQuery
                ? filteredRooms.map(room => {
                    const cat = byCategory(categories, room.category);
                    return (
                      <button
                        key={room.id}
                        class={`nav-item nav-item-sub ${view === 'room' && currentRoomId === room.id ? 'active' : ''}`}
                        onClick={() => onOpenRoom(room.id)}
                      >
                        <span class="nav-icon" style={`color:${cat.color || '#9aa0a6'}`}>{cat.icon || '•'}</span>
                        <span>{escapeHtml(room.title)}</span>
                      </button>
                    );
                  })
                : categories.map(cat =>
                    (byCat[cat.id] || []).map(room => (
                      <button
                        key={room.id}
                        class={`nav-item nav-item-sub ${view === 'room' && currentRoomId === room.id ? 'active' : ''}`}
                        onClick={() => onOpenRoom(room.id)}
                      >
                        <span class="nav-icon" style={`color:${cat.color || '#9aa0a6'}`}>{cat.icon || '•'}</span>
                        <span>{escapeHtml(room.title)}</span>
                      </button>
                    ))
                  )}
            </div>
          </div>
        )}
      </nav>
      <div class="sidebar-footer"><span>Usage éducatif uniquement</span></div>
    </aside>
  );
}
