/**
 * Lab Cyber – Stockage structuré IndexedDB (performance, volume, pas de JSON brut).
 * Remplace localStorage : données structurées, écritures asynchrones, pas de blocage UI.
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
    logs: []
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
      if (cache.engagement == null) return { targets: [], proxies: [], proxyNotes: '', notes: '' };
      var e = cache.engagement;
      return {
        targets: (e.targets || []).slice(),
        proxies: (e.proxies || []).slice(),
        proxyNotes: e.proxyNotes || '',
        notes: e.notes || ''
      };
    },
    setEngagement: function (data) {
      cache.engagement = {
        targets: data.targets || [],
        proxies: data.proxies || [],
        proxyNotes: data.proxyNotes || '',
        notes: data.notes || ''
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
      cache.lastScenario = null;
      cache.lastTask = null;
      writeQueue.push(setData(STORE_DATA, KEY_TASK_DONE_MAP, cache.taskDoneMap));
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
