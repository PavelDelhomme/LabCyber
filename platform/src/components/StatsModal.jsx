export default function StatsModal({ open, onClose, scenarios, storage }) {
  if (!open) return null;

  const getProgress = (s) => {
    if (!storage || !s.tasks || !s.tasks.length) return { done: 0, total: 0 };
    let done = 0;
    s.tasks.forEach((_, i) => { if (storage.getTaskDone(s.id, i)) done++; });
    return { done, total: s.tasks.length };
  };

  return (
    <div class="modal" role="dialog" aria-modal="true" onClick={e => e.target === e.currentTarget && onClose()}>
      <div class="modal-content" onClick={e => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Statistiques</h2>
          <button type="button" class="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <div class="modal-body">
          <h3>Avancement par scénario</h3>
          <div class="stats-scenarios">
            {(scenarios || []).map(s => {
              const { done, total } = getProgress(s);
              return (
                <div key={s.id} class="stat-row">
                  <span class="stats-title">{s.title}</span>
                  <span class="stats-progress">{done}/{total} tâches</span>
                </div>
              );
            })}
          </div>
          <p class="stats-hint">La progression est enregistrée localement (navigateur).</p>
        </div>
      </div>
    </div>
  );
}
