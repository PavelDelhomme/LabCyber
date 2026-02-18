/**
 * Lab Cyber – Stockage structuré IndexedDB (performance, volume, pas de JSON brut).
 * Remplace localStorage : données structurées, écritures asynchrones, pas de blocage UI.
 * Utilisé par : index-static.html (Docker) ; copie dans public/ pour l'app Preact (make dev).
 */
(function (global) {
  'use strict';

  const DB_NAME = 'labcyber-db';
  const DB_VERSION = 1;
  const STORE_DATA = 'data';
  const STORE_LOGS = 'logs';
  const MAX_LOGS = 1000;

  const KV_LAST_SCENARIO = 'lastScenario';
  const KV_LAST_TASK = 'lastTask';
  const KV_PIP_AUTO = 'pipAuto';
  const KEY_ENGAGEMENT = 'engagement';
  const KEY_TASK_DONE_MAP = 'taskDoneMap';
  const KEY_SCENARIO_STATUS = 'scenarioStatus';
  const KEY_CHALLENGES_DONE = 'challengesDone';
  const KEY_LABS = 'labs';
  const KEY_CURRENT_LAB = 'currentLabId';
  const KEY_TOPOLOGIES = 'topologies';
  const KEY_TERMINAL_HISTORY = 'terminalHistory';
  const KEY_UI_SESSION = 'uiSession';
  const KEY_CAPTURE_META_PREFIX = 'captureMeta_';
  const KEY_CAPTURE_BLOB_PREFIX = 'captureBlob_';
  const KEY_CAPTURE_SESSIONS_LIST_PREFIX = 'captureSessionsList_';
  const KEY_CAPTURE_SESSION_META_PREFIX = 'captureSessionMeta_';
  const KEY_CAPTURE_SESSION_BLOB_PREFIX = 'captureSessionBlob_';
  const KEY_NETWORK_SIMULATIONS = 'networkSimulations';
  const KEY_PROXIES = 'proxies';
  const KEY_REQUEST_DATA = 'requestData';
  const KEY_LAB_NOTES = 'labNotes';
  const MAX_TERMINAL_HISTORY = 500;

  const LEGACY_KEYS = {
    'labcyber-last-scenario': KV_LAST_SCENARIO,
    'labcyber-last-task': KV_LAST_TASK,
    'labcyber-pip-auto': KV_PIP_AUTO,
    'labcyber-engagement': KEY_ENGAGEMENT
  };

  let db = null;
  let cache = {
    lastScenario: null,
    lastTask: null,
    pipAuto: false,
    engagement: null,
    taskDoneMap: Object.create(null),
    scenarioStatus: {},
    challengesDone: [],
    labs: [],
    currentLabId: null,
    topologies: {},
    logs: [],
    terminalHistory: [],
    uiSession: null,
    networkSimulations: {},
    proxies: {},
    requestData: {},
    labNotes: {}
  };
  let readyPromise = null;
  let writeQueue = [];

  function openDB() {
    return new Promise(function (resolve, reject) {
      const req = global.indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = function () { reject(req.error); };
      req.onsuccess = function () { resolve(req.result); };
      req.onupgradeneeded = function (e) {
        const database = e.target.result;
        if (!database.objectStoreNames.contains(STORE_DATA)) {
          database.createObjectStore(STORE_DATA, { keyPath: 'k' });
        }
        if (!database.objectStoreNames.contains(STORE_LOGS)) {
          const logStore = database.createObjectStore(STORE_LOGS, { keyPath: 'id', autoIncrement: true });
          logStore.createIndex('ts', 'ts', { unique: false });
        }
      };
    });
  }

  function getStore(name, mode) {
    if (!db) return null;
    return db.transaction([name], mode).objectStore(name);
  }

  function getData(store, key) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction([STORE_DATA], 'readonly');
      const os = tx.objectStore(STORE_DATA);
      const req = os.get(key);
      req.onsuccess = function () { resolve(req.result ? req.result.v : undefined); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function setData(store, key, value) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction([STORE_DATA], 'readwrite');
      const os = tx.objectStore(STORE_DATA);
      const req = os.put({ k: key, v: value });
      req.onsuccess = function () { resolve(); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function loadAllIntoCache() {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction([STORE_DATA], 'readonly');
      const os = tx.objectStore(STORE_DATA);
      const req = os.getAll();
      req.onsuccess = function () {
        const rows = req.result || [];
        rows.forEach(function (row) {
          switch (row.k) {
            case KV_LAST_SCENARIO: cache.lastScenario = row.v != null ? row.v : null; break;
            case KV_LAST_TASK: cache.lastTask = row.v != null ? row.v : null; break;
            case KV_PIP_AUTO: cache.pipAuto = row.v === true || row.v === '1'; break;
            case KEY_ENGAGEMENT: cache.engagement = row.v; break;
            case KEY_TASK_DONE_MAP: cache.taskDoneMap = row.v && typeof row.v === 'object' ? row.v : {}; break;
            case KEY_SCENARIO_STATUS: cache.scenarioStatus = row.v && typeof row.v === 'object' ? row.v : {}; break;
            case KEY_CHALLENGES_DONE: cache.challengesDone = Array.isArray(row.v) ? row.v : []; break;
            case KEY_LABS: cache.labs = Array.isArray(row.v) ? row.v : []; break;
            case KEY_CURRENT_LAB: cache.currentLabId = row.v != null ? row.v : null; break;
            case KEY_TOPOLOGIES: cache.topologies = row.v && typeof row.v === 'object' ? row.v : {}; break;
            case KEY_TERMINAL_HISTORY: cache.terminalHistory = Array.isArray(row.v) ? row.v : []; break;
            case KEY_UI_SESSION: cache.uiSession = row.v && typeof row.v === 'object' ? row.v : null; break;
            case KEY_NETWORK_SIMULATIONS: cache.networkSimulations = row.v && typeof row.v === 'object' ? row.v : {}; break;
            case KEY_PROXIES: cache.proxies = row.v && typeof row.v === 'object' ? row.v : {}; break;
            case KEY_REQUEST_DATA: cache.requestData = row.v && typeof row.v === 'object' ? row.v : {}; break;
            case KEY_LAB_NOTES: cache.labNotes = row.v && typeof row.v === 'object' ? row.v : {}; break;
            default: break;
          }
        });
        resolve();
      };
      req.onerror = function () { reject(req.error); };
    });
  }

  function loadLogsIntoCache() {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction([STORE_LOGS], 'readonly');
      const os = tx.objectStore(STORE_LOGS);
      const idx = os.index('ts');
      const req = idx.openCursor(null, 'prev');
      const entries = [];
      req.onsuccess = function (e) {
        const cursor = e.target.result;
        if (cursor && entries.length < MAX_LOGS) {
          entries.push({ ts: cursor.value.ts, level: cursor.value.level, component: cursor.value.component, action: cursor.value.action, message: cursor.value.message, details: cursor.value.details });
          cursor.continue();
        } else {
          cache.logs = entries.reverse();
          resolve();
        }
      };
      req.onerror = function () { reject(req.error); };
    });
  }

  function migrateFromLocalStorage() {
    try {
      var migrated = false;
      Object.keys(LEGACY_KEYS).forEach(function (legacyKey) {
        var val = global.localStorage.getItem(legacyKey);
        if (val == null) return;
        var idbKey = LEGACY_KEYS[legacyKey];
        var v = val;
        if (legacyKey === 'labcyber-engagement') {
          try { v = JSON.parse(val); } catch (e) { v = { targets: [], proxyNotes: '', notes: '' }; }
        } else if (legacyKey === 'labcyber-pip-auto') {
          v = val === '1';
        }
        if (idbKey === KEY_ENGAGEMENT) cache.engagement = v;
        else if (idbKey === KV_LAST_SCENARIO) cache.lastScenario = v;
        else if (idbKey === KV_LAST_TASK) cache.lastTask = v;
        else if (idbKey === KV_PIP_AUTO) cache.pipAuto = v === '1';
        setData(STORE_DATA, idbKey, v).then(function () {
          global.localStorage.removeItem(legacyKey);
        }).catch(function () {});
        migrated = true;
      });
      var raw = global.localStorage.getItem('labcyber-logs');
      if (raw && cache.logs.length === 0) {
        try {
          var arr = JSON.parse(raw);
          if (Array.isArray(arr) && arr.length) {
            var toStore = arr.slice(-MAX_LOGS);
            toStore.forEach(function (entry) {
              cache.logs.push(entry);
            });
            var tx = db.transaction([STORE_LOGS], 'readwrite');
            var os = tx.objectStore(STORE_LOGS);
            toStore.forEach(function (entry) {
              os.add(entry);
            });
            global.localStorage.removeItem('labcyber-logs');
          }
        } catch (e) {}
      }
      var keys = [];
      try { keys = Object.keys(global.localStorage); } catch (e) { return; }
      keys.forEach(function (k) {
        if (k.indexOf('labcyber-done-') === 0 && global.localStorage.getItem(k) === '1') {
          var rest = k.replace('labcyber-done-', '');
          var lastTask = rest.lastIndexOf('-task-');
          if (lastTask === -1) return;
          var sid = rest.slice(0, lastTask);
          var idx = parseInt(rest.slice(lastTask + 6), 10);
          if (!isNaN(idx)) cache.taskDoneMap[sid + ':' + idx] = true;
          global.localStorage.removeItem(k);
        }
      });
      if (Object.keys(cache.taskDoneMap).length) {
        setData(STORE_DATA, KEY_TASK_DONE_MAP, cache.taskDoneMap).catch(function () {});
      }
    } catch (e) {}
  }

  function flushWriteQueue() {
    if (writeQueue.length === 0) return Promise.resolve();
    var q = writeQueue.slice();
    writeQueue = [];
    return Promise.all(q).catch(function () {});
  }

  function init() {
    if (readyPromise) return readyPromise;
    readyPromise = openDB()
      .then(function (database) {
        db = database;
        return loadAllIntoCache();
      })
      .then(function () { return loadLogsIntoCache(); })
      .then(function () {
        migrateFromLocalStorage();
        return flushWriteQueue();
      })
      .then(function () {
        if (cache.engagement == null) cache.engagement = { targets: [], proxies: [], proxyNotes: '', notes: '' };
        return true;
      });
    return readyPromise;
  }

  var Storage = {
    ready: function () { return init(); },

    getLastScenario: function () { return cache.lastScenario; },
    setLastScenario: function (id) {
      cache.lastScenario = id || null;
      writeQueue.push(setData(STORE_DATA, KV_LAST_SCENARIO, cache.lastScenario));
    },

    getLastTaskIndex: function () { return cache.lastTask != null ? parseInt(cache.lastTask, 10) : null; },
    setLastTaskIndex: function (idx) {
      cache.lastTask = idx != null ? String(idx) : null;
      writeQueue.push(setData(STORE_DATA, KV_LAST_TASK, cache.lastTask));
    },

    getPipAuto: function () { return cache.pipAuto; },
    setPipAuto: function (value) {
      cache.pipAuto = !!value;
      writeQueue.push(setData(STORE_DATA, KV_PIP_AUTO, cache.pipAuto));
    },

    getEngagement: function () {
      if (cache.engagement == null) return { targets: [], proxies: [], proxyNotes: '', notes: '', sessions: [] };
      var e = cache.engagement;
      return {
        targets: (e.targets || []).slice(),
        proxies: (e.proxies || []).slice(),
        proxyNotes: e.proxyNotes || '',
        notes: e.notes || '',
        dataCollected: e.dataCollected || '',
        sessions: Array.isArray(e.sessions) ? e.sessions.map(function (s) { return { id: s.id, name: s.name, tag: s.tag, targets: (s.targets || []).slice(), proxies: (s.proxies || []).slice(), proxyNotes: s.proxyNotes || '', notes: s.notes || '', dataCollected: s.dataCollected || '', createdAt: s.createdAt }; }) : []
      };
    },
    setEngagement: function (data) {
      cache.engagement = {
        targets: data.targets || [],
        proxies: data.proxies || [],
        proxyNotes: data.proxyNotes || '',
        notes: data.notes || '',
        dataCollected: data.dataCollected || '',
        sessions: Array.isArray(data.sessions) ? data.sessions.map(function (s) { return { id: s.id, name: s.name, tag: s.tag, targets: (s.targets || []).slice(), proxies: (s.proxies || []).slice(), proxyNotes: s.proxyNotes || '', notes: s.notes || '', dataCollected: s.dataCollected || '', createdAt: s.createdAt }; }) : []
      };
      writeQueue.push(setData(STORE_DATA, KEY_ENGAGEMENT, cache.engagement));
    },

    getTaskDone: function (scenarioId, taskIndex) {
      return !!(cache.taskDoneMap[scenarioId + ':' + taskIndex]);
    },
    setTaskDone: function (scenarioId, taskIndex, done) {
      var key = scenarioId + ':' + taskIndex;
      if (done) cache.taskDoneMap[key] = true;
      else delete cache.taskDoneMap[key];
      writeQueue.push(setData(STORE_DATA, KEY_TASK_DONE_MAP, cache.taskDoneMap));
    },

    getScenarioStatus: function (scenarioId) {
      var status = (cache.scenarioStatus && cache.scenarioStatus[scenarioId]) || 'not_started';
      return (status === 'in_progress' || status === 'completed' || status === 'abandoned' || status === 'paused') ? status : 'not_started';
    },
    setScenarioStatus: function (scenarioId, status) {
      if (!cache.scenarioStatus) cache.scenarioStatus = {};
      if (status === 'not_started') delete cache.scenarioStatus[scenarioId];
      else cache.scenarioStatus[scenarioId] = status;
      writeQueue.push(setData(STORE_DATA, KEY_SCENARIO_STATUS, cache.scenarioStatus));
    },

    getChallengesDone: function () {
      return Array.isArray(cache.challengesDone) ? cache.challengesDone.slice() : [];
    },
    setChallengeDone: function (challengeId, done) {
      if (!Array.isArray(cache.challengesDone)) cache.challengesDone = [];
      var idx = cache.challengesDone.indexOf(challengeId);
      if (done && idx === -1) cache.challengesDone.push(challengeId);
      else if (!done && idx !== -1) cache.challengesDone.splice(idx, 1);
      writeQueue.push(setData(STORE_DATA, KEY_CHALLENGES_DONE, cache.challengesDone));
    },

    getLabs: function () { return Array.isArray(cache.labs) ? cache.labs.slice() : []; },
    setLabs: function (arr) {
      cache.labs = Array.isArray(arr) ? arr.slice() : [];
      writeQueue.push(setData(STORE_DATA, KEY_LABS, cache.labs));
    },
    getCurrentLabId: function () { return cache.currentLabId; },
    setCurrentLabId: function (id) {
      cache.currentLabId = id != null ? id : null;
      writeQueue.push(setData(STORE_DATA, KEY_CURRENT_LAB, cache.currentLabId));
    },
    getTopologies: function () { return cache.topologies && typeof cache.topologies === 'object' ? Object.assign({}, cache.topologies) : {}; },
    setTopology: function (labId, data) {
      if (!cache.topologies || typeof cache.topologies !== 'object') cache.topologies = {};
      cache.topologies[labId] = data;
      writeQueue.push(setData(STORE_DATA, KEY_TOPOLOGIES, cache.topologies));
    },

    getTerminalHistory: function () {
      return Array.isArray(cache.terminalHistory) ? cache.terminalHistory.slice() : [];
    },
    appendTerminalHistory: function (entry) {
      if (!Array.isArray(cache.terminalHistory)) cache.terminalHistory = [];
      cache.terminalHistory.push({ id: String(Date.now()), ts: new Date().toISOString(), text: entry.text || '' });
      if (cache.terminalHistory.length > MAX_TERMINAL_HISTORY) cache.terminalHistory = cache.terminalHistory.slice(-MAX_TERMINAL_HISTORY);
      writeQueue.push(setData(STORE_DATA, KEY_TERMINAL_HISTORY, cache.terminalHistory));
    },
    clearTerminalHistory: function () {
      cache.terminalHistory = [];
      writeQueue.push(setData(STORE_DATA, KEY_TERMINAL_HISTORY, cache.terminalHistory));
    },

    getUiSession: function () {
      if (cache.uiSession && typeof cache.uiSession === 'object') return Object.assign({}, cache.uiSession);
      return null;
    },
    setUiSession: function (obj) {
      if (!obj || typeof obj !== 'object') { cache.uiSession = null; writeQueue.push(setData(STORE_DATA, KEY_UI_SESSION, null)); return; }
      cache.uiSession = {
        terminalPanelOpen: !!obj.terminalPanelOpen,
        labPanelOpen: !!obj.labPanelOpen,
        capturePanelOpen: !!obj.capturePanelOpen,
        terminalTabs: Array.isArray(obj.terminalTabs) && obj.terminalTabs.length > 0 ? obj.terminalTabs : undefined,
        activeTerminalTabId: obj.activeTerminalTabId != null ? obj.activeTerminalTabId : undefined,
        terminalPanelMinimized: !!obj.terminalPanelMinimized,
        terminalPanelWidth: typeof obj.terminalPanelWidth === 'number' && obj.terminalPanelWidth >= 320 ? obj.terminalPanelWidth : undefined
      };
      writeQueue.push(setData(STORE_DATA, KEY_UI_SESSION, cache.uiSession));
    },

    getCaptureState: function (labId) {
      if (!db || !labId) return Promise.resolve(null);
      var metaKey = KEY_CAPTURE_META_PREFIX + labId;
      var blobKey = KEY_CAPTURE_BLOB_PREFIX + labId;
      return Promise.all([getData(null, metaKey), getData(null, blobKey)]).then(function (results) {
        var meta = results[0];
        var blob = results[1];
        if (!meta && !blob) return null;
        return Object.assign({ blob: blob || null }, meta || {});
      });
    },
    setCaptureState: function (labId, state) {
      if (!labId || !state) return;
      var metaKey = KEY_CAPTURE_META_PREFIX + labId;
      var blobKey = KEY_CAPTURE_BLOB_PREFIX + labId;
      var meta = { fileName: state.fileName || '', selectedIndex: state.selectedIndex != null ? state.selectedIndex : 0, filter: state.filter || '' };
      writeQueue.push(setData(STORE_DATA, metaKey, meta));
      writeQueue.push(setData(STORE_DATA, blobKey, state.blob != null ? state.blob : null));
    },

    getCaptureSessionsList: function (labId) {
      if (!labId) return Promise.resolve([]);
      return getData(null, KEY_CAPTURE_SESSIONS_LIST_PREFIX + labId).then(function (arr) { return Array.isArray(arr) ? arr : []; });
    },
    setCaptureSession: function (labId, sessionId, state) {
      if (!labId || !sessionId || !state) return;
      var listKey = KEY_CAPTURE_SESSIONS_LIST_PREFIX + labId;
      var metaKey = KEY_CAPTURE_SESSION_META_PREFIX + labId + '_' + sessionId;
      var blobKey = KEY_CAPTURE_SESSION_BLOB_PREFIX + labId + '_' + sessionId;
      var entry = { id: sessionId, name: state.name || 'Capture ' + sessionId, updatedAt: new Date().toISOString() };
      getData(null, listKey).then(function (arr) {
        var list = Array.isArray(arr) ? arr.slice() : [];
        var idx = list.findIndex(function (e) { return e.id === sessionId; });
        if (idx >= 0) list[idx] = entry; else list.push(entry);
        writeQueue.push(setData(STORE_DATA, listKey, list));
      });
      writeQueue.push(setData(STORE_DATA, metaKey, { fileName: state.fileName || '', selectedIndex: state.selectedIndex != null ? state.selectedIndex : 0, filter: state.filter || '' }));
      writeQueue.push(setData(STORE_DATA, blobKey, state.blob != null ? state.blob : null));
    },
    getCaptureSession: function (labId, sessionId) {
      if (!db || !labId || !sessionId) return Promise.resolve(null);
      var metaKey = KEY_CAPTURE_SESSION_META_PREFIX + labId + '_' + sessionId;
      var blobKey = KEY_CAPTURE_SESSION_BLOB_PREFIX + labId + '_' + sessionId;
      return Promise.all([getData(null, metaKey), getData(null, blobKey)]).then(function (results) {
        var meta = results[0];
        var blob = results[1];
        if (!meta && !blob) return null;
        return Object.assign({ blob: blob || null }, meta || {});
      });
    },
    deleteCaptureSession: function (labId, sessionId) {
      if (!labId || !sessionId) return;
      var listKey = KEY_CAPTURE_SESSIONS_LIST_PREFIX + labId;
      var metaKey = KEY_CAPTURE_SESSION_META_PREFIX + labId + '_' + sessionId;
      var blobKey = KEY_CAPTURE_SESSION_BLOB_PREFIX + labId + '_' + sessionId;
      getData(null, listKey).then(function (arr) {
        var list = (Array.isArray(arr) ? arr : []).filter(function (e) { return e.id !== sessionId; });
        writeQueue.push(setData(STORE_DATA, listKey, list));
      });
      writeQueue.push(setData(STORE_DATA, metaKey, null));
      writeQueue.push(setData(STORE_DATA, blobKey, null));
    },

    getNetworkSimulations: function (labId) {
      var raw = (cache.networkSimulations && cache.networkSimulations[labId]) || null;
      if (!raw) return { simulations: [], currentId: null };
      var sims = Array.isArray(raw.simulations) ? raw.simulations.slice() : [];
      return { simulations: sims, currentId: raw.currentId != null ? raw.currentId : (sims[0] && sims[0].id) || null };
    },
    setNetworkSimulations: function (labId, data) {
      if (!cache.networkSimulations) cache.networkSimulations = {};
      cache.networkSimulations[labId] = data;
      writeQueue.push(setData(STORE_DATA, KEY_NETWORK_SIMULATIONS, cache.networkSimulations));
    },

    getProxies: function (labId) {
      var arr = (cache.proxies && cache.proxies[labId]) || [];
      return Array.isArray(arr) ? arr.slice() : [];
    },
    setProxies: function (labId, arr) {
      if (!cache.proxies) cache.proxies = {};
      cache.proxies[labId] = Array.isArray(arr) ? arr.slice() : [];
      writeQueue.push(setData(STORE_DATA, KEY_PROXIES, cache.proxies));
    },

    getRequestData: function (labId) {
      var raw = (cache.requestData && cache.requestData[labId]) || {};
      return {
        collections: Array.isArray(raw.collections) ? raw.collections.slice() : [],
        history: Array.isArray(raw.history) ? raw.history.slice() : []
      };
    },
    setRequestData: function (labId, data) {
      if (!cache.requestData) cache.requestData = {};
      cache.requestData[labId] = { collections: data.collections || [], history: data.history || [] };
      writeQueue.push(setData(STORE_DATA, KEY_REQUEST_DATA, cache.requestData));
    },

    getLabNotes: function (labId) {
      var notes = (cache.labNotes && cache.labNotes[labId]);
      return notes != null ? String(notes) : '';
    },
    setLabNotes: function (labId, text) {
      if (!cache.labNotes) cache.labNotes = {};
      cache.labNotes[labId] = text != null ? String(text) : '';
      writeQueue.push(setData(STORE_DATA, KEY_LAB_NOTES, cache.labNotes));
    },

    getLogs: function () { return cache.logs.slice(); },
    appendLog: function (entry) {
      cache.logs.push(entry);
      if (cache.logs.length > MAX_LOGS) cache.logs = cache.logs.slice(-MAX_LOGS);
      if (!db) return Promise.resolve();
      return new Promise(function (resolve, reject) {
        var tx = db.transaction([STORE_LOGS], 'readwrite');
        var os = tx.objectStore(STORE_LOGS);
        os.add(entry);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    },
    clearLogs: function () {
      cache.logs = [];
      if (!db) return Promise.resolve();
      return new Promise(function (resolve, reject) {
        var tx = db.transaction([STORE_LOGS], 'readwrite');
        var os = tx.objectStore(STORE_LOGS);
        os.clear();
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    },

    clearProgress: function () {
      cache.taskDoneMap = Object.create(null);
      cache.scenarioStatus = {};
      cache.challengesDone = [];
      cache.lastScenario = null;
      cache.lastTask = null;
      writeQueue.push(setData(STORE_DATA, KEY_TASK_DONE_MAP, cache.taskDoneMap));
      writeQueue.push(setData(STORE_DATA, KEY_SCENARIO_STATUS, cache.scenarioStatus));
      writeQueue.push(setData(STORE_DATA, KEY_CHALLENGES_DONE, cache.challengesDone));
      writeQueue.push(setData(STORE_DATA, KV_LAST_SCENARIO, null));
      writeQueue.push(setData(STORE_DATA, KV_LAST_TASK, null));
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
  } else {
    global.LabCyberStorage = Storage;
  }
})(typeof window !== 'undefined' ? window : this);
