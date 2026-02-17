import { useState, useEffect, useCallback } from 'preact/hooks';

const storage = typeof window !== 'undefined' ? window.LabCyberStorage : null;

/** URL du terminal : chemin /terminal/ sur la gateway (fonctionne sans /etc/hosts) */
export function getTerminalUrl() {
  if (typeof window === 'undefined') return '#';
  const base = window.location.origin.replace(/\/$/, '');
  return `${base}/terminal/`;
}

/** URL du bureau noVNC (XFCE) : /desktop/ sur la gateway. Activer avec : make desktop */
export function getDesktopUrl() {
  if (typeof window === 'undefined') return '#';
  const base = window.location.origin.replace(/\/$/, '');
  return `${base}/desktop/`;
}

export function useStore() {
  const [data, setData] = useState({ rooms: [], categories: [] });
  const [scenarios, setScenarios] = useState([]);
  const [config, setConfig] = useState({ hostnames: {}, terminalPort: 7681 });
  const [docs, setDocs] = useState(null);
  const [learning, setLearning] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const base = typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : '';
    const get = (path) => fetch(base + path).then(r => (r.ok ? r.json() : null)).catch(() => null);
    Promise.all([
      get('/data/rooms.json').then(x => x || { rooms: [], categories: [] }),
      get('/data/scenarios.json').then(x => (x && x.scenarios) || (Array.isArray(x) ? x : [])),
      get('/data/config.json').then(x => x || {}),
      get('/data/docs.json'),
      get('/data/learning.json'),
    ]).then(([roomsData, scenarioList, cfg, docsList, learningData]) => {
      setData(roomsData && (roomsData.rooms || roomsData.categories) ? roomsData : { rooms: [], categories: [] });
      setScenarios((scenarioList && scenarioList.scenarios) || (Array.isArray(scenarioList) ? scenarioList : []));
      setConfig(cfg || {});
      setDocs(docsList);
      setLearning(learningData);
      setLoaded(true);
    });
  }, []);

  return { data, scenarios, config, docs, learning, loaded };
}

export function useStorage() {
  const getEngagement = useCallback(() => storage ? storage.getEngagement() : { targets: [], proxies: [], proxyNotes: '', notes: '' }, []);
  const setEngagement = useCallback((d) => storage && storage.setEngagement(d), []);
  const getLastScenario = useCallback(() => storage ? storage.getLastScenario() : null, []);
  const setLastScenario = useCallback((id, taskIndex) => storage && (storage.setLastScenario(id), taskIndex != null && storage.setLastTaskIndex(taskIndex)), []);
  const getLastTaskIndex = useCallback(() => storage ? storage.getLastTaskIndex() : null, []);
  const getTaskDone = useCallback((sid, idx) => storage ? storage.getTaskDone(sid, idx) : false, []);
  const setTaskDone = useCallback((sid, idx, done) => storage && storage.setTaskDone(sid, idx, done), []);
  const getPipAuto = useCallback(() => storage ? storage.getPipAuto() : false, []);
  const setPipAuto = useCallback((v) => storage && storage.setPipAuto(v), []);
  const clearProgress = useCallback(() => storage && storage.clearProgress(), []);

  return {
    getEngagement, setEngagement, getLastScenario, setLastScenario, getLastTaskIndex,
    getTaskDone, setTaskDone, getPipAuto, setPipAuto, clearProgress,
  };
}

export function useStorageReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!storage || !storage.ready) return setReady(true);
    storage.ready().then(() => setReady(true)).catch(() => setReady(true));
  }, []);
  return ready;
}

export function escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
