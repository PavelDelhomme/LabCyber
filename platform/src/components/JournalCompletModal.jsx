import { useState, useEffect } from 'preact/hooks';

const DEFAULT_LAB = { id: 'default', name: 'Lab par défaut' };
const TYPE_LABELS = { note: 'Note', capture_output: 'Sortie terminal', screenshot: 'Capture', attachment: 'Pièce jointe' };

export default function JournalCompletModal({ open, onClose, storage, labs = [], currentLabId, scenarios = [] }) {
  const [filterLabId, setFilterLabId] = useState(currentLabId || 'default');
  const [filterScenarioId, setFilterScenarioId] = useState('');
  const [entriesByLab, setEntriesByLab] = useState({});
  const [loading, setLoading] = useState(false);

  const allLabs = [DEFAULT_LAB, ...(labs || [])];

  useEffect(() => {
    if (!open || !storage) return;
    setLoading(true);
    const list = (labs && labs.length) ? labs : [DEFAULT_LAB];
    const labIds = list.map(l => l.id);
    Promise.all(labIds.map(labId => storage.getLabJournal(labId))).then(results => {
      const map = {};
      labIds.forEach((id, i) => { map[id] = results[i] || []; });
      setEntriesByLab(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [open, storage]);

  if (!open) return null;

  const entries = (entriesByLab[filterLabId] || []).slice().reverse();
  const filtered = filterScenarioId
    ? entries.filter(e => e.scenarioId === filterScenarioId)
    : entries;
  const labName = allLabs.find(l => l.id === filterLabId)?.name || filterLabId;
  const scenarioTitle = filterScenarioId ? (scenarios.find(s => s.id === filterScenarioId)?.title || filterScenarioId) : null;

  return (
    <div class="modal" role="dialog" aria-modal="true" aria-label="Journal complet par lab" onClick={e => e.target === e.currentTarget && onClose()}>
      <div class="modal-content modal-content-wide" onClick={e => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Journal complet (par lab)</h2>
          <button type="button" class="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <div class="modal-body journal-complet-body">
          <div class="journal-complet-filters">
            <label>
              Lab
              <select value={filterLabId} onChange={e => setFilterLabId(e.target.value)}>
                {allLabs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </label>
            <label>
              Scénario
              <select value={filterScenarioId} onChange={e => setFilterScenarioId(e.target.value)}>
                <option value="">Tous</option>
                {scenarios.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </label>
          </div>
          {loading ? (
            <p class="journal-complet-loading">Chargement…</p>
          ) : (
            <>
              <p class="journal-complet-summary">
                {filtered.length} entrée(s) {scenarioTitle ? `pour le scénario « ${scenarioTitle} »` : ''} dans le lab « {labName} ».
              </p>
              <ul class="journal-complet-list">
                {filtered.map(entry => (
                  <li key={entry.id} class={`journal-complet-entry journal-complet-type-${entry.type || 'note'}`}>
                    <span class="journal-complet-ts">{entry.ts ? new Date(entry.ts).toLocaleString('fr-FR') : ''}</span>
                    <span class="journal-complet-type">{TYPE_LABELS[entry.type] || entry.type}</span>
                    {entry.sessionId && <span class="journal-complet-session">Session {entry.sessionId}</span>}
                    {entry.scenarioId && <span class="journal-complet-scenario">{scenarios.find(s => s.id === entry.scenarioId)?.title || entry.scenarioId}</span>}
                    <div class="journal-complet-text">{(entry.text || entry.content || '').slice(0, 500)}{(entry.text || entry.content || '').length > 500 ? '…' : ''}</div>
                  </li>
                ))}
              </ul>
              {filtered.length === 0 && <p class="journal-complet-empty">Aucune entrée. Les notes ajoutées depuis le panneau terminal (lab actif) apparaissent ici.</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
