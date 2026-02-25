import { useState } from 'preact/hooks';
import { escapeHtml } from '../lib/store';

export default function ScenarioBottomBar({
  scenario,
  storage,
  getTaskDone: getTaskDoneProp,
  onExpand,
  collapsed,
  onCollapsed,
  terminalStripWidth = 0,
  onOpenTerminal,
  onOpenPipRecap,
  onPause,
  onResume,
  status = 'not_started',
  getTerminalUrl,
}) {
  const [expandedTaskIndex, setExpandedTaskIndex] = useState(null);
  if (!scenario) return null;

  const tasks = scenario.tasks || [];
  const machines = scenario.machines || [];
  const storageRef = typeof window !== 'undefined' ? window.LabCyberStorage : storage;
  const isTaskDone = (idx) => getTaskDoneProp ? !!getTaskDoneProp(idx) : (storageRef ? storageRef.getTaskDone(scenario.id, idx) : false);
  const expandedTask = expandedTaskIndex != null && tasks[expandedTaskIndex] ? tasks[expandedTaskIndex] : null;

  const copyCommand = (note) => {
    const cmd = (note || '').replace(/^[^:]*:\s*/i, '').trim() || note;
    if (cmd && navigator.clipboard?.writeText) navigator.clipboard.writeText(cmd);
  };

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
          title={collapsed ? 'Afficher les tâches et cibles' : 'Réduire'}
          aria-expanded={!collapsed}
        >
          <span class="scenario-bottom-bar-title">{escapeHtml(scenario.title)}</span>
          <span class="scenario-bottom-bar-chevron">{collapsed ? '▲' : '▼'}</span>
        </button>
        {status === 'in_progress' && onPause && (
          <button type="button" class="scenario-bar-section-pause" onClick={onPause} title="Mettre en pause">Pause</button>
        )}
        {status === 'paused' && onResume && (
          <button type="button" class="scenario-bar-section-resume" onClick={onResume} title="Reprendre">Reprendre</button>
        )}
        {onOpenPipRecap && (
          <button type="button" class="scenario-bar-section-recap" onClick={onOpenPipRecap} title="Afficher le récap des tâches en popup">Récap</button>
        )}
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
          <div class="scenario-bar-section-tasks">
            <ul class="scenario-bottom-bar-tasks">
              {tasks.map((t, i) => (
                <li
                  key={i}
                  class={`scenario-bar-task-item ${isTaskDone(i) ? 'done' : ''} ${expandedTaskIndex === i ? 'selected' : ''}`}
                  onClick={() => setExpandedTaskIndex(expandedTaskIndex === i ? null : i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedTaskIndex(expandedTaskIndex === i ? null : i); } }}
                  aria-expanded={expandedTaskIndex === i}
                  aria-pressed={isTaskDone(i)}
                  title="Cliquer pour voir le détail"
                >
                  {isTaskDone(i) ? '✓ ' : ''}{escapeHtml(t.title)}
                </li>
              ))}
            </ul>
            {expandedTask != null && (
              <div class="scenario-bar-task-detail" role="region" aria-label="Détail de l'étape">
                <div class="scenario-bar-task-detail-status">
                  {isTaskDone(expandedTaskIndex) ? '✓ Fait' : 'À faire'}
                </div>
                <strong>{escapeHtml(expandedTask.title)}</strong>
                {expandedTask.content && <p>{escapeHtml(expandedTask.content)}</p>}
                {expandedTask.tip && <p class="scenario-bar-task-detail-tip">💡 {escapeHtml(expandedTask.tip)}</p>}
                <button type="button" class="scenario-bar-task-detail-close" onClick={e => { e.stopPropagation(); setExpandedTaskIndex(null); }}>Fermer</button>
              </div>
            )}
            {onExpand && (
              <button type="button" class="scenario-bottom-bar-expand" onClick={onExpand} title="Voir le scénario complet">Voir tout</button>
            )}
          </div>
          {machines.length > 0 && (
            <div class="scenario-bar-cibles">
              <span class="scenario-bar-cibles-title">Cibles</span>
              {machines.map((m, i) => (
                <span key={i} class="scenario-bar-cible">
                  <strong>{escapeHtml(m.name || m.urlKey || '')}</strong>
                  {m.urlKey === 'terminal' ? (
                    <>
                      <button type="button" class="btn btn-tiny" onClick={onOpenTerminal}>Panneau</button>
                      {getTerminalUrl && (
                        <a href={getTerminalUrl()} target="_blank" rel="noopener" class="btn btn-tiny">Onglet</a>
                      )}
                    </>
                  ) : (
                    <>
                      {m.note && (
                        <>
                          <button type="button" class="btn btn-tiny" onClick={() => copyCommand(m.note)} title="Copier">Copier</button>
                          <button type="button" class="btn btn-tiny" onClick={onOpenTerminal} title="Ouvrir le terminal">Terminal</button>
                        </>
                      )}
                    </>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
