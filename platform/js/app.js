(function () {
  const state = {
    data: null,
    scenarios: [],
    config: { gateway: false, hostnames: {} },
    docs: null,
    currentRoomId: null,
    currentScenarioId: null,
    searchQuery: '',
    filterCategory: '',
    categories: []
  };
  const log = typeof window !== 'undefined' && window.LabCyberLogger ? window.LabCyberLogger : null;

  const Storage = typeof window !== 'undefined' && window.LabCyberStorage ? window.LabCyberStorage : null;
  const STORAGE_LAST_SCENARIO = 'labcyber-last-scenario';
  const STORAGE_LAST_TASK = 'labcyber-last-task';
  const STORAGE_PIP_AUTO = 'labcyber-pip-auto';
  const STORAGE_ENGAGEMENT = 'labcyber-engagement';

  function logEvent(component, action, details) {
    if (log) log.event(component, action, details);
  }

  /** URL d'une cible via la gateway (hostname + port actuel) */
  function getTargetUrl(urlKey) {
    if (!state.config.hostnames || !state.config.hostnames[urlKey]) return '#';
    const port = window.location.port || '80';
    return window.location.protocol + '//' + state.config.hostnames[urlKey] + ':' + port;
  }

  /** URL à afficher pour une machine : urlKey (gateway) ou url (littéral). Les chemins /xxx sont en même origine. */
  function getMachineUrl(m) {
    if (m.urlKey) return getTargetUrl(m.urlKey);
    var u = m.url || '#';
    if (u === '#' || u === '' || !u) return '#';
    if (typeof u === 'string' && u.startsWith('/')) return window.location.origin + u;
    return u;
  }

  async function loadData() {
    logEvent('platform', 'data_load_start', {});
    if (Storage) await Storage.ready();
    if (log && log.hydrateFromStorage) await log.hydrateFromStorage();
    try {
      const [resRooms, resScenarios, resConfig, resDocs, resLearning] = await Promise.all([
        fetch('data/rooms.json'),
        fetch('data/scenarios.json'),
        fetch('data/config.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
        fetch('data/docs.json').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('data/learning.json').then(r => r.ok ? r.json() : null).catch(() => null)
      ]);
      state.data = await resRooms.json();
      const scenarioData = await resScenarios.json();
      state.scenarios = scenarioData.scenarios || [];
      state.config = resConfig.gateway ? resConfig : { gateway: false, hostnames: {} };
      state.docs = resDocs;
      state.learning = resLearning;
      state.categories = state.data.categories || [];
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

  function updateTopbarContext() {
    var el = document.getElementById('topbar-context');
    if (!el) return;
    var view = document.querySelector('.view.active');
    var viewId = view ? view.id.replace('view-', '') : '';
    if (viewId === 'scenario' && state.currentScenarioId) {
      var s = (state.scenarios || []).find(x => x.id === state.currentScenarioId);
      el.textContent = s ? 'Scénario : ' + s.title : '';
    } else if (viewId === 'room' && state.currentRoomId) {
      var r = (state.data && state.data.rooms) ? state.data.rooms.find(x => x.id === state.currentRoomId) : null;
      el.textContent = r ? 'Room : ' + r.title : '';
    } else if (viewId === 'dashboard') el.textContent = 'Accueil';
    else if (viewId === 'docs') el.textContent = 'Documentation projet';
    else if (viewId === 'learning') el.textContent = 'Documentation & Cours';
    else if (viewId === 'engagements') el.textContent = 'Cibles & Proxy';
    else el.textContent = '';
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
    if (viewId === 'learning') renderLearningView();
    if (viewId === 'engagements') renderEngagementsView();
    updateTopbarContext();
    updatePipButtonVisibility(viewId);
    logEvent('platform', 'view_changed', { viewId });
  }

  function updatePipButtonVisibility(viewId) {
    var btnPip = document.getElementById('btn-pip-toggle');
    if (!btnPip) return;
    if (viewId === 'scenario') {
      btnPip.style.display = '';
    } else {
      btnPip.style.display = 'none';
      hidePipPanel();
    }
  }

  function getTaskDoneKey(scenarioId, taskIndex) {
    return 'labcyber-done-' + scenarioId + '-task-' + taskIndex;
  }

  function isTaskDone(scenarioId, taskIndex) {
    if (Storage) return Storage.getTaskDone(scenarioId, taskIndex);
    return localStorage.getItem(getTaskDoneKey(scenarioId, taskIndex)) === '1';
  }

  function setTaskDone(scenarioId, taskIndex, done) {
    if (Storage) { Storage.setTaskDone(scenarioId, taskIndex, done); return; }
    if (done) localStorage.setItem(getTaskDoneKey(scenarioId, taskIndex), '1');
    else localStorage.removeItem(getTaskDoneKey(scenarioId, taskIndex));
  }

  function saveLastScenario(scenarioId, taskIndex) {
    if (Storage) {
      Storage.setLastScenario(scenarioId || null);
      if (taskIndex != null) Storage.setLastTaskIndex(taskIndex);
      return;
    }
    if (scenarioId) localStorage.setItem(STORAGE_LAST_SCENARIO, scenarioId);
    if (taskIndex != null) localStorage.setItem(STORAGE_LAST_TASK, String(taskIndex));
  }

  function getLastScenario() {
    if (Storage) return Storage.getLastScenario() || null;
    return localStorage.getItem(STORAGE_LAST_SCENARIO) || null;
  }

  function getEngagementData() {
    if (Storage) return Storage.getEngagement();
    try {
      var raw = localStorage.getItem(STORAGE_ENGAGEMENT);
      if (!raw) return { targets: [], proxyNotes: '', notes: '' };
      var d = JSON.parse(raw);
      return { targets: d.targets || [], proxyNotes: d.proxyNotes || '', notes: d.notes || '' };
    } catch (e) { return { targets: [], proxyNotes: '', notes: '' }; }
  }

  function saveEngagementData(data) {
    if (Storage) { Storage.setEngagement(data); return; }
    localStorage.setItem(STORAGE_ENGAGEMENT, JSON.stringify(data));
  }
  function getLastTaskIndex() {
    if (Storage) return Storage.getLastTaskIndex();
    const v = localStorage.getItem(STORAGE_LAST_TASK);
    return v !== null ? parseInt(v, 10) : null;
  }

  function getScenarioProgress(scenarioId) {
    const s = (state.scenarios || []).find(x => x.id === scenarioId);
    if (!s || !s.tasks || !s.tasks.length) return { done: 0, total: 0 };
    let done = 0;
    s.tasks.forEach((_, i) => { if (isTaskDone(scenarioId, i)) done++; });
    return { done, total: s.tasks.length };
  }

  function getProgressStats() {
    const scenarios = state.scenarios || [];
    let totalTasks = 0, doneTasks = 0, completedScenarios = 0;
    const perScenario = [];
    scenarios.forEach(s => {
      const p = getScenarioProgress(s.id);
      totalTasks += p.total;
      doneTasks += p.done;
      if (p.total && p.done === p.total) completedScenarios++;
      perScenario.push({ id: s.id, title: s.title, ...p });
    });
    return { totalTasks, doneTasks, completedScenarios, totalScenarios: scenarios.length, perScenario };
  }

  /** Filtre scénarios par recherche et catégorie */
  function filterScenarios() {
    const q = (state.searchQuery || '').toLowerCase().trim();
    const cat = state.filterCategory || '';
    return (state.scenarios || []).filter(s => {
      const matchCat = !cat || (s.category || '') === cat;
      const matchSearch = !q || (s.title || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) || (s.category || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }

  /** Filtre rooms par recherche et catégorie */
  function filterRooms() {
    const q = (state.searchQuery || '').toLowerCase().trim();
    const cat = state.filterCategory || '';
    const rooms = state.data && state.data.rooms ? state.data.rooms : [];
    return rooms.filter(r => {
      const matchCat = !cat || (r.category || '') === cat;
      const matchSearch = !q || (r.title || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
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
      navTerminal.href = getTerminalUrl ? getTerminalUrl() : getTargetUrl('terminal');
      navTerminal.style.display = '';
      navTerminal.setAttribute('title', 'Ouvrir le terminal du lab. Si la page affiche une erreur, démarrez le lab : make up (ou docker compose up -d).');
    }
    if (terminalGrid) {
      const termUrl = getTerminalUrl ? getTerminalUrl() : getTargetUrl('terminal');
      terminalGrid.innerHTML = termUrl !== '#' ? `
        <article class="card terminal-card">
          <a href="${termUrl}" target="_blank" rel="noopener" class="card-link">
            <h3 class="card-title">⌨ Terminal web (attaquant)</h3>
            <p class="card-category">Ouvre un terminal dans le navigateur – même environnement que <code>make shell</code></p>
          </a>
          <p class="terminal-help">Si la page affiche une erreur, démarrez le lab : <code>make up</code> ou <code>docker compose up -d</code>.</p>
        </article>
      ` : '<p class="section-desc">Configure la gateway pour afficher le terminal.</p>';
    }

    const filteredScenarios = filterScenarios();
    const lastId = getLastScenario();
    if (scenarioGrid) {
      let html = '';
      if (lastId && (state.scenarios || []).some(s => s.id === lastId)) {
        const lastS = state.scenarios.find(s => s.id === lastId);
        const prog = getScenarioProgress(lastId);
        html += `
          <article class="card scenario-card resume-card" data-scenario-id="${lastId}" data-resume="1">
            <h3 class="scenario-card-title">▶ Reprendre : ${escapeHtml(lastS.title)}</h3>
            <p class="scenario-card-meta">${prog.done}/${prog.total} tâches · Clique pour continuer</p>
          </article>
        `;
      }
      html += filteredScenarios.filter(s => !lastId || s.id !== lastId).map(s => {
        const diffClass = (s.difficulty || '').toLowerCase();
        const prog = getScenarioProgress(s.id);
        return `
          <article class="card scenario-card" data-scenario-id="${s.id}">
            <h3 class="scenario-card-title">${escapeHtml(s.title)}</h3>
            <p class="scenario-card-meta">
              <span class="difficulty-badge ${diffClass}">${escapeHtml(s.difficulty || '')}</span>
              <span>${escapeHtml(s.time || '')}</span>
              ${prog.done ? `<span>${prog.done}/${prog.total} ✓</span>` : ''}
            </p>
          </article>
        `;
      }).join('');
      scenarioGrid.innerHTML = html || '<p class="section-desc">Aucun scénario ne correspond à la recherche.</p>';
      scenarioGrid.querySelectorAll('[data-scenario-id]').forEach(el => {
        el.addEventListener('click', () => openScenario(el.dataset.scenarioId));
      });
    }

    const filteredRooms = filterRooms();
    if (roomGrid && state.data) {
      roomGrid.innerHTML = filteredRooms.map(room => {
        const cat = byCategory(room.category);
        return `
          <article class="card" data-room-id="${room.id}">
            <h3 class="card-title">${escapeHtml(room.title)}</h3>
            <p class="card-category">${escapeHtml(cat.name || room.category)}</p>
          </article>
        `;
      }).join('');
      if (filteredRooms.length === 0) roomGrid.innerHTML = '<p class="section-desc">Aucune room ne correspond à la recherche.</p>';
      else roomGrid.querySelectorAll('[data-room-id]').forEach(card => {
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
      return '<li><button type="button" class="docs-list-btn" data-doc-file="' + escapeHtml(e.file) + '" data-doc-name="' + escapeHtml(e.name) + '">' + escapeHtml(e.name) + '</button></li>';
    }).join('');
  }

  function openDocInViewer(file, name) {
    var placeholder = document.getElementById('docs-viewer-placeholder');
    var contentEl = document.getElementById('docs-viewer-content');
    if (!contentEl) return;
    placeholder.classList.add('hidden');
    contentEl.classList.remove('hidden');
    contentEl.innerHTML = '<p class="docs-loading">Chargement…</p>';
    fetch('/docs/' + file)
      .then(function (r) {
        if (!r.ok) throw new Error('Document non trouvé');
        return r.text();
      })
      .then(function (md) {
        contentEl.innerHTML = (typeof marked !== 'undefined' ? marked.parse(md) : md.replace(/</g, '&lt;'))
          .replace(/<a /g, '<a target="_blank" rel="noopener" ');
        contentEl.classList.add('doc-rendered');
      })
      .catch(function () {
        contentEl.innerHTML = '<p class="docs-error">Document non disponible. Vérifiez que le lab est bien servi (ex. <code>make up</code> ou serveur avec dossier <code>docs/</code>).</p>';
      });
  }

  function renderLearningView() {
    var titleEl = document.getElementById('learning-title');
    var descEl = document.getElementById('learning-description');
    var container = document.getElementById('learning-topics');
    if (!container) return;
    if (!state.learning || !state.learning.topics) {
      if (titleEl) titleEl.textContent = 'Documentation & Cours';
      if (descEl) descEl.textContent = 'Chargement…';
      container.innerHTML = '<p>Chargement des ressources…</p>';
      return;
    }
    if (titleEl) titleEl.textContent = state.learning.title || 'Documentation & Cours';
    if (descEl) descEl.textContent = state.learning.description || '';
    container.innerHTML = state.learning.topics.map(function (t) {
      var contentBlock = (t.content ? '<div class="learning-topic-content">' + escapeHtml(t.content) + '</div>' : '');
      var subcats = (t.subcategories || []).map(function (sc) {
        return '<li class="learning-subcat"><strong>' + escapeHtml(sc.name) + '</strong>' + (sc.content ? '<p class="learning-subcat-content">' + escapeHtml(sc.content) + '</p>' : '') + '</li>';
      }).join('');
      var subcatBlock = subcats ? '<h4 class="learning-subcats-title">Sous-catégories</h4><ul class="learning-subcats">' + subcats + '</ul>' : '';
      var docLinks = (t.documentation || []).map(function (d) {
        return '<a href="' + escapeHtml(d.url) + '" target="_blank" rel="noopener nofollow" class="learning-link">' + escapeHtml(d.label) + '</a>' + (d.desc ? ' <span class="learning-desc">' + escapeHtml(d.desc) + '</span>' : '');
      }).join('');
      var courseLinks = (t.courses || []).map(function (c) {
        return '<a href="' + escapeHtml(c.url) + '" target="_blank" rel="noopener nofollow" class="learning-link">' + escapeHtml(c.label) + '</a>' + (c.desc ? ' <span class="learning-desc">' + escapeHtml(c.desc) + '</span>' : '');
      }).join('');
      var toolList = (t.tools || []).map(function (tool) {
        return '<li><strong>' + escapeHtml(tool.name) + '</strong>' + (tool.url ? ' – <a href="' + escapeHtml(tool.url) + '" target="_blank" rel="noopener nofollow">Lien</a>' : '') + (tool.desc ? ' – ' + escapeHtml(tool.desc) : '') + '</li>';
      }).join('');
      return '<article class="learning-topic" id="learning-topic-' + escapeHtml(t.id) + '">' +
        '<h3 class="learning-topic-title">' + (t.icon || '') + ' ' + escapeHtml(t.name) + '</h3>' +
        (t.short ? '<p class="learning-topic-short">' + escapeHtml(t.short) + '</p>' : '') +
        contentBlock +
        subcatBlock +
        '<h4>Documentation</h4><div class="learning-links">' + (docLinks || '<span class="text-muted">—</span>') + '</div>' +
        '<h4>Cours complets</h4><div class="learning-links">' + (courseLinks || '<span class="text-muted">—</span>') + '</div>' +
        '<h4>Outils</h4><ul class="learning-tools">' + (toolList || '<li class="text-muted">—</li>') + '</ul>' +
        '</article>';
    }).join('');
  }

  function renderEngagementsView() {
    var data = getEngagementData();
    var proxyEl = document.getElementById('engagement-proxy-notes');
    var notesEl = document.getElementById('engagement-notes');
    var listEl = document.getElementById('engagement-targets-list');
    if (proxyEl) proxyEl.value = data.proxyNotes;
    if (notesEl) notesEl.value = data.notes;
    if (listEl) {
      listEl.innerHTML = (data.targets || []).map(function (t, i) {
        return '<li class="engagement-target-item" data-index="' + i + '">' +
          '<span class="engagement-target-name">' + escapeHtml(t.name || '') + '</span>' +
          (t.url ? ' <span class="engagement-target-url">' + escapeHtml(t.url) + '</span>' : '') +
          (t.notes ? ' <span class="engagement-target-notes">' + escapeHtml(t.notes) + '</span>' : '') +
          ' <button type="button" class="topbar-btn danger engagement-target-delete" data-index="' + i + '" title="Supprimer">Supprimer</button>' +
          '</li>';
      }).join('');
      listEl.querySelectorAll('.engagement-target-delete').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var idx = parseInt(this.dataset.index, 10);
          var d = getEngagementData();
          d.targets.splice(idx, 1);
          saveEngagementData(d);
          renderEngagementsView();
        });
      });
    }
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
      var total = (s.tasks || []).length;
      var done = total ? (s.tasks || []).filter((_, i) => isTaskDone(s.id, i)).length : 0;
      var progress = total && done > 0 ? ' <span class="nav-scenario-progress">' + done + '/' + total + '</span>' : '';
      html += '<button class="nav-item scenario-nav-item" data-scenario-id="' + s.id + '" data-view="scenario">' +
        '<span class="nav-icon" style="color:var(--accent)">◆</span>' +
        '<span class="nav-scenario-label">' + escapeHtml(s.title) + '</span>' + progress + '</button>';
    });
    container.innerHTML = html;
    container.querySelectorAll('[data-scenario-id]').forEach(btn => {
      btn.addEventListener('click', () => openScenario(btn.dataset.scenarioId));
    });
  }

  function getTerminalUrl() {
    const port = (state.config && state.config.terminalPort) || 7681;
    return window.location.protocol + '//' + window.location.hostname + ':' + port;
  }

  function initScenarioTerminal() {
    const container = document.getElementById('terminal-container');
    const statusEl = document.getElementById('terminal-connect-status');
    if (!container || !statusEl) return;
    const url = getTerminalUrl();
    statusEl.textContent = 'Chargement du terminal…';
    statusEl.className = 'terminal-status';
    var loadTimeout = setTimeout(function() {
      if (statusEl.textContent.indexOf('connecté') === -1) {
        statusEl.innerHTML = 'Si le terminal ne s\'affiche pas, <a href="' + url + '" target="_blank" rel="noopener">ouvrez-le dans un nouvel onglet</a> (make up + port ' + ((state.config && state.config.terminalPort) || 7681) + ').';
        statusEl.className = 'terminal-status error';
      }
    }, 5000);
    var iframe = container.querySelector('iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.className = 'terminal-iframe';
      iframe.title = 'Terminal attaquant (ttyd)';
      iframe.src = url;
      iframe.addEventListener('load', function() {
        clearTimeout(loadTimeout);
        statusEl.textContent = 'Terminal connecté. Vous êtes dans le conteneur attaquant.';
        statusEl.className = 'terminal-status connected';
      });
      container.appendChild(iframe);
    } else {
      iframe.src = url;
    }
    var btnNewTab = document.getElementById('terminal-open-new-tab');
    if (btnNewTab) btnNewTab.onclick = function() { window.open(getTerminalUrl(), '_blank', 'noopener'); };
  }

  function initTerminalPanelButtons() {
    var btnToggle = document.getElementById('terminal-toggle-panel');
    var panel = document.getElementById('scenario-terminal-panel');
    if (btnToggle && panel) {
      btnToggle.addEventListener('click', function() {
        panel.classList.toggle('collapsed');
        this.textContent = panel.classList.contains('collapsed') ? '+' : '−';
      });
    }
  }

  function openScenario(scenarioId) {
    state.currentScenarioId = scenarioId;
    saveLastScenario(scenarioId, null);
    showView('scenario');
    const s = (state.scenarios || []).find(x => x.id === scenarioId);
    if (!s) return;
    logEvent('platform', 'scenario_opened', { scenarioId, title: s.title });
    initScenarioTerminal();
    var termPanel = document.getElementById('scenario-terminal-panel');
    if (termPanel) termPanel.classList.remove('hidden');
    var btnTerm = document.getElementById('btn-terminal-toggle');
    if (btnTerm) btnTerm.setAttribute('title', 'Masquer le terminal');
    if ((Storage && Storage.getPipAuto()) || (!Storage && localStorage.getItem(STORAGE_PIP_AUTO) === '1')) showPipPanel(s);
    else updatePipPanel(s);

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
      const showRooms = isNote && (m.name || '').toLowerCase().indexOf('toutes') >= 0;
      if (isNote) {
        return `<div class="machine-card note-only" role="button" tabindex="0" data-machine-name="${escapeHtml(m.name || '')}" data-show-rooms="${showRooms ? '1' : '0'}">
          <span>${escapeHtml(m.name)}</span>
          ${note ? `<span class="machine-note">${escapeHtml(note)}</span>` : ''}
        </div>`;
      }
      return `<a href="${escapeHtml(url)}" class="machine-card" target="_blank" rel="noopener" data-machine-name="${escapeHtml(m.name || '')}" data-machine-url="${escapeHtml(url)}">
        <span>${escapeHtml(m.name)}</span>
        ${note ? `<span class="machine-note">${escapeHtml(note)}</span>` : ''}
      </a>`;
    }).join('');
    machinesEl.querySelectorAll('.machine-card.note-only[data-show-rooms="1"]').forEach(el => {
      el.addEventListener('click', function() { showView('dashboard'); });
      el.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showView('dashboard'); } });
    });
    machinesEl.querySelectorAll('a.machine-card').forEach(a => {
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
        saveLastScenario(scenarioId, idx);
        const item = this.closest('.task-item');
        if (item) item.classList.toggle('done', this.checked);
        const s = state.scenarios.find(x => x.id === scenarioId);
        if (s) updatePipPanel(s);
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

    updatePipPanel(s);
    var resumeBanner = document.getElementById('scenario-resume-banner');
    if (resumeBanner) {
      if (getLastScenario() === scenarioId) {
        var lastIdx = getLastTaskIndex();
        var firstUnchecked = (s.tasks || []).findIndex((_, i) => !isTaskDone(scenarioId, i));
        var scrollTo = firstUnchecked >= 0 ? firstUnchecked : (lastIdx != null ? lastIdx : 0);
        var taskNum = scrollTo + 1;
        resumeBanner.innerHTML = '↳ Reprendre à la tâche ' + taskNum + (s.tasks && s.tasks[scrollTo] ? ' : ' + escapeHtml(s.tasks[scrollTo].title) : '');
        resumeBanner.classList.remove('hidden');
        var taskEl = tasksEl.querySelector('.task-item[data-task-index="' + scrollTo + '"]');
        if (taskEl) setTimeout(function() { taskEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300);
      } else {
        resumeBanner.classList.add('hidden');
        resumeBanner.innerHTML = '';
      }
    }
  }

  function showPipPanel(s) {
    const panel = document.getElementById('pip-panel');
    if (panel) panel.classList.remove('hidden');
    updatePipPanel(s);
  }

  function hidePipPanel() {
    const panel = document.getElementById('pip-panel');
    if (panel) panel.classList.add('hidden');
  }

  function updatePipPanel(s) {
    const titleEl = document.getElementById('pip-title');
    const tasksUl = document.getElementById('pip-tasks');
    if (!titleEl || !tasksUl) return;
    if (!s) {
      titleEl.textContent = 'Scénario';
      tasksUl.innerHTML = '';
      return;
    }
    titleEl.textContent = s.title || 'Scénario';
    tasksUl.innerHTML = (s.tasks || []).map((t, i) => {
      const done = isTaskDone(s.id, i);
      return '<li class="' + (done ? 'done' : '') + '" data-task-index="' + i + '">' +
        (done ? '✓ ' : '') + escapeHtml(t.title) + '</li>';
    }).join('');
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

    var readingSection = document.getElementById('room-reading-section');
    var readingLinks = document.getElementById('room-reading-links');
    if (readingSection && readingLinks) {
      var parts = [];
      if (state.docs && state.docs.entries) {
        var catToDoc = { web: '01-WEB', network: '02-RESEAU', api: '03-APPLICATIONS', red: '04-RED-TEAM', blue: '05-BLUE-TEAM', forensics: '06-FORENSIQUE', osint: '07-OSINT', stego: '10-STEGANOGRAPHY', crypto: '11-CRYPTOGRAPHY', phishing: '12-SOCIAL' };
        var docFile = catToDoc[room.category];
        var entries = docFile ? state.docs.entries.filter(function(e) { return e.file && e.file.indexOf(docFile) >= 0; }) : [];
        if (entries.length === 0) entries = state.docs.entries.slice(0, 3);
        parts.push(entries.map(function(e) {
          return '<a href="/docs/' + escapeHtml(e.file) + '" target="_blank" rel="noopener" class="reading-link">' + escapeHtml(e.name) + '</a>';
        }).join(''));
      }
      var catSources = state.data && state.data.categorySources && state.data.categorySources[room.category];
      if (catSources && catSources.length) {
        parts.push(catSources.map(function(s) {
          return '<a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener nofollow" class="reading-link reading-link-external">' + escapeHtml(s.label) + '</a>';
        }).join(''));
      }
      readingLinks.innerHTML = parts.join('');
      readingSection.hidden = !readingLinks.innerHTML.trim();
    }

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
      const showRooms = isNote && (m.name || '').toLowerCase().indexOf('toutes') >= 0;
      if (isNote) {
        return `<div class="machine-card note-only" role="button" tabindex="0" data-machine-name="${escapeHtml(m.name || '')}" data-show-rooms="${showRooms ? '1' : '0'}">
          <span>${escapeHtml(m.name)}</span>
          ${note ? `<span class="machine-note">${escapeHtml(note)}</span>` : ''}
        </div>`;
      }
      return `<a href="${escapeHtml(url)}" class="machine-card" target="_blank" rel="noopener" data-machine-name="${escapeHtml(m.name || '')}" data-machine-url="${escapeHtml(url)}">
        <span>${escapeHtml(m.name)}</span>
        ${note ? `<span class="machine-note">${escapeHtml(note)}</span>` : ''}
      </a>`;
    }).join('');
    machinesEl.querySelectorAll('.machine-card.note-only[data-show-rooms="1"]').forEach(el => {
      el.addEventListener('click', function() { showView('dashboard'); });
      el.addEventListener('keydown', function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showView('dashboard'); } });
    });
    machinesEl.querySelectorAll('a.machine-card').forEach(a => {
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

  function renderStats() {
    const summaryEl = document.getElementById('stats-summary');
    const scenariosEl = document.getElementById('stats-scenarios');
    if (!summaryEl || !scenariosEl) return;
    const st = getProgressStats();
    summaryEl.innerHTML = `
      <div class="stat-box"><span class="stat-value">${st.completedScenarios}/${st.totalScenarios}</span><span class="stat-label">Scénarios terminés</span></div>
      <div class="stat-box"><span class="stat-value">${st.doneTasks}/${st.totalTasks}</span><span class="stat-label">Tâches faites</span></div>
    `;
    scenariosEl.innerHTML = st.perScenario.map(s => {
      const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
      return `<div class="stat-row">
        <span>${escapeHtml(s.title)}</span>
        <span style="min-width:3rem">${s.done}/${s.total}</span>
        <div class="progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
      </div>`;
    }).join('');
  }

  function initTopbar() {
    const searchEl = document.getElementById('search-input');
    const filterEl = document.getElementById('filter-category');
    if (filterEl && state.categories.length) {
      state.categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name || c.id;
        filterEl.appendChild(opt);
      });
    }
    if (searchEl) {
      searchEl.addEventListener('input', function() {
        state.searchQuery = this.value;
        renderDashboard();
      });
    }
    if (filterEl) {
      filterEl.addEventListener('change', function() {
        state.filterCategory = this.value || '';
        renderDashboard();
      });
    }

    const btnStats = document.getElementById('btn-stats');
    if (btnStats) btnStats.addEventListener('click', function() {
      renderStats();
      document.getElementById('modal-stats').classList.remove('hidden');
    });
    const btnOptions = document.getElementById('btn-options');
    if (btnOptions) btnOptions.addEventListener('click', function() {
      document.getElementById('opt-pip-auto').checked = Storage ? Storage.getPipAuto() : (localStorage.getItem(STORAGE_PIP_AUTO) === '1');
      document.getElementById('modal-options').classList.remove('hidden');
    });
    const btnPip = document.getElementById('btn-pip-toggle');
    if (btnPip) btnPip.addEventListener('click', function() {
      const panel = document.getElementById('pip-panel');
      if (panel.classList.contains('hidden')) {
        const s = state.currentScenarioId ? state.scenarios.find(x => x.id === state.currentScenarioId) : null;
        if (s) showPipPanel(s);
        else if (state.scenarios.length) showPipPanel(state.scenarios[0]);
        else panel.classList.remove('hidden');
      } else hidePipPanel();
    });

    var btnSidebar = document.getElementById('btn-sidebar-toggle');
    function updateSidebarButton() {
      if (!btnSidebar) return;
      var app = document.querySelector('.app');
      var isMobile = window.innerWidth <= 768;
      if (isMobile) {
        app.classList.remove('sidebar-collapsed');
        btnSidebar.setAttribute('aria-label', app.classList.contains('sidebar-open') ? 'Fermer le menu' : 'Ouvrir le menu');
        btnSidebar.title = app.classList.contains('sidebar-open') ? 'Fermer le menu' : 'Ouvrir le menu';
        btnSidebar.textContent = '☰';
      } else {
        app.classList.remove('sidebar-open');
        btnSidebar.setAttribute('aria-label', app.classList.contains('sidebar-collapsed') ? 'Afficher le menu' : 'Réduire le menu');
        btnSidebar.title = app.classList.contains('sidebar-collapsed') ? 'Afficher le menu' : 'Réduire le menu';
        btnSidebar.textContent = '☰';
      }
      var brandText = document.getElementById('topbar-brand-text');
      if (brandText) brandText.textContent = 'Lab Cyber';
    }
    if (btnSidebar) {
      btnSidebar.addEventListener('click', function() {
        var app = document.querySelector('.app');
        if (window.innerWidth <= 768) app.classList.toggle('sidebar-open');
        else app.classList.toggle('sidebar-collapsed');
        updateSidebarButton();
      });
      window.addEventListener('resize', updateSidebarButton);
      updateSidebarButton();
    }

    var btnTerminal = document.getElementById('btn-terminal-toggle');
    if (btnTerminal) btnTerminal.addEventListener('click', function() {
      var scenarioView = document.getElementById('view-scenario');
      var terminalPanel = document.getElementById('scenario-terminal-panel');
      if (scenarioView && scenarioView.classList.contains('active') && terminalPanel) {
        terminalPanel.classList.toggle('hidden');
        this.setAttribute('title', terminalPanel.classList.contains('hidden') ? 'Afficher le terminal' : 'Masquer le terminal');
      } else {
        window.open(getTerminalUrl(), '_blank', 'noopener');
      }
    });

    document.getElementById('pip-close') && document.getElementById('pip-close').addEventListener('click', hidePipPanel);
    document.getElementById('modal-stats-close') && document.getElementById('modal-stats-close').addEventListener('click', function() {
      document.getElementById('modal-stats').classList.add('hidden');
    });
    document.getElementById('modal-options-close') && document.getElementById('modal-options-close').addEventListener('click', function() {
      document.getElementById('modal-options').classList.add('hidden');
    });
    document.getElementById('modal-stats') && document.getElementById('modal-stats').addEventListener('click', function(e) {
      if (e.target === this) this.classList.add('hidden');
    });
    document.getElementById('modal-options') && document.getElementById('modal-options').addEventListener('click', function(e) {
      if (e.target === this) this.classList.add('hidden');
    });

    const optPipAuto = document.getElementById('opt-pip-auto');
    if (optPipAuto) optPipAuto.addEventListener('change', function() {
      if (Storage) Storage.setPipAuto(this.checked); else localStorage.setItem(STORAGE_PIP_AUTO, this.checked ? '1' : '0');
    });
    const optExport = document.getElementById('opt-export-progress');
    if (optExport) optExport.addEventListener('click', function() {
      const progress = {};
      (state.scenarios || []).forEach(s => {
        progress[s.id] = (s.tasks || []).map((_, i) => isTaskDone(s.id, i));
      });
      const data = { lastScenario: getLastScenario(), lastTask: getLastTaskIndex(), progress, exportedAt: new Date().toISOString() };
      const a = document.createElement('a');
      a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      a.download = 'labcyber-progress-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
    });
    const optReset = document.getElementById('opt-reset-progress');
    if (optReset) optReset.addEventListener('click', function() {
      if (confirm('Réinitialiser toute la progression (tâches cochées, scénario en cours) ?')) {
        if (Storage) Storage.clearProgress();
        else {
          (state.scenarios || []).forEach(s => {
            (s.tasks || []).forEach((_, i) => localStorage.removeItem(getTaskDoneKey(s.id, i)));
          });
          localStorage.removeItem(STORAGE_LAST_SCENARIO);
          localStorage.removeItem(STORAGE_LAST_TASK);
        }
        renderDashboard();
        if (state.currentScenarioId) openScenario(state.currentScenarioId);
        document.getElementById('modal-options').classList.add('hidden');
      }
    });

    var engForm = document.getElementById('engagement-target-form');
    if (engForm) engForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var nameEl = document.getElementById('engagement-target-name');
      var urlEl = document.getElementById('engagement-target-url');
      var notesEl = document.getElementById('engagement-target-notes');
      var name = nameEl && nameEl.value ? nameEl.value.trim() : '';
      if (!name) return;
      var d = getEngagementData();
      d.targets.push({ name: name, url: (urlEl && urlEl.value) ? urlEl.value.trim() : '', notes: (notesEl && notesEl.value) ? notesEl.value.trim() : '' });
      saveEngagementData(d);
      if (nameEl) nameEl.value = '';
      if (urlEl) urlEl.value = '';
      if (notesEl) notesEl.value = '';
      renderEngagementsView();
    });
    var engProxyNotes = document.getElementById('engagement-proxy-notes');
    if (engProxyNotes) engProxyNotes.addEventListener('change', function() {
      var d = getEngagementData();
      d.proxyNotes = this.value;
      saveEngagementData(d);
    });
    var engNotes = document.getElementById('engagement-notes');
    if (engNotes) engNotes.addEventListener('change', function() {
      var d = getEngagementData();
      d.notes = this.value;
      saveEngagementData(d);
    });
    var proxyCheckBtn = document.getElementById('proxy-check-btn');
    var proxyCheckResult = document.getElementById('proxy-check-result');
    if (proxyCheckBtn && proxyCheckResult) proxyCheckBtn.addEventListener('click', function() {
      var raw = (document.getElementById('proxy-list-input') || {}).value || '';
      var lines = raw.split(/\n/).map(function(l) { return l.trim(); }).filter(Boolean);
      if (lines.length === 0) {
        proxyCheckResult.textContent = 'Collez une liste de proxies (un par ligne).';
        return;
      }
      proxyCheckResult.textContent = 'À venir : vérification opérationnelle et vitesse (à brancher sur script/API ou cyberman). ' + lines.length + ' proxy(s) saisi(s).';
    });
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
        this.textContent = panel.classList.contains('collapsed') ? '📋' : '−';
        this.setAttribute('title', panel.classList.contains('collapsed') ? 'Agrandir le journal' : 'Réduire le journal');
        updateLogToggleButton();
      }
    });

    function updateLogToggleButton() {
      var panel = document.getElementById('log-panel');
      var btn = document.getElementById('btn-log-toggle');
      if (!panel || !btn) return;
      var collapsed = panel.classList.contains('collapsed');
      btn.setAttribute('title', collapsed ? 'Ouvrir le journal d\'activité' : 'Fermer le journal d\'activité');
      btn.textContent = collapsed ? '📋 Journal' : '📋 Fermer journal';
    }

    var btnLogToggle = document.getElementById('btn-log-toggle');
    if (btnLogToggle) btnLogToggle.addEventListener('click', function () {
      var panel = document.getElementById('log-panel');
      if (panel) {
        panel.classList.toggle('collapsed');
        var innerToggle = document.getElementById('log-panel-toggle');
        if (innerToggle) innerToggle.textContent = panel.classList.contains('collapsed') ? '📋' : '−';
        updateLogToggleButton();
      }
    });

    var logFab = document.getElementById('log-fab');
    if (logFab) logFab.addEventListener('click', function () {
      var panel = document.getElementById('log-panel');
      if (panel) {
        panel.classList.remove('collapsed');
        var innerToggle = document.getElementById('log-panel-toggle');
        if (innerToggle) innerToggle.textContent = '−';
        updateLogToggleButton();
      }
    });

    updateLogToggleButton();
    var panel = document.getElementById('log-panel');
    var innerToggle = document.getElementById('log-panel-toggle');
    if (panel && innerToggle) innerToggle.textContent = panel.classList.contains('collapsed') ? '📋' : '−';
  }

  function init() {
    if (log) logEvent('platform', 'app_init', {});
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      if (item.dataset.roomId || item.dataset.scenarioId) return;
      item.addEventListener('click', () => showView(item.dataset.view));
    });

    var viewDocs = document.getElementById('view-docs');
    if (viewDocs) viewDocs.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-doc-file]');
      if (btn) openDocInViewer(btn.dataset.docFile, btn.dataset.docName || btn.dataset.docFile);
    });

    loadData().then(() => {
      initTopbar();
      initTerminalPanelButtons();
      initPipResize();
      renderDashboard();
      renderNavRooms();
      renderNavScenarios();
      updateTopbarContext();
      initLogPanel();
      updatePipButtonVisibility(document.querySelector('.view.active') ? document.querySelector('.view.active').id.replace('view-', '') : 'dashboard');
    });
  }

  function initPipResize() {
    var panel = document.getElementById('pip-panel');
    var handle = document.getElementById('pip-resize-handle');
    if (!panel || !handle) return;
    var startX, startY, startW, startH;
    handle.addEventListener('mousedown', function (e) {
      e.preventDefault();
      startX = e.clientX;
      startY = e.clientY;
      startW = panel.offsetWidth;
      startH = panel.offsetHeight;
      function move(e) {
        var w = Math.max(220, Math.min(600, startW + e.clientX - startX));
        var h = Math.max(180, Math.min(500, startH + e.clientY - startY));
        panel.style.width = w + 'px';
        panel.style.maxHeight = h + 'px';
      }
      function up() {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
      }
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
  }

  init();
})();
