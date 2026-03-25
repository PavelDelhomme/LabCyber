/**
 * Registre des sources de données chargées au démarrage (briques modulaires).
 * Pour ajouter une nouvelle brique : ajouter un objet ici + exposer la clé dans useStore.
 * Fichiers servis depuis /data/* (copiés ou liés dans platform/public/data/).
 */
import { EMBEDDED_DOC_SOURCES, EMBEDDED_DOCS, EMBEDDED_LEARNING } from './defaultData';

function id(x) {
  return x;
}

function roomsNormalize(x) {
  return x && (x.rooms || x.categories) ? x : { rooms: [], categories: [] };
}

function scenariosNormalize(x) {
  return (x && x.scenarios) || (Array.isArray(x) ? x : []) || [];
}

function docsNormalize(x) {
  return x && typeof x === 'object' && Array.isArray(x.entries) ? x : null;
}

function learningNormalize(x) {
  return x && typeof x === 'object' && Array.isArray(x.topics) ? x : null;
}

function targetsNormalize(x) {
  const t = Array.isArray(x) ? x : (x && x.targets);
  return t && t.length ? t : [];
}

function challengesNormalize(x) {
  return x && Array.isArray(x.challenges) ? x.challenges : [];
}

function docSourcesNormalize(x) {
  return x && typeof x === 'object' && Array.isArray(x.sources) ? x : null;
}

/** Liste des sources : key = clé d’état dans useStore, path = URL JSON, normalize = fn(raw) => value, defaultVal si fetch null/échoue. */
export const DATA_SOURCES = [
  { key: 'data', path: '/data/rooms.json', normalize: roomsNormalize, defaultVal: { rooms: [], categories: [] } },
  { key: 'scenarios', path: '/data/scenarios.json', normalize: scenariosNormalize, defaultVal: [] },
  { key: 'config', path: '/data/config.json', normalize: id, defaultVal: {} },
  { key: 'docs', path: '/data/docs.json', normalize: docsNormalize, defaultVal: EMBEDDED_DOCS },
  { key: 'learning', path: '/data/learning.json', normalize: learningNormalize, defaultVal: EMBEDDED_LEARNING },
  { key: 'targets', path: '/data/targets.json', normalize: targetsNormalize, defaultVal: [] },
  { key: 'challenges', path: '/data/challenges.json', normalize: challengesNormalize, defaultVal: [] },
  { key: 'docSources', path: '/data/docSources.json', normalize: docSourcesNormalize, defaultVal: EMBEDDED_DOC_SOURCES },
];
