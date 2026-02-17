/**
 * Système de logs Lab Cyber – réutilisable partout.
 * Format : { ts, level, component, action, message, details }
 * Stockage : mémoire + localStorage (optionnel), export JSON.
 * Utilisé par : index-static.html (Docker) ; copie dans public/ pour l'app Preact (make dev).
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'labcyber-logs';
  const MAX_ENTRIES = 1000;
  const MAX_ENTRIES_MEMORY = 500;

  const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
  const Storage = typeof global !== 'undefined' && global.LabCyberStorage ? global.LabCyberStorage : null;

  function isoNow() {
    return new Date().toISOString();
  }

  function makeEntry(level, component, action, message, details) {
    return {
      ts: isoNow(),
      level: level || 'INFO',
      component: component || 'platform',
      action: action || '',
      message: message || '',
      details: details != null ? details : {}
    };
  }

  let memory = [];
  let persist = true;

  function loadFromStorage() {
    if (Storage) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        memory = Array.isArray(arr) ? arr.slice(-MAX_ENTRIES) : [];
      }
    } catch (e) {
      memory = [];
    }
  }

  function saveToStorage() {
    if (!persist) return;
    if (Storage) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memory.slice(-MAX_ENTRIES)));
    } catch (e) {}
  }

  function append(entry) {
    memory.push(entry);
    if (memory.length > MAX_ENTRIES_MEMORY) memory = memory.slice(-MAX_ENTRIES_MEMORY);
    if (Storage) Storage.appendLog(entry).catch(function () {});
    else saveToStorage();
    if (typeof global.dispatchEvent === 'function') {
      try {
        global.dispatchEvent(new CustomEvent('labcyber-log', { detail: entry }));
      } catch (e) {}
    }
  }

  function log(level, component, action, message, details) {
    const entry = makeEntry(level, component, action, message, details);
    append(entry);
    if (level === 'ERROR' && global.console && global.console.error) {
      global.console.error('[LabCyber]', entry);
    }
    return entry;
  }

  const Logger = {
    /** Activer/désactiver la persistance localStorage */
    setPersist: function (value) { persist = !!value; },

    DEBUG: function (component, action, message, details) {
      return log('DEBUG', component, action, message, details);
    },
    INFO: function (component, action, message, details) {
      return log('INFO', component, action, message, details);
    },
    WARN: function (component, action, message, details) {
      return log('WARN', component, action, message, details);
    },
    ERROR: function (component, action, message, details) {
      return log('ERROR', component, action, message, details);
    },

    /** Raccourci : component + action + détails optionnels */
    event: function (component, action, details) {
      return log('INFO', component, action, action, details || {});
    },

    /** Tous les entrées en mémoire (ordre chronologique) */
    getEntries: function () {
      return memory.slice();
    },

    /** Export JSON (pour sauvegarde / analyse) */
    exportAsJson: function () {
      return JSON.stringify(memory.slice(), null, 2);
    },

    /** Export texte lisible */
    exportAsText: function () {
      return memory.slice().map(function (e) {
        return '[' + e.ts + '] [' + e.level + '] [' + e.component + '] ' + (e.action ? e.action + ' ' : '') + e.message + (Object.keys(e.details || {}).length ? ' ' + JSON.stringify(e.details) : '');
      }).join('\n');
    },

    /** Effacer les logs en mémoire et au stockage */
    clear: function () {
      memory = [];
      if (Storage) Storage.clearLogs().catch(function () {});
      else try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    },

    /** Réinitialiser depuis le stockage (après rechargement page) */
    load: loadFromStorage,

    /** Hydrater la mémoire depuis IndexedDB (appelé après Storage.ready()) */
    hydrateFromStorage: function () {
      if (!Storage) return Promise.resolve();
      return Storage.ready().then(function () {
        memory = Storage.getLogs().slice();
        if (memory.length > MAX_ENTRIES_MEMORY) memory = memory.slice(-MAX_ENTRIES_MEMORY);
      });
    }
  };

  if (Storage) { /* app appellera hydrateFromStorage après Storage.ready() */ }
  else loadFromStorage();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Logger;
  } else {
    global.LabCyberLogger = Logger;
  }
})(typeof window !== 'undefined' ? window : this);
