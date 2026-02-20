import { useState, useEffect } from 'preact/hooks';
import { escapeHtml, getTerminalUrl } from '../lib/store';

export default function ScenarioView({ scenarios, config, currentScenarioId, currentLabId, storage, onOpenTerminalInPanel, onOpenTerminalPip, docSources }) {
  const scenario = currentScenarioId ? (scenarios || []).find(s => s.id === currentScenarioId) : null;
  const [taskIndex, setTaskIndex] = useState(0);
  const [toolPacks, setToolPacks] = useState(null);
  const [labToolPresets, setLabToolPresets] = useState(null);

  const status = storage?.getScenarioStatus(scenario?.id) || 'not_started';
  const tasks = scenario?.tasks || [];
  const doneCount = tasks.filter((_, i) => storage?.getTaskDone(scenario?.id, i)).length;
  const allDone = tasks.length > 0 && doneCount >= tasks.length;

  useEffect(() => {
    if (!scenario || !storage) return;
    if (allDone && status !== 'completed') storage.setScenarioStatus(scenario.id, 'completed');
  }, [scenario?.id, allDone, status, storage]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/data/toolPacks.json').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/data/labToolPresets.json').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([packs, presets]) => {
      if (!cancelled) {
        setToolPacks(packs);
        setLabToolPresets(presets);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const packIds = (scenario?.id && labToolPresets?.byScenario) ? (labToolPresets.byScenario[scenario.id] || []) : [];
  const recommendedPacks = (toolPacks?.packs && packIds.length)
    ? packIds.map(id => toolPacks.packs.find(p => p.id === id)).filter(Boolean)
    : [];

  if (!scenario) {
    return <div class="view"><p class="section-desc">Choisis un scénario dans la barre latérale.</p></div>;
  }

  const task = tasks[taskIndex];
  const isDone = (i) => storage?.getTaskDone(scenario.id, i);
  const setDone = (i, done) => {
    storage?.setTaskDone(scenario.id, i, done);
    storage?.setLastScenario(scenario.id, taskIndex);
  };
  const termUrl = getTerminalUrl();

  const startScenario = () => {
    storage?.setScenarioStatus(scenario.id, 'in_progress');
    if (currentLabId && storage?.setScenarioLabId) storage.setScenarioLabId(scenario.id, currentLabId);
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
          <p class="scenario-mode-hint">Utilise le <strong>terminal attaquant</strong> (panneau à droite, flottant PiP ou nouvel onglet) pour exécuter les commandes. C’est le même conteneur avec les outils recommandés ci‑dessous.</p>
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
        {recommendedPacks.length > 0 && (
          <section class="room-section scenario-tool-packs" aria-label="Packs d'outils recommandés">
            <h3>Packs d'outils recommandés pour ce scénario</h3>
            <p class="scenario-tool-packs-desc">Le conteneur attaquant doit inclure ces outils (nmap, ping, etc.) pour ce lab. S'ils manquent, configure le conteneur ou l'image Docker. Utilise le terminal (panneau ou PiP) pour les commandes.</p>
            <div class="scenario-tool-packs-list">
              {recommendedPacks.map(pack => (
                <div key={pack.id} class="scenario-tool-pack-badge" title={pack.description || ''}>
                  <span class="scenario-tool-pack-name">{escapeHtml(pack.name)}</span>
                  {pack.tools && pack.tools.length > 0 && (
                    <span class="scenario-tool-pack-tools">{pack.tools.slice(0, 5).join(', ')}{pack.tools.length > 5 ? '…' : ''}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
        <section class="room-section machines-section" aria-label="Terminal et cibles">
          <h3>Terminal et cibles</h3>
          <p class="scenario-terminal-cibles-desc">Ouvre le terminal (panneau, flottant PiP ou nouvel onglet), puis accès aux cibles (commandes à copier).</p>
          <div class="machine-cards">
            {(scenario.machines || []).map((m, i) => (
              <div key={i} class={`machine-card ${m.urlKey === 'terminal' ? 'machine-card-terminal' : ''}`}>
                <strong>{escapeHtml(m.name || m.urlKey || '')}</strong>
                {m.urlKey === 'terminal' ? (
                  <div class="machine-card-actions">
                    <button type="button" class="btn btn-small" onClick={() => onOpenTerminalInPanel?.()}>Panneau</button>
                    <button type="button" class="btn btn-small" onClick={() => onOpenTerminalPip?.()}>PiP</button>
                    <a href={termUrl} target="_blank" rel="noopener" class="btn btn-small">Nouvel onglet</a>
                  </div>
                ) : (
                  <>
                    {m.note && <p class="machine-note">{escapeHtml(m.note)}</p>}
                    <div class="machine-card-actions">
                      {m.note && (
                        <button
                          type="button"
                          class="btn btn-small"
                          onClick={() => {
                            const cmd = (m.note || '').replace(/^[^:]*:\s*/i, '').trim() || m.note;
                            if (cmd && navigator.clipboard?.writeText) navigator.clipboard.writeText(cmd);
                          }}
                          title="Copier la commande d'accès"
                        >
                          Copier la commande
                        </button>
                      )}
                      <button type="button" class="btn btn-small" onClick={() => onOpenTerminalInPanel?.()} title="Ouvrir le terminal pour coller la commande">Ouvrir le terminal</button>
                    </div>
                  </>
                )}
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
    </div>
  );
}
