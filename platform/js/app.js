(function () {
  const state = { data: null, scenarios: [], config: { gateway: false, hostnames: {} }, docs: null, currentRoomId: null, currentScenarioId: null };
  const log = typeof window !== 'undefined' && window.LabCyberLogger ? window.LabCyberLogger : null;

  function logEvent(component, action, details) {
    if (log) log.event(component, action, details);
  }

  /** URL d'une cible via la gateway (hostname + port actuel) */
  function getTargetUrl(urlKey) {
    if (!state.config.hostnames || !state.config.hostnames[urlKey]) return '#';
    const port = window.location.port || '80';
    return window.location.protocol + '//' + state.config.hostnames[urlKey] + ':' + port;
  }

  /** URL à afficher pour une machine : urlKey (gateway) ou url (littéral) */
  function getMachineUrl(m) {
    if (m.urlKey) return getTargetUrl(m.urlKey);
    return m.url || '#';
  }

  async function loadData() {
    logEvent('platform', 'data_load_start', {});
    try {
      const [resRooms, resScenarios, resConfig, resDocs] = await Promise.all([
        fetch('data/rooms.json'),
        fetch('data/scenarios.json'),
        fetch('data/config.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
        fetch('data/docs.json').then(r => r.ok ? r.json() : null).catch(() => null)
      ]);
      state.data = await resRooms.json();
      const scenarioData = await resScenarios.json();
      state.scenarios = scenarioData.scenarios || [];
      state.config = resConfig.gateway ? resConfig : { gateway: false, hostnames: {} };
      state.docs = resDocs;
      logEvent('platform', 'data_load_success', { rooms: (state.data.rooms || []).length, scenarios: state.scenarios.length });
    } catch (e) {
      if (log) log.ERROR('platform', 'data_load_fail', String(e), { message: e.message });
      state.data = state.data || { categories: [], rooms: [] };
      state.scenarios = state.scenarios || [];
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
      const isScenario = n.dataset.scenarioId != null;
      let active = false;
      if (isScenario) active = viewId === 'scenario' && n.dataset.scenarioId === state.currentScenarioId;
      else if (isRoom) active = viewId === 'room' && n.dataset.roomId === state.currentRoomId;
      else active = n.dataset.view === viewId;
      n.classList.toggle('active', !!active);
    });
    if (viewId === 'docs') renderDocsView();
    logEvent('platform', 'view_changed', { viewId });
  }

  function getTaskDoneKey(scenarioId, taskIndex) {
    return 'labcyber-done-' + scenarioId + '-task-' + taskIndex;
  }

  function isTaskDone(scenarioId, taskIndex) {
    return localStorage.getItem(getTaskDoneKey(scenarioId, taskIndex)) === '1';
  }

  function setTaskDone(scenarioId, taskIndex, done) {
    if (done) localStorage.setItem(getTaskDoneKey(scenarioId, taskIndex), '1');
    else localStorage.removeItem(getTaskDoneKey(scenarioId, taskIndex));
  }

  function escapeHtml(s) {
    if (!s) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function renderDashboard() {
    const scenarioGrid = document.getElementById('dashboard-scenarios');
    const roomGrid = document.getElementById('dashboard-cards');
    const terminalGrid = document.getElementById('dashboard-terminal-cards');
    const navTerminal = document.getElementById('nav-terminal');

    if (navTerminal) {
      navTerminal.href = getTargetUrl('terminal');
      navTerminal.style.display = state.config.gateway ? '' : 'none';
    }
    if (terminalGrid) {
      const termUrl = getTargetUrl('terminal');
      terminalGrid.innerHTML = termUrl !== '#' ? `
        <article class="card terminal-card">
          <a href="${termUrl}" target="_blank" rel="noopener" class="card-link">
            <h3 class="card-title">⌨ Terminal web (attaquant)</h3>
            <p class="card-category">Ouvre un terminal dans le navigateur – même environnement que <code>make shell</code></p>
          </a>
        </article>
      ` : '<p class="section-desc">Configure la gateway pour afficher le terminal.</p>';
    }

    if (scenarioGrid) {
      scenarioGrid.innerHTML = (state.scenarios || []).map(s => {
        const diffClass = (s.difficulty || '').toLowerCase();
        return `
          <article class="card scenario-card" data-scenario-id="${s.id}">
            <h3 class="scenario-card-title">${escapeHtml(s.title)}</h3>
            <p class="scenario-card-meta">
              <span class="difficulty-badge ${diffClass}">${escapeHtml(s.difficulty || '')}</span>
              <span>${escapeHtml(s.time || '')}</span>
            </p>
          </article>
        `;
      }).join('');
      scenarioGrid.querySelectorAll('[data-scenario-id]').forEach(el => {
        el.addEventListener('click', () => openScenario(el.dataset.scenarioId));
      });
    }

    if (roomGrid && state.data && state.data.rooms) {
      roomGrid.innerHTML = state.data.rooms.map(room => {
        const cat = byCategory(room.category);
        return `
          <article class="card" data-room-id="${room.id}">
            <h3 class="card-title">${escapeHtml(room.title)}</h3>
            <p class="card-category">${escapeHtml(cat.name || room.category)}</p>
          </article>
        `;
      }).join('');
      roomGrid.querySelectorAll('[data-room-id]').forEach(card => {
        card.addEventListener('click', () => openRoom(card.dataset.roomId));
      });
    }

    var docsCards = document.getElementById('dashboard-docs-cards');
    if (docsCards) {
      docsCards.innerHTML = `
        <article class="card docs-card" data-view-docs="1">
          <button type="button" class="card-link" style="text-align:left;width:100%;border:none;background:none;cursor:pointer;color:inherit;font:inherit;">
            <h3 class="card-title">Documentation du projet</h3>
            <p class="card-category">Index, usage, tests, logs, Web, Réseau, API, Red/Blue, Forensique, OSINT, Stégano, Crypto, Phishing</p>
          </button>
        </article>
        <article class="card">
          <a href="/test-logs.html" target="_blank" rel="noopener" class="card-link">
            <h3 class="card-title">Tests (logger)</h3>
            <p class="card-category">Page de test du journal d'activité</p>
          </a>
        </article>
      `;
      docsCards.querySelector('[data-view-docs]').addEventListener('click', function () { showView('docs'); });
    }
  }

  function renderDocsView() {
    var titleEl = document.getElementById('docs-title');
    var descEl = document.getElementById('docs-description');
    var listEl = document.getElementById('docs-list');
    if (!listEl) return;
    if (!state.docs || !state.docs.entries) {
      if (titleEl) titleEl.textContent = 'Documentation du projet';
      if (descEl) descEl.textContent = 'Aucune donnée. Vérifiez que data/docs.json est chargé.';
      listEl.innerHTML = '';
      return;
    }
    if (titleEl) titleEl.textContent = state.docs.title || 'Documentation';
    if (descEl) descEl.textContent = state.docs.description || '';
    listEl.innerHTML = state.docs.entries.map(function (e) {
      return '<li><a href="/docs/' + escapeHtml(e.file) + '" target="_blank" rel="noopener">' + escapeHtml(e.name) + '</a></li>';
    }).join('');
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
      (byCat[cat.id] || []).forEach(room => {
        html += `<button class="nav-item room-nav-item" data-room-id="${room.id}" data-view="room">
          <span class="nav-icon" style="color:${cat.color || '#9aa0a6'}">${cat.icon || '•'}</span>
          <span>${escapeHtml(room.title)}</span>
        </button>`;
      });
    });
    container.innerHTML = html;
    container.querySelectorAll('[data-room-id]').forEach(btn => {
      btn.addEventListener('click', () => openRoom(btn.dataset.roomId));
    });
  }

  function renderNavScenarios() {
    const container = document.getElementById('nav-scenarios');
    if (!container || !state.scenarios.length) return;
    let html = '';
    state.scenarios.forEach(s => {
      html += `<button class="nav-item scenario-nav-item" data-scenario-id="${s.id}" data-view="scenario">
        <span class="nav-icon" style="color:var(--accent)">◆</span>
        <span>${escapeHtml(s.title)}</span>
      </button>`;
    });
    container.innerHTML = html;
    container.querySelectorAll('[data-scenario-id]').forEach(btn => {
      btn.addEventListener('click', () => openScenario(btn.dataset.scenarioId));
    });
  }

  function openScenario(scenarioId) {
    state.currentScenarioId = scenarioId;
    showView('scenario');
    const s = (state.scenarios || []).find(x => x.id === scenarioId);
    if (!s) return;
    logEvent('platform', 'scenario_opened', { scenarioId, title: s.title });

    document.getElementById('scenario-title').textContent = s.title;
    document.getElementById('scenario-description').textContent = s.description || '';

    const diffEl = document.getElementById('scenario-difficulty');
    diffEl.textContent = s.difficulty || '';
    diffEl.className = 'difficulty-badge ' + (s.difficulty || '').toLowerCase();

    const timeEl = document.getElementById('scenario-time');
    timeEl.textContent = s.time || '';
    timeEl.className = 'time-badge';

    const machinesEl = document.getElementById('scenario-machines');
    machinesEl.innerHTML = (s.machines || []).map(m => {
      const url = getMachineUrl(m);
      const isNote = !url || url === '#';
      const note = m.note || m.credentials || '';
      return `
        <a href="${isNote ? '#' : url}" 
           class="machine-card ${isNote ? 'note-only' : ''}" 
           data-machine-name="${escapeHtml(m.name || '')}"
           data-machine-url="${escapeHtml(url)}"
           ${!isNote ? 'target="_blank" rel="noopener"' : ''}
           ${isNote ? 'onclick="return false"' : ''}>
          <span>${escapeHtml(m.name)}</span>
          ${note ? `<span class="machine-note">${escapeHtml(note)}</span>` : ''}
        </a>
      `;
    }).join('');
    machinesEl.querySelectorAll('a.machine-card:not(.note-only)').forEach(a => {
      a.addEventListener('click', function() {
        logEvent('platform', 'machine_link_clicked', { context: 'scenario', scenarioId, name: this.dataset.machineName || '', url: this.dataset.machineUrl || this.getAttribute('href') });
      });
    });

    const tasksEl = document.getElementById('scenario-tasks');
    tasksEl.innerHTML = (s.tasks || []).map((t, i) => {
      const done = isTaskDone(scenarioId, i);
      const cmd = t.command != null && t.command !== '' && t.command !== 'null'
        ? `<div class="code-block-wrap"><button type="button" class="copy-btn">Copier</button><pre class="code-block">${escapeHtml(t.command)}</pre></div>`
        : '';
      const tip = t.tip ? `<button type="button" class="task-tip-toggle">💡 Tip</button><div class="task-tip" hidden>${escapeHtml(t.tip)}</div>` : '';
      const learn = t.learn ? `<div class="task-learn"><strong>Ce que tu apprends :</strong> ${escapeHtml(t.learn)}</div>` : '';
      return `
        <div class="task-item ${done ? 'done' : ''}" data-task-index="${i}">
          <div class="task-title">
            <input type="checkbox" class="task-checkbox" ${done ? 'checked' : ''} data-task-index="${i}" aria-label="Marquer comme fait">
            <span>${i + 1}. ${escapeHtml(t.title)}</span>
          </div>
          <div class="task-content">${escapeHtml(t.content)}</div>
          ${cmd}
          ${tip}
          ${learn}
        </div>
      `;
    }).join('');

    tasksEl.querySelectorAll('.task-checkbox').forEach(cb => {
      cb.addEventListener('change', function() {
        const idx = parseInt(this.dataset.taskIndex, 10);
        setTaskDone(scenarioId, idx, this.checked);
        const item = this.closest('.task-item');
        if (item) item.classList.toggle('done', this.checked);
        logEvent('platform', 'scenario_task_toggled', { scenarioId, taskIndex: idx, done: this.checked });
      });
    });

    tasksEl.querySelectorAll('.task-tip-toggle').forEach(btn => {
      btn.addEventListener('click', function() {
        const tipEl = this.nextElementSibling;
        if (tipEl && tipEl.classList.contains('task-tip')) {
          tipEl.hidden = !tipEl.hidden;
          this.textContent = tipEl.hidden ? '💡 Tip' : '💡 Masquer';
        }
      });
    });

    tasksEl.querySelectorAll('.code-block-wrap .copy-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const pre = this.nextElementSibling;
        if (pre && pre.classList.contains('code-block')) {
          const text = pre.textContent;
          navigator.clipboard.writeText(text).then(() => {
            this.textContent = 'Copié !';
            setTimeout(() => { this.textContent = 'Copier'; }, 1500);
            logEvent('platform', 'command_copied', { scenarioId, length: text.length });
          });
        }
      });
    });
  }

  function openRoom(roomId) {
    state.currentRoomId = roomId;
    showView('room');
    const room = (state.data.rooms || []).find(r => r.id === roomId);
    if (!room) return;
    logEvent('platform', 'room_opened', { roomId, title: room.title });

    const cat = byCategory(room.category);

    document.getElementById('room-title').textContent = room.title;
    document.getElementById('room-description').textContent = room.description || '';

    const badge = document.getElementById('room-category-badge');
    badge.textContent = cat.name || room.category;
    badge.style.background = cat.color ? cat.color + '22' : 'var(--bg-hover)';
    badge.style.color = cat.color || 'var(--text)';

    document.getElementById('room-difficulty').textContent = room.difficulty || '';

    const objectivesEl = document.getElementById('room-objectives');
    objectivesEl.innerHTML = (room.objectives || []).map(o => `<li>${escapeHtml(o)}</li>`).join('');

    const challengesSection = document.getElementById('room-challenges-section');
    const challengesEl = document.getElementById('room-challenge-downloads');
    if (room.challengeDownloads && room.challengeDownloads.length > 0) {
      challengesSection.hidden = false;
      challengesEl.innerHTML = room.challengeDownloads.map(c => `
        <a href="${c.url}" class="machine-card" target="_blank" rel="noopener" download data-challenge-name="${escapeHtml(c.name || '')}">
          <span>${escapeHtml(c.name)}</span>
          ${c.password ? `<span class="machine-note">Mot de passe : ${escapeHtml(c.password)}</span>` : ''}
        </a>
      `).join('');
      challengesEl.querySelectorAll('a.machine-card').forEach(a => {
        a.addEventListener('click', function() {
          logEvent('platform', 'challenge_download_clicked', { roomId, name: this.dataset.challengeName || '', url: this.getAttribute('href') });
        });
      });
    } else {
      challengesSection.hidden = true;
      challengesEl.innerHTML = '';
    }

    const machinesEl = document.getElementById('room-machines');
    machinesEl.innerHTML = (room.machines || []).map(m => {
      const url = getMachineUrl(m);
      const isNote = !url || url === '#';
      const note = m.note || m.credentials || '';
      return `
        <a href="${isNote ? '#' : url}" 
           class="machine-card ${isNote ? 'note-only' : ''}" 
           data-machine-name="${escapeHtml(m.name || '')}"
           data-machine-url="${escapeHtml(url)}"
           ${!isNote ? 'target="_blank" rel="noopener"' : ''}
           ${isNote ? 'onclick="return false"' : ''}>
          <span>${escapeHtml(m.name)}</span>
          ${note ? `<span class="machine-note">${escapeHtml(note)}</span>` : ''}
        </a>
      `;
    }).join('');
    machinesEl.querySelectorAll('a.machine-card:not(.note-only)').forEach(a => {
      a.addEventListener('click', function() {
        logEvent('platform', 'machine_link_clicked', { context: 'room', roomId, name: this.dataset.machineName || '', url: this.dataset.machineUrl || this.getAttribute('href') });
      });
    });

    const tasksEl = document.getElementById('room-tasks');
    tasksEl.innerHTML = (room.tasks || []).map((t, i) => `
      <div class="task-item">
        <div class="task-title">${i + 1}. ${escapeHtml(t.title)}</div>
        <div class="task-content">${escapeHtml(t.content)}</div>
        ${t.tip ? `<button type="button" class="task-tip-toggle">💡 Tip</button><div class="task-tip" hidden>${escapeHtml(t.tip)}</div>` : ''}
      </div>
    `).join('');

    tasksEl.querySelectorAll('.task-tip-toggle').forEach(btn => {
      btn.addEventListener('click', function() {
        const tipEl = this.nextElementSibling;
        if (tipEl && tipEl.classList.contains('task-tip')) {
          tipEl.hidden = !tipEl.hidden;
          this.textContent = tipEl.hidden ? '💡 Tip' : '💡 Masquer';
        }
      });
    });
  }

  function renderLogEntries() {
    const ul = document.getElementById('log-entries');
    if (!ul || !log) return;
    const entries = log.getEntries().slice(-100).reverse();
    ul.innerHTML = entries.map(function (e) {
      const detailsStr = e.details && Object.keys(e.details).length ? ' ' + JSON.stringify(e.details) : '';
      return '<li class="log-level-' + e.level + '"><span class="log-ts">' + e.ts + '</span><span class="log-component">[' + e.component + ']</span> <span class="log-action">' + (e.action || e.message) + '</span><div class="log-details">' + (detailsStr || '') + '</div></li>';
    }).join('');
  }

  function initLogPanel() {
    if (!log) return;
    window.addEventListener('labcyber-log', renderLogEntries);
    renderLogEntries();

    var exportJson = document.getElementById('log-export-json');
    if (exportJson) exportJson.addEventListener('click', function () {
      var a = document.createElement('a');
      a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(log.exportAsJson());
      a.download = 'labcyber-logs-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      logEvent('platform', 'logs_exported', { format: 'json' });
    });

    var exportTxt = document.getElementById('log-export-txt');
    if (exportTxt) exportTxt.addEventListener('click', function () {
      var a = document.createElement('a');
      a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(log.exportAsText());
      a.download = 'labcyber-logs-' + new Date().toISOString().slice(0, 10) + '.txt';
      a.click();
      logEvent('platform', 'logs_exported', { format: 'txt' });
    });

    var logClear = document.getElementById('log-clear');
    if (logClear) logClear.addEventListener('click', function () {
      log.clear();
      renderLogEntries();
      logEvent('platform', 'logs_cleared', {});
    });

    var logToggle = document.getElementById('log-panel-toggle');
    if (logToggle) logToggle.addEventListener('click', function () {
      var panel = document.getElementById('log-panel');
      if (panel) {
        panel.classList.toggle('collapsed');
        this.textContent = panel.classList.contains('collapsed') ? '+' : '−';
      }
    });
  }

  function init() {
    if (log) logEvent('platform', 'app_init', {});
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      if (item.dataset.roomId || item.dataset.scenarioId) return;
      item.addEventListener('click', () => showView(item.dataset.view));
    });

    loadData().then(() => {
      renderDashboard();
      renderNavRooms();
      renderNavScenarios();
      initLogPanel();
    });
  }

  init();
})();
