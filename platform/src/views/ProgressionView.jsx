import { useState } from 'preact/hooks';
import { escapeHtml, dispatchLabAction } from '../lib/store';
import { ACTION } from '../lib/actionTypes';

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'paused', label: 'En pause' },
  { value: 'completed', label: 'Terminés' },
  { value: 'abandoned', label: 'Abandonnés' },
  { value: 'not_started', label: 'Non commencés' },
];

const CHALLENGE_CATEGORY_LABELS = {
  network: 'Réseau',
  api: 'API',
  web: 'Web',
  red: 'Red Team',
  documentation: 'Documentation',
  stego: 'Stéganographie',
  crypto: 'Cryptographie',
};

export default function ProgressionView({ data, scenarios, challenges, storage, onOpenScenario, onOpenRoom }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState('');
  const [challengeCategoryFilter, setChallengeCategoryFilter] = useState('');
  const rooms = data?.rooms || [];
  const challengesDone = storage ? storage.getChallengesDone() : [];
  const challengeList = challenges || [];
  const challengeCategories = [...new Set(challengeList.map(c => c.category).filter(Boolean))].sort();
  const filteredChallenges = !challengeCategoryFilter
    ? challengeList
    : challengeList.filter(c => c.category === challengeCategoryFilter);
  const getProgress = (s) => {
    if (!storage || !s.tasks || !s.tasks.length) return { done: 0, total: 0 };
    let done = 0;
    s.tasks.forEach((_, i) => { if (storage.getTaskDone(s.id, i)) done++; });
    return { done, total: s.tasks.length };
  };
  const getRoomProgress = (r) => {
    if (!storage || !r.tasks || !r.tasks.length) return { done: 0, total: 0 };
    let done = 0;
    r.tasks.forEach((_, i) => { if (storage.getRoomTaskDone(r.id, i)) done++; });
    return { done, total: r.tasks.length };
  };
  const getStatus = (s) => storage ? storage.getScenarioStatus(s.id) : 'not_started';
  const getRoomStatus = (r) => storage ? storage.getRoomStatus(r.id) : 'not_started';

  const filteredScenarios = (scenarios || []).filter(s => !statusFilter || getStatus(s) === statusFilter);
  const filteredRooms = rooms.filter(r => !roomStatusFilter || getRoomStatus(r) === roomStatusFilter);

  const isChallengeDone = (id) => Array.isArray(challengesDone) && challengesDone.includes(id);

  return (
    <div id="view-progression" class="view">
      <header class="page-header">
        <h2>Ma progression</h2>
        <p class="room-description">Suivi des scénarios guidés, des rooms et des challenges. <strong>Progression enregistrée localement</strong> dans ton navigateur (pas de serveur). Le lab actif (badge en haut) est utilisé pour le terminal, le bureau et les outils.</p>
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
                    {scenarioStatus === 'not_started' ? '—' : scenarioStatus === 'in_progress' ? '…' : scenarioStatus === 'paused' ? '⏸' : scenarioStatus === 'completed' ? '✓' : '✕'}
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
        <h3>Rooms</h3>
        <p class="section-desc">Même principe que les scénarios : démarre une room depuis la vue room, coche les tâches. Filtre par statut, clique pour ouvrir ou reprendre.</p>
        <div class="progression-filters">
          {STATUS_FILTERS.map(f => (
            <button
              key={'room-' + (f.value || 'all')}
              type="button"
              class={`topbar-btn ${roomStatusFilter === f.value ? 'active' : ''}`}
              onClick={() => setRoomStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <ul class="progression-scenarios">
          {filteredRooms.map(r => {
            const prog = getRoomProgress(r);
            const roomStatus = getRoomStatus(r);
            return (
              <li key={r.id} class="progression-item">
                <button type="button" class="progression-scenario-btn" onClick={() => onOpenRoom?.(r.id)}>
                  <span class={`progression-status-badge status-${roomStatus}`}>
                    {roomStatus === 'not_started' ? '—' : roomStatus === 'in_progress' ? '…' : roomStatus === 'paused' ? '⏸' : roomStatus === 'completed' ? '✓' : '✕'}
                  </span>
                  <span class="progression-progress">{prog.done}/{prog.total}</span>
                  <span class="progression-title">{escapeHtml(r.title)}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {filteredRooms.length === 0 && <p class="text-muted">Aucune room pour ce filtre.</p>}
        {rooms.length === 0 && <p class="text-muted">Aucune room.</p>}
      </section>

      <section class="room-section">
        <h3>Challenges</h3>
        <p class="section-desc">Fais le challenge (dans le lab), puis marque comme réussi. Déblocage comme les scénarios. Tu peux recommencer un challenge pour le refaire. Liens vers les rooms pour télécharger les fichiers (stégano, crypto).</p>
        {challengeCategories.length > 0 && (
          <div class="progression-filters">
            <button
              type="button"
              class={`topbar-btn ${challengeCategoryFilter === '' ? 'active' : ''}`}
              onClick={() => setChallengeCategoryFilter('')}
            >
              Tous
            </button>
            {challengeCategories.map(cat => (
              <button
                key={cat}
                type="button"
                class={`topbar-btn ${challengeCategoryFilter === cat ? 'active' : ''}`}
                onClick={() => setChallengeCategoryFilter(cat)}
              >
                {CHALLENGE_CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>
        )}
        <ul class="progression-challenges">
          {filteredChallenges.map(c => {
            const done = isChallengeDone(c.id);
            return (
              <li key={c.id} class="progression-item progression-challenge-item">
                <div class="progression-challenge-row">
                  <span class={`progression-status-badge ${done ? 'status-completed' : 'status-not_started'}`}>{done ? '✓' : '—'}</span>
                  <span class="progression-challenge-title">{escapeHtml(c.title)}</span>
                  {c.category && <span class="progression-challenge-category">{CHALLENGE_CATEGORY_LABELS[c.category] || c.category}</span>}
                  <span class="difficulty-badge easy">{escapeHtml(c.difficulty || '')}</span>
                </div>
                <p class="progression-challenge-desc">{escapeHtml((c.description || '').slice(0, 120))}{(c.description || '').length > 120 ? '…' : ''}</p>
                <div class="progression-challenge-actions">
                  {c.roomId && onOpenRoom && (
                    <button type="button" class="btn btn-secondary" onClick={() => onOpenRoom(c.roomId)} title="Ouvrir la room pour télécharger les fichiers et voir les tâches">Voir la room</button>
                  )}
                  {c.downloadUrl && (
                    <a href={c.downloadUrl} class="btn btn-secondary" target="_blank" rel="noopener noreferrer" title="Télécharger les fichiers du challenge" onClick={() => dispatchLabAction({ action: ACTION.CHALLENGE_DOWNLOAD, challengeId: c.id, url: c.downloadUrl })}>Télécharger</a>
                  )}
                  {done ? (
                    <button type="button" class="btn btn-secondary" onClick={() => storage?.setChallengeDone(c.id, false)} title="Supprimer la validation pour recommencer le challenge">Recommencer</button>
                  ) : (
                    <button type="button" class="btn btn-primary" onClick={() => storage?.setChallengeDone(c.id, true)} title="Marquer comme réussi après avoir fait le challenge">J'ai réussi</button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {filteredChallenges.length === 0 && <p class="text-muted">Aucun challenge pour ce filtre.</p>}
        {challengeList.length === 0 && <p class="text-muted">Aucun challenge.</p>}
      </section>
    </div>
  );
}
