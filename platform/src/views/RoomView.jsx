import { escapeHtml, getTerminalUrl, getDesktopUrl, getMachineUrl } from '../lib/store';

function byCategory(categories, categoryId) {
  return (categories || []).find(c => c.id === categoryId) || {};
}

export default function RoomView({ data, currentRoomId }) {
  const rooms = data?.rooms || [];
  const categories = data?.categories || [];
  const room = currentRoomId ? rooms.find(r => r.id === currentRoomId) : null;

  if (!room) {
    return (
      <div class="view">
        <header class="page-header">
          <h2>Rooms</h2>
          <p class="section-desc">Choisis une room dans la barre latérale pour voir objectifs, machines et tâches à suivre.</p>
        </header>
      </div>
    );
  }

  const cat = byCategory(categories, room.category);

  const machineUrl = (m) => {
    if (m.urlKey) {
      if (m.urlKey === 'terminal') return getTerminalUrl();
      if (m.urlKey === 'desktop') return getDesktopUrl();
      const { url } = getMachineUrl(m.urlKey);
      return url;
    }
    return m.url || '#';
  };

  return (
    <div id="view-room" class="view">
      <header class="page-header room-header">
        <div class="room-meta">
          <span class="badge room-badge" style={{ background: (cat.color || '') + '22', color: cat.color, border: `1px solid ${cat.color || '#999'}` }}>{cat.name || room.category}</span>
          <span class="difficulty-badge difficulty">{escapeHtml(room.difficulty || '')}</span>
        </div>
        <h2 id="room-title">{escapeHtml(room.title)}</h2>
        <p class="room-description">{escapeHtml(room.description || '')}</p>
      </header>

      {(room.objectives || []).length > 0 && (
        <section class="room-section">
          <h3>Objectifs</h3>
          <ul class="room-objectives">
            {(room.objectives || []).map((o, i) => <li key={i}>{escapeHtml(o)}</li>)}
          </ul>
        </section>
      )}

      {(room.machines || []).length > 0 && (
        <section class="room-section">
          <h3>Machines & accès</h3>
          <ul class="room-machines">
            {(room.machines || []).map((m, i) => (
              <li key={i} class="room-machine">
                {(m.urlKey || m.url) ? (
                  <a href={machineUrl(m)} target="_blank" rel="noopener" class="room-machine-link">{escapeHtml(m.name)}</a>
                ) : (
                  <span class="room-machine-name">{escapeHtml(m.name)}</span>
                )}
                {m.credentials && <span class="room-machine-creds"> — {escapeHtml(m.credentials)}</span>}
                {m.note && <span class="room-machine-note"> ({escapeHtml(m.note)})</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(room.tasks || []).length > 0 && (
        <section class="room-section">
          <h3>Tâches à suivre</h3>
          <p class="section-desc">Coche mentalement ou note tes progrès. Utilise la vue <strong>Progression</strong> pour suivre l’ensemble.</p>
          <ol class="room-tasks">
            {(room.tasks || []).map((t, i) => (
              <li key={i} class="room-task">
                <strong class="room-task-title">{escapeHtml(t.title)}</strong>
                <p class="room-task-content">{escapeHtml(t.content)}</p>
                {t.tip && <p class="room-task-tip">💡 {escapeHtml(t.tip)}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {(!room.objectives || room.objectives.length === 0) && (!room.machines || room.machines.length === 0) && (!room.tasks || room.tasks.length === 0) && (
        <p class="section-desc text-muted">Aucun objectif ou tâche défini pour cette room.</p>
      )}
    </div>
  );
}
