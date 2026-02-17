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
  const categories = data?.categories || [];
  const rooms = data?.rooms || [];
  const termPort = config?.terminalPort || 7681;
  const termUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:${termPort}` : '#';

  const byCat = {};
  rooms.forEach(r => {
    if (!byCat[r.category]) byCat[r.category] = [];
    byCat[r.category].push(r);
  });

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
        <a class="nav-item" href={termUrl} target="_blank" rel="noopener" title="Terminal lab">⌨ Terminal lab</a>
        <button class={`nav-item ${view === 'docs' ? 'active' : ''}`} onClick={() => onNavigate('docs')}>📚 Doc. projet</button>
        <button class={`nav-item ${view === 'learning' ? 'active' : ''}`} onClick={() => onNavigate('learning')}>📖 Doc &amp; Cours</button>
        <button class={`nav-item ${view === 'engagements' ? 'active' : ''}`} onClick={() => onNavigate('engagements')}>🎯 Cibles &amp; Proxy</button>
        <div class="nav-section">Scénarios guidés</div>
        {(scenarios || []).map(s => {
          const total = (s.tasks || []).length;
          return (
            <button
              key={s.id}
              class={`nav-item ${view === 'scenario' && currentScenarioId === s.id ? 'active' : ''}`}
              onClick={() => onOpenScenario(s.id)}
            >
              <span class="nav-icon" style="color:var(--accent)">◆</span>
              <span>{escapeHtml(s.title)}</span>
            </button>
          );
        })}
        <div class="nav-section">Rooms</div>
        {categories.map(cat =>
          (byCat[cat.id] || []).map(room => (
            <button
              key={room.id}
              class={`nav-item ${view === 'room' && currentRoomId === room.id ? 'active' : ''}`}
              onClick={() => onOpenRoom(room.id)}
            >
              <span class="nav-icon" style={`color:${cat.color || '#9aa0a6'}`}>{cat.icon || '•'}</span>
              <span>{escapeHtml(room.title)}</span>
            </button>
          ))
        )}
      </nav>
      <div class="sidebar-footer"><span>Usage éducatif uniquement</span></div>
    </aside>
  );
}
