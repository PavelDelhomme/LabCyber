import { useState } from 'preact/hooks';
import { escapeHtml, getTerminalUrl } from '../lib/store';

export default function ScenarioView({ scenarios, config, currentScenarioId, storage }) {
  const scenario = currentScenarioId ? (scenarios || []).find(s => s.id === currentScenarioId) : null;
  const [taskIndex, setTaskIndex] = useState(0);

  if (!scenario) {
    return <div class="view"><p class="section-desc">Choisis un scénario dans la barre latérale.</p></div>;
  }

  const tasks = scenario.tasks || [];
  const task = tasks[taskIndex];
  const isDone = (i) => storage?.getTaskDone(scenario.id, i);
  const setDone = (i, done) => storage?.setTaskDone(scenario.id, i, done);
  const termUrl = getTerminalUrl(config);

  return (
    <div id="view-scenario" class="view view-scenario-with-terminal active">
      <div class="scenario-content-column">
        <header class="page-header scenario-header">
          <h2 id="scenario-title">{escapeHtml(scenario.title)}</h2>
          <p class="room-description">{escapeHtml(scenario.description || '')}</p>
        </header>
        <section class="room-section machines-section">
          <h3>Déployer / Accéder aux cibles</h3>
          <div class="machine-cards">
            {(scenario.machines || []).map((m, i) => (
              <div key={i} class="machine-card">
                <strong>{escapeHtml(m.name || m.urlKey || '')}</strong>
                {m.urlKey && <a href={termUrl} target="_blank" rel="noopener">Ouvrir</a>}
              </div>
            ))}
          </div>
        </section>
        <section class="room-section">
          <h3>Tâches</h3>
          <div class="tasks-list scenario-tasks">
            {tasks.map((t, i) => (
              <div key={i} class={`task-item ${isDone(i) ? 'done' : ''}`}>
                <input
                  type="checkbox"
                  class="task-checkbox"
                  checked={!!isDone(i)}
                  onChange={e => { setDone(i, e.target.checked); storage?.setLastScenario(scenario.id, i); }}
                />
                <div class="task-content">
                  <div class="task-title">{escapeHtml(t.title)}</div>
                  {t.content && <p>{escapeHtml(t.content)}</p>}
                  {t.command && <pre class="code-block">{escapeHtml(t.command)}</pre>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      <aside class="scenario-terminal-panel">
        <div class="terminal-panel-header">
          <h3>⌨ Terminal attaquant</h3>
          <a href={termUrl} target="_blank" rel="noopener" class="topbar-btn">Nouvel onglet</a>
        </div>
        <div class="terminal-status">Terminal via la gateway (même port que cette page). Ouvre dans un onglet si l’iframe bloque.</div>
        <div class="terminal-container">
          <iframe title="Terminal" src={termUrl} class="terminal-iframe" />
        </div>
      </aside>
    </div>
  );
}
