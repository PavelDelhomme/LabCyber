(function () {
  const state = { data: null, currentRoomId: null };

  async function loadData() {
    try {
      const res = await fetch('data/rooms.json');
      state.data = await res.json();
    } catch (e) {
      console.error('Failed to load rooms.json', e);
      state.data = { categories: [], rooms: [] };
    }
  }

  function byCategory(id) {
    return (state.data.categories || []).find(c => c.id === id) || {};
  }

  function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById('view-' + viewId);
    if (view) view.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => {
      const isRoom = n.dataset.roomId != null;
      const active = isRoom
        ? viewId === 'room' && n.dataset.roomId === state.currentRoomId
        : n.dataset.view === viewId;
      n.classList.toggle('active', !!active);
    });
  }

  function renderDashboard() {
    const grid = document.getElementById('dashboard-cards');
    if (!state.data || !state.data.rooms) return;
    grid.innerHTML = state.data.rooms.map(room => {
      const cat = byCategory(room.category);
      return `
        <article class="card" data-room-id="${room.id}">
          <h3 class="card-title">${room.title}</h3>
          <p class="card-category">${cat.name || room.category}</p>
        </article>
      `;
    }).join('');
    grid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => openRoom(card.dataset.roomId));
    });
  }

  function renderNavRooms() {
    const container = document.getElementById('nav-rooms');
    if (!state.data || !state.data.rooms) return;
    const byCat = {};
    state.data.rooms.forEach(r => {
      if (!byCat[r.category]) byCat[r.category] = [];
      byCat[r.category].push(r);
    });
    let html = '';
    (state.data.categories || []).forEach(cat => {
      const rooms = byCat[cat.id] || [];
      rooms.forEach(room => {
        html += `<button class="nav-item room-nav-item" data-room-id="${room.id}" data-view="room">
          <span class="nav-icon" style="color:${cat.color || '#8b949e'}">${cat.icon || '•'}</span>
          <span>${room.title}</span>
        </button>`;
      });
    });
    container.innerHTML = html;
    container.querySelectorAll('[data-room-id]').forEach(btn => {
      btn.addEventListener('click', () => openRoom(btn.dataset.roomId));
    });
  }

  function openRoom(roomId) {
    state.currentRoomId = roomId;
    showView('room');
    const room = (state.data.rooms || []).find(r => r.id === roomId);
    if (!room) return;

    const cat = byCategory(room.category);

    document.getElementById('room-title').textContent = room.title;
    document.getElementById('room-description').textContent = room.description || '';

    const badge = document.getElementById('room-category-badge');
    badge.textContent = cat.name || room.category;
    badge.style.background = cat.color ? `${cat.color}22` : 'var(--bg-hover)';
    badge.style.color = cat.color || 'var(--text)';

    document.getElementById('room-difficulty').textContent = room.difficulty || '';

    const objectivesEl = document.getElementById('room-objectives');
    objectivesEl.innerHTML = (room.objectives || []).map(o => `<li>${o}</li>`).join('');

    const challengesSection = document.getElementById('room-challenges-section');
    const challengesEl = document.getElementById('room-challenge-downloads');
    if (room.challengeDownloads && room.challengeDownloads.length > 0) {
      challengesSection.hidden = false;
      challengesEl.innerHTML = room.challengeDownloads.map(c => `
        <a href="${c.url}" class="machine-card" target="_blank" rel="noopener" download>
          <span>${c.name}</span>
          ${c.password ? `<span class="machine-note">Mot de passe : ${escapeHtml(c.password)}</span>` : ''}
        </a>
      `).join('');
    } else {
      challengesSection.hidden = true;
      challengesEl.innerHTML = '';
    }

    const machinesEl = document.getElementById('room-machines');
    machinesEl.innerHTML = (room.machines || []).map(m => {
      const isNote = !m.url || m.url === '#';
      const note = m.note || m.credentials || '';
      return `
        <a href="${m.url === '#' ? '#' : m.url}" 
           class="machine-card ${isNote ? 'note-only' : ''}" 
           ${!isNote ? 'target="_blank" rel="noopener"' : ''}
           ${isNote ? 'onclick="return false"' : ''}>
          <span>${m.name}</span>
          ${note ? `<span class="machine-note">${note}</span>` : ''}
        </a>
      `;
    }).join('');

    const tasksEl = document.getElementById('room-tasks');
    tasksEl.innerHTML = (room.tasks || []).map((t, i) => `
      <div class="task-item">
        <div class="task-title">${i + 1}. ${t.title}</div>
        <div class="task-content">${t.content}</div>
        ${t.tip ? `
          <button type="button" class="task-tip-toggle" data-tip="${escapeHtml(t.tip)}">💡 Voir le tip</button>
          <div class="task-tip" hidden>${escapeHtml(t.tip)}</div>
        ` : ''}
      </div>
    `).join('');

    tasksEl.querySelectorAll('.task-tip-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const tipEl = btn.nextElementSibling;
        if (tipEl && tipEl.classList.contains('task-tip')) {
          const show = tipEl.hidden;
          tipEl.hidden = !show;
          btn.textContent = show ? '💡 Masquer le tip' : '💡 Voir le tip';
        }
      });
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function init() {
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      if (item.dataset.roomId) return;
      item.addEventListener('click', () => showView(item.dataset.view));
    });

    loadData().then(() => {
      renderDashboard();
      renderNavRooms();
    });
  }

  init();
})();
