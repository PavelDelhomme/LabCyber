import { escapeHtml } from '../lib/store';

function byCategory(categories, categoryId) {
  return (categories || []).find(c => c.id === categoryId) || {};
}

export default function RoomView({ data, currentRoomId }) {
  const rooms = data?.rooms || [];
  const categories = data?.categories || [];
  const room = currentRoomId ? rooms.find(r => r.id === currentRoomId) : null;

  if (!room) {
    return <div class="view"><p class="section-desc">Choisis une room dans la barre latérale.</p></div>;
  }

  const cat = byCategory(categories, room.category);

  return (
    <div id="view-room" class="view">
      <header class="page-header room-header">
        <div class="room-meta">
          <span class="badge" style={{ background: (cat.color || '') + '22', color: cat.color }}>{cat.name || room.category}</span>
          <span class="difficulty">{escapeHtml(room.difficulty || '')}</span>
        </div>
        <h2 id="room-title">{escapeHtml(room.title)}</h2>
        <p class="room-description">{escapeHtml(room.description || '')}</p>
      </header>
      {(room.objectives || []).length > 0 && (
        <section class="room-section">
          <h3>Objectifs</h3>
          <ul>
            {(room.objectives || []).map((o, i) => <li key={i}>{escapeHtml(o)}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
