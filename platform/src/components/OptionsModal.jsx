export default function OptionsModal({ open, onClose, storage }) {
  if (!open) return null;

  const pipAuto = storage?.getPipAuto?.() ?? false;

  const handlePipAuto = (e) => {
    storage?.setPipAuto?.(e.target.checked);
  };

  const exportProgress = () => {
    if (!storage) return;
    const data = {
      lastScenario: storage.getLastScenario?.(),
      lastTaskIndex: storage.getLastTaskIndex?.(),
      pipAuto: storage.getPipAuto?.(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `labcyber-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    onClose();
  };

  const resetProgress = () => {
    if (typeof window !== 'undefined' && window.confirm('Réinitialiser toute la progression (tâches cochées, scénario en cours) ?')) {
      storage?.clearProgress?.();
      onClose();
    }
  };

  return (
    <div class="modal" role="dialog" aria-modal="true" onClick={e => e.target === e.currentTarget && onClose()}>
      <div class="modal-content" onClick={e => e.stopPropagation()}>
        <div class="modal-header">
          <h2>Options</h2>
          <button type="button" class="modal-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <div class="modal-body">
          <div class="option-row">
            <label>
              <input type="checkbox" checked={pipAuto} onChange={handlePipAuto} />
              Ouvrir le PiP scénario quand je lance un scénario
            </label>
          </div>
          <div class="option-row">
            <button type="button" class="topbar-btn" onClick={exportProgress}>Exporter ma progression (JSON)</button>
          </div>
          <div class="option-row">
            <button type="button" class="topbar-btn danger" onClick={resetProgress}>Réinitialiser toute la progression</button>
          </div>
        </div>
      </div>
    </div>
  );
}
