import { escapeHtml } from '../lib/store';

export default function PipPanel({ open, scenario, onClose }) {
  if (!open) return null;
  if (!scenario) return null;

  const tasks = scenario.tasks || [];
  const storage = typeof window !== 'undefined' ? window.LabCyberStorage : null;
  const isTaskDone = (idx) => storage ? storage.getTaskDone(scenario.id, idx) : false;

  return (
    <div class="pip-panel" aria-label="Scénario en cours">
      <div class="pip-header">
        <span class="pip-title">{escapeHtml(scenario.title)}</span>
        <button type="button" class="pip-close" onClick={onClose} title="Fermer" aria-label="Fermer">×</button>
      </div>
      <div class="pip-body">
        <ul id="pip-tasks">
          {tasks.map((t, i) => (
            <li key={i} class={isTaskDone(i) ? 'done' : ''}>
              {isTaskDone(i) ? '✓ ' : ''}{escapeHtml(t.title)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
