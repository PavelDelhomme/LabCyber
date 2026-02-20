import { escapeHtml } from '../lib/store';

export default function ScenarioBottomBar({ scenario, storage, onExpand, collapsed, onCollapsed, terminalStripWidth = 0, onOpenTerminal }) {
  if (!scenario) return null;

  const tasks = scenario.tasks || [];
  const storageRef = typeof window !== 'undefined' ? window.LabCyberStorage : storage;
  const isTaskDone = (idx) => storageRef ? storageRef.getTaskDone(scenario.id, idx) : false;

  return (
    <div
      class={`scenario-bottom-bar ${collapsed ? 'scenario-bottom-bar-collapsed' : ''}`}
      role="complementary"
      aria-label="Scénario et terminal"
      style={{ right: terminalStripWidth > 0 ? terminalStripWidth : undefined }}
    >
      <div class="scenario-bottom-bar-inner">
        <button
          type="button"
          class="scenario-bottom-bar-toggle scenario-bar-section-scenario"
          onClick={() => onCollapsed?.(!collapsed)}
          title={collapsed ? 'Afficher les tâches' : 'Réduire'}
          aria-expanded={!collapsed}
        >
          <span class="scenario-bottom-bar-title">{escapeHtml(scenario.title)}</span>
          <span class="scenario-bottom-bar-chevron">{collapsed ? '▲' : '▼'}</span>
        </button>
        {onOpenTerminal && (
          <button
            type="button"
            class="scenario-bar-section-terminal"
            onClick={onOpenTerminal}
            title="Ouvrir le terminal attaquant dans le panneau à droite"
          >
            Terminal ▶
          </button>
        )}
      </div>
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
