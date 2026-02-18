import { useState, useEffect, useCallback } from 'preact/hooks';
import { EMBEDDED_DOCS, EMBEDDED_LEARNING, EMBEDDED_TARGETS } from './defaultData';

const storage = typeof window !== 'undefined' ? window.LabCyberStorage : null;

/** URL du terminal : chemin /terminal/ sur la gateway (fonctionne sans /etc/hosts) */
export function getTerminalUrl() {
  if (typeof window === 'undefined') return '#';
  const base = window.location.origin.replace(/\/$/, '');
  return `${base}/terminal/`;
}

/** URL du bureau noVNC (XFCE) : /desktop/ sur la gateway. */
export function getDesktopUrl() {
  if (typeof window === 'undefined') return '#';
  const base = window.location.origin.replace(/\/$/, '');
  return `${base}/desktop/`;
}

/** URL d’une machine depuis son urlKey (dvwa, juice, api, bwapp, terminal). */
export function getMachineUrl(urlKey) {
  if (typeof window === 'undefined') return { url: '#', label: '' };
  const base = window.location.origin.replace(/\/$/, '');
  const port = window.location.port || '80';
  if (urlKey === 'terminal') return { url: `${base}/terminal/`, label: `Terminal (${base}/terminal/)` };
  if (urlKey === 'desktop') return { url: `${base}/desktop/`, label: `Bureau (${base}/desktop/)` };
  const hostnames = { dvwa: 'dvwa.lab', juice: 'juice.lab', api: 'api.lab', bwapp: 'bwapp.lab' };
  const host = hostnames[urlKey] || urlKey + '.lab';
  return { url: `${window.location.protocol}//${host}:${port}`, label: `${host}:${port} (ajoute 127.0.0.1 ${host} dans /etc/hosts)` };
}

export function useStore() {
  const [data, setData] = useState({ rooms: [], categories: [] });
  const [scenarios, setScenarios] = useState([]);
  const [config, setConfig] = useState({ hostnames: {}, terminalPort: 7681 });
  const [docs, setDocs] = useState(EMBEDDED_DOCS);
  const [learning, setLearning] = useState(EMBEDDED_LEARNING);
  const [targets, setTargets] = useState(EMBEDDED_TARGETS);
  const [challenges, setChallenges] = useState([]);
  const [loaded, setLoaded] = useState(true);

  useEffect(() => {
    const base = typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : '';
    const get = (path) => fetch(base + path).then(r => (r.ok ? r.json() : null)).catch(() => null);
    Promise.allSettled([
      get('/data/rooms.json').then(x => x || { rooms: [], categories: [] }),
      get('/data/scenarios.json').then(x => (x && x.scenarios) || (Array.isArray(x) ? x : [])),
      get('/data/config.json').then(x => x || {}),
      get('/data/docs.json').then(x => x && typeof x === 'object' && Array.isArray(x.entries) ? x : null),
      get('/data/learning.json').then(x => x && typeof x === 'object' && Array.isArray(x.topics) ? x : null),
      get('/data/targets.json').then(x => x),
      get('/data/challenges.json').then(x => x),
    ]).then((results) => {
      const [roomsData, scenarioList, cfg, docsList, learningData, targetsData, challengesData] = results.map(r => r.status === 'fulfilled' ? r.value : null);
      setData(roomsData && (roomsData.rooms || roomsData.categories) ? roomsData : { rooms: [], categories: [] });
      setScenarios((scenarioList && scenarioList.scenarios) || (Array.isArray(scenarioList) ? scenarioList : []));
      setConfig(cfg || {});
      if (docsList) setDocs(docsList);
      if (learningData) setLearning(learningData);
      const t = Array.isArray(targetsData) ? targetsData : (targetsData?.targets);
      if (t && t.length) setTargets(t);
      setChallenges(challengesData && Array.isArray(challengesData.challenges) ? challengesData.challenges : []);
      setLoaded(true);
    });
  }, []);

  return { data, scenarios, config, docs, learning, targets, challenges, loaded };
}

export function useStorage() {
  const getEngagement = useCallback(() => storage ? storage.getEngagement() : { targets: [], proxies: [], proxyNotes: '', notes: '' }, []);
  const setEngagement = useCallback((d) => storage && storage.setEngagement(d), []);
  const getLastScenario = useCallback(() => storage ? storage.getLastScenario() : null, []);
  const setLastScenario = useCallback((id, taskIndex) => storage && (storage.setLastScenario(id), taskIndex != null && storage.setLastTaskIndex(taskIndex)), []);
  const getLastTaskIndex = useCallback(() => storage ? storage.getLastTaskIndex() : null, []);
  const getTaskDone = useCallback((sid, idx) => storage ? storage.getTaskDone(sid, idx) : false, []);
  const setTaskDone = useCallback((sid, idx, done) => storage && storage.setTaskDone(sid, idx, done), []);
  const getScenarioStatus = useCallback((sid) => storage ? storage.getScenarioStatus(sid) : 'not_started', []);
  const setScenarioStatus = useCallback((sid, status) => storage && storage.setScenarioStatus(sid, status), []);
  const getChallengesDone = useCallback(() => (storage ? storage.getChallengesDone() : []) || [], []);
  const setChallengeDone = useCallback((id, done) => storage && storage.setChallengeDone(id, done), []);
  const getLabs = useCallback(() => (storage ? storage.getLabs() : []) || [], []);
  const setLabs = useCallback((arr) => storage && storage.setLabs(arr), []);
  const getCurrentLabId = useCallback(() => storage ? storage.getCurrentLabId() : null, []);
  const setCurrentLabId = useCallback((id) => storage && storage.setCurrentLabId(id), []);
  const getTopologies = useCallback(() => (storage ? storage.getTopologies() : {}) || {}, []);
  const setTopology = useCallback((labId, data) => storage && storage.setTopology(labId, data), []);
  const getPipAuto = useCallback(() => storage ? storage.getPipAuto() : false, []);
  const setPipAuto = useCallback((v) => storage && storage.setPipAuto(v), []);
  const clearProgress = useCallback(() => storage && storage.clearProgress(), []);

  return {
    getEngagement, setEngagement, getLastScenario, setLastScenario, getLastTaskIndex,
    getTaskDone, setTaskDone, getScenarioStatus, setScenarioStatus, getChallengesDone, setChallengeDone,
    getLabs, setLabs, getCurrentLabId, setCurrentLabId, getTopologies, setTopology,
    getPipAuto, setPipAuto, clearProgress,
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
