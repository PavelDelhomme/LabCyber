import { escapeHtml } from '../lib/store';

export default function ScenarioBottomBar({ scenario, storage, onExpand, collapsed, onCollapsed }) {
  if (!scenario) return null;

  const tasks = scenario.tasks || [];
  const storageRef = typeof window !== 'undefined' ? window.LabCyberStorage : storage;
  const isTaskDone = (idx) => storageRef ? storageRef.getTaskDone(scenario.id, idx) : false;

  return (
    <div class={`scenario-bottom-bar ${collapsed ? 'scenario-bottom-bar-collapsed' : ''}`} role="complementary" aria-label="Tâches du scénario">
      <button
        type="button"
        class="scenario-bottom-bar-toggle"
        onClick={() => onCollapsed?.(!collapsed)}
        title={collapsed ? 'Afficher les tâches' : 'Réduire'}
        aria-expanded={!collapsed}
      >
        <span class="scenario-bottom-bar-title">{escapeHtml(scenario.title)}</span>
        <span class="scenario-bottom-bar-chevron">{collapsed ? '▲' : '▼'}</span>
      </button>
      {!collapsed && (
        <div class="scenario-bottom-bar-body">
          <ul class="scenario-bottom-bar-tasks">
            {tasks.map((t, i) => (
              <li key={i} class={isTaskDone(i) ? 'done' : ''}>
                {isTaskDone(i) ? '✓ ' : ''}{escapeHtml(t.title)}
              </li>
            ))}
          </ul>
          {onExpand && (
            <button type="button" class="scenario-bottom-bar-expand" onClick={onExpand} title="Voir le scénario complet">Voir tout</button>
          )}
        </div>
      )}
    </div>
  );
}
