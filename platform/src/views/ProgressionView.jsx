import { useState } from 'preact/hooks';
import { escapeHtml } from '../lib/store';

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminés' },
  { value: 'abandoned', label: 'Abandonnés' },
  { value: 'not_started', label: 'Non commencés' },
];

export default function ProgressionView({ scenarios, challenges, storage, onOpenScenario, onOpenRoom }) {
  const [statusFilter, setStatusFilter] = useState('');
  const challengesDone = storage ? storage.getChallengesDone() : [];
  const getProgress = (s) => {
    if (!storage || !s.tasks || !s.tasks.length) return { done: 0, total: 0 };
    let done = 0;
    s.tasks.forEach((_, i) => { if (storage.getTaskDone(s.id, i)) done++; });
    return { done, total: s.tasks.length };
  };
  const getStatus = (s) => storage ? storage.getScenarioStatus(s.id) : 'not_started';

  const filteredScenarios = (scenarios || []).filter(s => !statusFilter || getStatus(s) === statusFilter);

  const isChallengeDone = (id) => Array.isArray(challengesDone) && challengesDone.includes(id);

  return (
    <div id="view-progression" class="view">
      <header class="page-header">
        <h2>Ma progression</h2>
        <p class="room-description">Suivi des scénarios guidés et des challenges. Statut et tâches cochées sont enregistrés localement (navigateur).</p>
      </header>

      <section class="room-section">
        <h3>Scénarios guidés</h3>
        <p class="section-desc">Filtre par statut, clique sur un scénario pour l'ouvrir ou le reprendre.</p>
        <div class="progression-filters">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value || 'all'}
              type="button"
              class={`topbar-btn ${statusFilter === f.value ? 'active' : ''}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <ul class="progression-scenarios">
          {filteredScenarios.map(s => {
            const prog = getProgress(s);
            const scenarioStatus = getStatus(s);
            return (
              <li key={s.id} class="progression-item">
                <button type="button" class="progression-scenario-btn" onClick={() => onOpenScenario?.(s.id)}>
                  <span class={`progression-status-badge status-${scenarioStatus}`}>
                    {scenarioStatus === 'not_started' ? '—' : scenarioStatus === 'in_progress' ? '…' : scenarioStatus === 'completed' ? '✓' : '✕'}
                  </span>
                  <span class="progression-progress">{prog.done}/{prog.total}</span>
                  <span class="progression-title">{escapeHtml(s.title)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {filteredScenarios.length === 0 && <p class="text-muted">Aucun scénario pour ce filtre.</p>}
        {(scenarios || []).length === 0 && <p class="text-muted">Aucun scénario.</p>}
      </section>

      <section class="room-section">
        <h3>Challenges</h3>
        <p class="section-desc">Coche quand tu as validé un challenge (pour toi-même).</p>
        <ul class="progression-challenges">
          {(challenges || []).map(c => {
            const done = isChallengeDone(c.id);
            return (
              <li key={c.id} class="progression-item">
                <label class="progression-challenge-row">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={(e) => storage?.setChallengeDone(c.id, e.target.checked)}
                  />
                  <span class="progression-challenge-title">{escapeHtml(c.title)}</span>
                  <span class="difficulty-badge easy">{escapeHtml(c.difficulty || '')}</span>
                </label>
                <p class="progression-challenge-desc">{escapeHtml((c.description || '').slice(0, 120))}{(c.description || '').length > 120 ? '…' : ''}</p>
              </li>
            );
          })}
        </ul>
        {(challenges || []).length === 0 && <p class="text-muted">Aucun challenge.</p>}
      </section>
    </div>
  );
}
