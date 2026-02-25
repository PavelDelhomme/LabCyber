import { useState } from 'preact/hooks';
import { escapeHtml } from '../lib/store';

export default function PipPanel({ open, scenario, onClose, getTaskDone: getTaskDoneProp }) {
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(null);
  if (!open) return null;
  if (!scenario) return null;

  const tasks = scenario.tasks || [];
  const storage = typeof window !== 'undefined' ? window.LabCyberStorage : null;
  const isTaskDone = (idx) => getTaskDoneProp ? getTaskDoneProp(idx) : (storage ? storage.getTaskDone(scenario.id, idx) : false);
  const selectedTask = selectedTaskIndex != null && tasks[selectedTaskIndex] != null ? tasks[selectedTaskIndex] : null;

  return (
    <div class="pip-panel" aria-label="Récap scénario ou room">
      <div class="pip-header">
        <span class="pip-title">{escapeHtml(scenario.title)}</span>
        <button type="button" class="pip-close" onClick={onClose} title="Fermer" aria-label="Fermer">×</button>
      </div>
      <div class="pip-body">
        <p class="pip-tasks-hint">Clique sur une étape pour voir le détail et si elle est réalisée.</p>
        <ul id="pip-tasks" class="pip-tasks-list">
          {tasks.map((t, i) => (
            <li
              key={i}
              class={`pip-task-item ${isTaskDone(i) ? 'done' : ''} ${selectedTaskIndex === i ? 'selected' : ''}`}
              onClick={() => setSelectedTaskIndex(selectedTaskIndex === i ? null : i)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTaskIndex(selectedTaskIndex === i ? null : i); } }}
              aria-expanded={selectedTaskIndex === i}
              aria-pressed={isTaskDone(i)}
            >
              {isTaskDone(i) ? '✓ ' : ''}{escapeHtml(t.title)}
            </li>
          ))}
        </ul>
        {selectedTask != null && (
          <div class="pip-task-detail" role="region" aria-label="Détail de l'étape">
            <div class="pip-task-detail-status">
              {isTaskDone(selectedTaskIndex) ? '✓ Réalisée' : 'À faire'}
            </div>
            <strong>{escapeHtml(selectedTask.title)}</strong>
            {selectedTask.content && <p>{escapeHtml(selectedTask.content)}</p>}
            {selectedTask.tip && <p class="pip-task-detail-tip">💡 {escapeHtml(selectedTask.tip)}</p>}
            <button type="button" class="pip-task-detail-close" onClick={() => setSelectedTaskIndex(null)}>Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
}
