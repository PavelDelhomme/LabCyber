import { useState, useEffect } from 'preact/hooks';

const DOC_CATEGORIES = [
  { id: 'cyber', name: 'Cybersécurité' },
  { id: 'network', name: 'Réseau' },
  { id: 'system', name: 'Systèmes' },
  { id: 'admin', name: 'Administration' },
  { id: 'dev', name: 'Développement' },
  { id: 'database', name: 'Bases de données' },
];

export default function OptionsView({ onNavigate, storage }) {
  const [pipAuto, setPipAuto] = useState(false);
  const [docPrefs, setDocPrefs] = useState({ customSources: [], versionOverrides: {}, autoFetchIds: [] });
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState('cyber');

  useEffect(() => {
    if (storage) {
      setPipAuto(storage.getPipAuto?.() ?? false);
      setDocPrefs(storage.getDocPreferences?.() ?? { customSources: [], versionOverrides: {}, autoFetchIds: [] });
    }
  }, [storage]);

  const handlePipAuto = (e) => {
    const v = e.target.checked;
    setPipAuto(v);
    storage?.setPipAuto?.(v);
  };

  const addCustomSource = () => {
    const url = (newUrl || '').trim();
    const label = (newLabel || '').trim() || url || 'Sans titre';
    if (!url) return;
    const id = 'custom-' + Date.now();
    const next = { ...docPrefs, customSources: [...(docPrefs.customSources || []), { id, label, url, category: newCategory }] };
    setDocPrefs(next);
    storage?.setDocPreferences?.(next);
    setNewUrl('');
    setNewLabel('');
  };

  const removeCustomSource = (id) => {
    const next = { ...docPrefs, customSources: (docPrefs.customSources || []).filter(s => s.id !== id) };
    setDocPrefs(next);
    storage?.setDocPreferences?.(next);
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
  };

  const resetProgress = () => {
    if (typeof window !== 'undefined' && window.confirm('Réinitialiser toute la progression (tâches cochées, scénario en cours) ?')) {
      storage?.clearProgress?.();
    }
  };

  return (
    <div class="options-view">
      <div class="page-header">
        <h2>Options</h2>
        <button type="button" class="btn btn-secondary" onClick={() => onNavigate?.('dashboard')}>← Retour à l'accueil</button>
      </div>

      <div class="options-view-card card">
        <h3 class="option-section-title">Général</h3>
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

      <div class="options-view-card card">
        <h3 class="option-section-title">Bibliothèque doc (hors ligne)</h3>
        <p class="option-section-desc">Ajoutez des sources de documentation personnalisées (URL). Elles apparaîtront dans la vue Bibliothèque doc.</p>
        <div class="option-row option-doc-custom">
          <input type="url" class="option-input" placeholder="URL (ex. https://docs.example.com)" value={newUrl} onInput={e => setNewUrl(e.target.value)} />
          <input type="text" class="option-input" placeholder="Nom (ex. My Docs)" value={newLabel} onInput={e => setNewLabel(e.target.value)} />
          <select class="option-select" value={newCategory} onInput={e => setNewCategory(e.target.value)}>
            {DOC_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="button" class="topbar-btn" onClick={addCustomSource}>Ajouter</button>
        </div>
        {(docPrefs.customSources || []).length > 0 && (
          <ul class="option-doc-list">
            {(docPrefs.customSources || []).map(s => (
              <li key={s.id} class="option-doc-item">
                <span class="option-doc-item-label">{s.label}</span>
                <span class="option-doc-item-url">{s.url}</span>
                <button type="button" class="option-doc-remove" onClick={() => removeCustomSource(s.id)} aria-label="Supprimer">×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
