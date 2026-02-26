import { useState, useEffect } from 'preact/hooks';

const BACKEND_LABELS = { docker: 'Docker', dynamips: 'Dynamips (Cisco)', iol: 'IOL (Cisco)' };
const STORAGE_KEY = 'lab-cyber-eve-ng-saved-images';

function loadSavedImages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveSavedImages(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

export default function EveNgSimulatorView({ onNavigate }) {
  const [catalog, setCatalog] = useState(null);
  const [saved, setSaved] = useState(loadSavedImages);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/data/backendImages.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setCatalog(data || { byBackend: {} });
        setError(null);
      })
      .catch((e) => {
        setError(e.message || 'Erreur chargement catalogue');
        setCatalog({ byBackend: {} });
      })
      .finally(() => setLoading(false));
  }, []);

  const addToSaved = (backend, id) => {
    const key = `${backend}:${id}`;
    setSaved((prev) => {
      if (prev.includes(key)) return prev;
      const next = [...prev, key];
      saveSavedImages(next);
      return next;
    });
  };

  const removeFromSaved = (key) => {
    setSaved((prev) => {
      const next = prev.filter((k) => k !== key);
      saveSavedImages(next);
      return next;
    });
  };

  const getImageByKey = (key) => {
    if (!catalog?.byBackend) return null;
    const [backend, id] = key.split(':');
    const list = catalog.byBackend[backend] || [];
    return list.find((img) => img.id === id) || null;
  };

  return (
    <div id="view-eve-ng-sim" class="view eve-ng-sim-view">
      <header class="page-header">
        <h1 class="page-title">Simulateur lab (type EVE-NG)</h1>
        <p class="page-desc text-muted">
          Nouvelle page dédiée au lab type EVE-NG : catalogue d'images (Docker, Dynamips, IOL), images mises de côté, et préparation au démarrage du lab. L'interface classique du simulateur reste disponible séparément.
        </p>
        <div class="eve-ng-sim-links" style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" class="btn btn-secondary" onClick={() => onNavigate('network-sim')}>
            Ouvrir le simulateur réseau (carte, topologie)
          </button>
          <a href="/docs/15-SIMULATEUR-EVE-NG.md" class="btn btn-secondary" target="_blank" rel="noopener">
            Doc : 15-SIMULATEUR-EVE-NG.md
          </a>
        </div>
      </header>

      {loading && <p class="text-muted">Chargement du catalogue d'images…</p>}
      {error && <p class="eve-ng-sim-error" style={{ color: 'var(--red)' }}>{error}</p>}

      {catalog && (
        <>
          <section class="eve-ng-sim-section" aria-labelledby="eve-ng-catalog-heading">
            <h2 id="eve-ng-catalog-heading" class="eve-ng-sim-section-title">Catalogue d'images</h2>
            <p class="eve-ng-sim-section-desc text-muted">
              Images disponibles par backend (PC/serveur → Docker, routeur → Dynamips, switch → IOL). Utilisez « Mettre de côté » pour garder les images à utiliser dans le lab.
            </p>
            <div class="eve-ng-sim-catalog">
              {Object.entries(catalog.byBackend || {}).map(([backend, images]) => (
                <div key={backend} class="eve-ng-sim-backend-block" data-backend={backend}>
                  <h3 class="eve-ng-sim-backend-title">{BACKEND_LABELS[backend] || backend}</h3>
                  <ul class="eve-ng-sim-image-list">
                    {(images || []).map((img) => {
                      const key = `${backend}:${img.id}`;
                      const isSaved = saved.includes(key);
                      return (
                        <li key={img.id} class="eve-ng-sim-image-card">
                          <div class="eve-ng-sim-image-info">
                            <strong>{img.name || img.id}</strong>
                            {img.description && <span class="eve-ng-sim-image-desc">{img.description}</span>}
                            <code class="eve-ng-sim-image-ref">{img.image}</code>
                          </div>
                          <button
                            type="button"
                            class={`btn ${isSaved ? 'btn-secondary' : 'btn-primary'}`}
                            disabled={isSaved}
                            onClick={() => addToSaved(backend, img.id)}
                            title={isSaved ? 'Déjà mise de côté' : 'Mettre de côté'}
                          >
                            {isSaved ? '✓ Mise de côté' : 'Mettre de côté'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section class="eve-ng-sim-section" aria-labelledby="eve-ng-saved-heading">
            <h2 id="eve-ng-saved-heading" class="eve-ng-sim-section-title">Images mises de côté</h2>
            <p class="eve-ng-sim-section-desc text-muted">
              Liste des images que vous avez mises de côté pour ne pas les perdre. Elles pourront être utilisées comme images par défaut pour le lab.
            </p>
            {saved.length === 0 ? (
              <p class="text-muted">Aucune image mise de côté. Utilisez le catalogue ci-dessus.</p>
            ) : (
              <ul class="eve-ng-sim-saved-list">
                {saved.map((key) => {
                  const img = getImageByKey(key);
                  const [backend] = key.split(':');
                  return (
                    <li key={key} class="eve-ng-sim-saved-item">
                      <span class="eve-ng-sim-saved-badge">{BACKEND_LABELS[backend] || backend}</span>
                      <span class="eve-ng-sim-saved-name">{img ? img.name || img.id : key}</span>
                      <button
                        type="button"
                        class="btn btn-secondary eve-ng-sim-remove"
                        onClick={() => removeFromSaved(key)}
                        title="Retirer de la liste"
                      >
                        Retirer
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section class="eve-ng-sim-section" aria-labelledby="eve-ng-start-heading">
            <h2 id="eve-ng-start-heading" class="eve-ng-sim-section-title">Démarrer le lab</h2>
            <p class="eve-ng-sim-section-desc text-muted">
              Le service backend qui lance les conteneurs (Docker) et les émulateurs (Dynamips, IOL) à partir de la topologie n'est pas encore branché. En attendant :
            </p>
            <ul class="eve-ng-sim-section-list">
              <li>Construisez votre topologie dans le <button type="button" class="btn-link" onClick={() => onNavigate('network-sim')}>simulateur réseau</button>.</li>
              <li>Utilisez le bouton « Exporter la topologie (backend lab) » sur le simulateur pour obtenir le JSON au format EVE-NG.</li>
              <li>Les images mises de côté ci-dessus pourront être utilisées comme images par défaut (PC/serveur, routeur, switch) lors de l'export ou du démarrage futur.</li>
            </ul>
            <p class="text-muted" style={{ marginTop: '0.5rem' }}>
              Prochaine étape prévue : API ou script backend qui lit le JSON exporté, crée les réseaux et lance les conteneurs/processus. Voir <code>platform/docs/15-SIMULATEUR-EVE-NG.md</code>.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
