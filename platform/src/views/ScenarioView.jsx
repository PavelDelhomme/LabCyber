import { useState, useEffect } from 'preact/hooks';
import { escapeHtml, getTerminalUrl } from '../lib/store';

export default function ScenarioView({ scenarios, config, currentScenarioId, storage, onOpenTerminalInPanel, docSources }) {
  const scenario = currentScenarioId ? (scenarios || []).find(s => s.id === currentScenarioId) : null;
  const [taskIndex, setTaskIndex] = useState(0);

  const status = storage?.getScenarioStatus(scenario?.id) || 'not_started';
  const tasks = scenario?.tasks || [];
  const doneCount = tasks.filter((_, i) => storage?.getTaskDone(scenario?.id, i)).length;
  const allDone = tasks.length > 0 && doneCount >= tasks.length;

  useEffect(() => {
    if (!scenario || !storage) return;
    if (allDone && status !== 'completed') storage.setScenarioStatus(scenario.id, 'completed');
  }, [scenario?.id, allDone, status, storage]);

  if (!scenario) {
    return <div class="view"><p class="section-desc">Choisis un scénario dans la barre latérale.</p></div>;
  }

  const task = tasks[taskIndex];
  const isDone = (i) => storage?.getTaskDone(scenario.id, i);
  const setDone = (i, done) => {
    storage?.setTaskDone(scenario.id, i, done);
    storage?.setLastScenario(scenario.id, taskIndex);
  };
  const termUrl = getTerminalUrl(config);

  const startScenario = () => {
    storage?.setScenarioStatus(scenario.id, 'in_progress');
    onOpenTerminalInPanel?.();
  };
  const prepareScenario = () => {
    onOpenTerminalInPanel?.();
  };
  const pauseScenario = () => storage?.setScenarioStatus(scenario.id, 'paused');
  const resumeScenario = () => storage?.setScenarioStatus(scenario.id, 'in_progress');
  const abandonScenario = () => storage?.setScenarioStatus(scenario.id, 'abandoned');
  const resetScenario = () => storage?.setScenarioStatus(scenario.id, 'not_started');

  const statusLabel = { not_started: 'Non commencé', in_progress: 'En cours', completed: 'Terminé', abandoned: 'Abandonné', paused: 'En pause' }[status] || status;

  return (
    <div id="view-scenario" class="view view-scenario-with-terminal active">
      <div class="scenario-content-column">
        <header class="page-header scenario-header">
          <div class="scenario-header-row">
            <h2 id="scenario-title">{escapeHtml(scenario.title)}</h2>
            <span class={`scenario-status-badge status-${status}`}>{statusLabel}</span>
          </div>
          <p class="room-description">{escapeHtml(scenario.description || '')}</p>
          <p class="scenario-mode-hint">Tu peux faire les étapes depuis le navigateur (cibles, Proxy / Requêtes dans le menu) ou depuis le terminal à côté — pas besoin de te connecter au conteneur attaquant si tu préfères rester dans le navigateur.</p>
          <div class="scenario-actions">
            {status === 'not_started' && (
              <>
                <button type="button" class="btn btn-primary" onClick={startScenario}>Démarrer le scénario</button>
                <button type="button" class="btn btn-secondary" onClick={prepareScenario}>Préparer l'environnement (ouvrir le terminal)</button>
              </>
            )}
            {status === 'in_progress' && (
              <>
                <button type="button" class="btn btn-secondary" onClick={pauseScenario}>Mettre en pause</button>
                <button type="button" class="topbar-btn" onClick={abandonScenario}>J'abandonne ce scénario</button>
              </>
            )}
            {status === 'paused' && (
              <>
                <button type="button" class="btn btn-primary" onClick={resumeScenario}>Reprendre le scénario</button>
                <button type="button" class="topbar-btn" onClick={abandonScenario}>Abandonner</button>
              </>
            )}
            {status === 'abandoned' && (
              <button type="button" class="topbar-btn" onClick={resetScenario}>Reprendre (réinitialiser le statut)</button>
            )}
          </div>
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
                  onChange={e => { setDone(i, e.target.checked); storage?.setLastScenario(scenario.id, i); storage?.setScenarioStatus(scenario.id, 'in_progress'); }}
                />
                <div class="task-content">
                  <div class="task-title">{escapeHtml(t.title)}</div>
                  {t.content && <p>{escapeHtml(t.content)}</p>}
                  {t.command && <pre class="code-block">{escapeHtml(t.command)}</pre>}
                  {t.docRef && (
                    <p class="task-doc-ref">
                      <a href={`#/doc-offline/${encodeURIComponent(t.docRef)}`} class="task-doc-link">View doc: {escapeHtml((docSources?.sources || []).find(s => s.id === t.docRef)?.label || t.docRef)}</a>
                    </p>
                  )}
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
