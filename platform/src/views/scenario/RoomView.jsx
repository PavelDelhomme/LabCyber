import { useEffect } from 'preact/hooks';
import { escapeHtml, getTerminalUrl, getDesktopUrl, getMachineUrl, dispatchLabAction } from '../../lib/store';
import { ACTION } from '../../lib/actionTypes';

function byCategory(categories, categoryId) {
  return (categories || []).find(c => c.id === categoryId) || {};
}

export default function RoomView({
  data,
  currentRoomId,
  storage,
  onStartRoom,
  onResumeRoom,
  onAbandonRoom,
  onRoomStatusChange,
  onOpenTerminalInPanel,
  onOpenTerminalPip,
}) {
  const rooms = data?.rooms || [];
  const categories = data?.categories || [];
  const room = currentRoomId ? rooms.find(r => r.id === currentRoomId) : null;

  if (!room) {
    return (
      <div class="view">
        <header class="page-header">
          <h2>Rooms</h2>
          <p class="section-desc">Choisis une room dans la barre latérale. Tu peux <strong>démarrer</strong> une room comme un scénario : même lab, barre des tâches en bas, terminal et progression enregistrée.</p>
        </header>
      </div>
    );
  }

  const status = storage?.getRoomStatus(room.id) || 'not_started';
  const tasks = room.tasks || [];
  const doneCount = tasks.filter((_, i) => storage?.getRoomTaskDone(room.id, i)).length;
  const allDone = tasks.length > 0 && doneCount >= tasks.length;

  useEffect(() => {
    if (room?.id) dispatchLabAction({ action: ACTION.ROOM_OPENED, roomId: room.id });
  }, [room?.id]);

  useEffect(() => {
    if (!room || !storage) return;
    if (allDone && status !== 'completed') {
      storage.setRoomStatus(room.id, 'completed');
      onRoomStatusChange?.();
    }
  }, [room?.id, allDone, status, storage, onRoomStatusChange]);

  const cat = byCategory(categories, room.category);
  const isDone = (i) => storage?.getRoomTaskDone(room.id, i);
  const setDone = (i, done) => {
    storage?.setRoomTaskDone(room.id, i, done);
    if (done) dispatchLabAction({ action: ACTION.ROOM_TASK_DONE, roomId: room.id, taskIndex: i });
    storage?.setLastRoom(room.id);
    storage?.setRoomStatus(room.id, 'in_progress');
    onRoomStatusChange?.();
  };

  const machineUrl = (m) => {
    if (m.urlKey) {
      if (m.urlKey === 'terminal') return getTerminalUrl();
      if (m.urlKey === 'desktop') return getDesktopUrl();
      const { url } = getMachineUrl(m.urlKey);
      return url;
    }
    return m.url || '#';
  };

  const startRoom = () => onStartRoom?.(room.id);
  const resumeRoom = () => onResumeRoom?.(room.id);
  const pauseRoom = () => { storage?.setRoomStatus(room.id, 'paused'); onRoomStatusChange?.(); };
  const abandonRoom = () => { storage?.setRoomStatus(room.id, 'abandoned'); onRoomStatusChange?.(); onAbandonRoom?.(room.id); };
  const resetRoom = () => { storage?.setRoomStatus(room.id, 'not_started'); onRoomStatusChange?.(); };

  const statusLabel = { not_started: 'Non commencée', in_progress: 'En cours', completed: 'Terminée', abandoned: 'Abandonnée', paused: 'En pause' }[status] || status;
  const roomStarted = status !== 'not_started' && status !== 'abandoned';

  return (
    <div id="view-room" class="view view-scenario-with-terminal active">
      <header class="page-header room-header scenario-header">
        <div class="room-meta scenario-header-row">
          <span class="badge room-badge" style={{ background: (cat.color || '') + '22', color: cat.color, border: `1px solid ${cat.color || '#999'}` }}>{cat.name || room.category}</span>
          <span class="difficulty-badge difficulty">{escapeHtml(room.difficulty || '')}</span>
          <span class={`scenario-status-badge status-${status}`}>{statusLabel}</span>
        </div>
        <h2 id="room-title">{escapeHtml(room.title)}</h2>
        <p class="room-description">{escapeHtml(room.description || '')}</p>
        <p class="scenario-mode-hint">Démarre la room pour obtenir un lab dédié, la barre des tâches en bas et l’accès au terminal. La progression est enregistrée localement.</p>
        <div class="scenario-actions">
          {status === 'not_started' && (
            <button type="button" class="btn btn-primary" onClick={startRoom}>Démarrer la room</button>
          )}
          {status === 'in_progress' && (
            <>
              <button type="button" class="btn btn-secondary" onClick={pauseRoom}>Mettre en pause</button>
              <button type="button" class="btn btn-secondary" onClick={() => onOpenTerminalInPanel?.()}>Ouvrir le terminal</button>
              <button type="button" class="topbar-btn" onClick={abandonRoom}>J'abandonne cette room</button>
            </>
          )}
          {status === 'paused' && (
            <>
              <button type="button" class="btn btn-primary" onClick={resumeRoom}>Reprendre la room</button>
              <button type="button" class="btn btn-secondary" onClick={() => onOpenTerminalInPanel?.()}>Ouvrir le terminal</button>
              <button type="button" class="topbar-btn" onClick={abandonRoom}>Abandonner</button>
            </>
          )}
          {status === 'abandoned' && (
            <button type="button" class="topbar-btn" onClick={resetRoom}>Reprendre (réinitialiser le statut)</button>
          )}
        </div>
      </header>

      {(room.objectives || []).length > 0 && (
        <section class="room-section">
          <h3>Objectifs</h3>
          <ul class="room-objectives">
            {(room.objectives || []).map((o, i) => <li key={i}>{escapeHtml(o)}</li>)}
          </ul>
        </section>
      )}

      {(room.machines || []).length > 0 && (
        <section class={`room-section machines-section ${!roomStarted ? 'room-section-locked' : ''}`}>
          <h3>Machines & accès</h3>
          {!roomStarted ? (
            <p class="room-locked-message">Démarrer la room pour accéder aux machines et au terminal.</p>
          ) : (
            <div class="machine-cards">
              {(room.machines || []).map((m, i) => (
                <div key={i} class={`machine-card ${m.urlKey === 'terminal' ? 'machine-card-terminal' : ''}`}>
                  <strong>{escapeHtml(m.name || m.urlKey || '')}</strong>
                  {m.urlKey === 'terminal' ? (
                    <>
                      <p class="machine-note">Panneau à droite, PiP flottant ou nouvel onglet. En cas d’erreur 502, attendre quelques secondes que le terminal démarre.</p>
                      <div class="machine-card-actions">
                        <button type="button" class="btn btn-small" onClick={() => onOpenTerminalInPanel?.()}>Panneau</button>
                        <button type="button" class="btn btn-small" onClick={() => onOpenTerminalPip?.()}>PiP</button>
                        <a href={getTerminalUrl()} target="_blank" rel="noopener" class="btn btn-small">Nouvel onglet</a>
                      </div>
                    </>
                  ) : (
                    <>
                      {(m.credentials || m.note) && <p class="machine-note">{escapeHtml(m.credentials || m.note || '')}</p>}
                      <div class="machine-card-actions">
                        {(m.urlKey || m.url) && machineUrl(m) !== '#' && (
                          <a href={machineUrl(m)} target="_blank" rel="noopener" class="btn btn-small" onClick={() => m.urlKey && dispatchLabAction({ action: ACTION.TARGET_OPENED, target: m.urlKey })}>Ouvrir la cible (nouvel onglet)</a>
                        )}
                        <button type="button" class="btn btn-small" onClick={() => onOpenTerminalInPanel?.()}>Terminal</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {(room.tasks || []).length > 0 && (
        <section class={`room-section ${!roomStarted ? 'room-section-locked' : ''}`}>
          <h3>Tâches {roomStarted ? `(${doneCount}/${tasks.length})` : ''}</h3>
          {!roomStarted ? (
            <p class="room-locked-message">Démarrer la room pour cocher les tâches et enregistrer ta progression.</p>
          ) : (
            <>
              <p class="section-desc">Progression enregistrée localement. Visible dans la barre en bas et dans Progression.</p>
              <div class="tasks-list scenario-tasks">
                {tasks.map((t, i) => (
                  <div key={i} class={`task-item ${isDone(i) ? 'done' : ''}`}>
                    <input
                      type="checkbox"
                      class="task-checkbox"
                      checked={!!isDone(i)}
                      onChange={e => setDone(i, e.target.checked)}
                    />
                    <div class="task-content">
                      <div class="task-title">{escapeHtml(t.title)}</div>
                      {t.content && <p>{escapeHtml(t.content)}</p>}
                      {t.tip && <p class="room-task-tip">💡 {escapeHtml(t.tip)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {(!room.objectives || room.objectives.length === 0) && (!room.machines || room.machines.length === 0) && (!room.tasks || room.tasks.length === 0) && (
        <p class="section-desc text-muted">Aucun objectif ou tâche défini pour cette room.</p>
      )}
    </div>
  );
}
