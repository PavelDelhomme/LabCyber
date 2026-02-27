import { useState, useEffect } from 'preact/hooks';

const BACKEND_LABELS = {
  docker: 'Docker',
  qemu: 'QEMU (Linux, Windows, appliances)',
  dynamips: 'Dynamips (Cisco routeurs)',
  iol: 'IOL (Cisco switchs)',
  'qemu-network': 'QEMU (routeurs, switchs, WiFi)',
};
const STORAGE_KEY = 'lab-cyber-eve-ng-saved-images';
const CUSTOM_IMAGES_KEY = 'lab-cyber-custom-images';
const WORKFLOW_NOTES_KEY = 'lab-cyber-eve-ng-workflow-notes';

const TYPE_OPTIONS = [
  { value: 'qemu', label: 'QEMU (Linux, Windows, appliances)' },
  { value: 'dynamips', label: 'Dynamips (Cisco routeurs)' },
  { value: 'iol', label: 'IOL (Cisco switchs)' },
];

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

function loadCustomImages() {
  try {
    const raw = localStorage.getItem(CUSTOM_IMAGES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveCustomImages(list) {
  try {
    localStorage.setItem(CUSTOM_IMAGES_KEY, JSON.stringify(list));
  } catch (_) {}
}

export default function EveNgSimulatorView({ onNavigate }) {
  const [catalog, setCatalog] = useState(null);
  const [saved, setSaved] = useState(loadSavedImages);
  const [customImages, setCustomImages] = useState(loadCustomImages);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [addForm, setAddForm] = useState({ name: '', url: '', type: 'qemu', filename: '' });
  const [workflowNotes, setWorkflowNotes] = useState(() => {
    try { return localStorage.getItem(WORKFLOW_NOTES_KEY) || ''; } catch { return ''; }
  });

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

  useEffect(() => {
    fetch('/data/customImages.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const fromFile = data?.images || [];
        if (fromFile.length > 0) {
          setCustomImages((prev) => {
            const byUrl = new Map(prev.map((i) => [i.url, i]));
            fromFile.forEach((i) => { if (i.url) byUrl.set(i.url, { ...i, ...(byUrl.get(i.url) || {}) }); });
            const next = Array.from(byUrl.values());
            saveCustomImages(next);
            return next;
          });
        }
      })
      .catch(() => {});
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

  const getAllImages = () => {
    if (!catalog?.byBackend) return [];
    return Object.entries(catalog.byBackend || {}).flatMap(([backend, images]) =>
      (images || []).map((img) => ({ ...img, backend }))
    );
  };

  const imagesByCategory = () => {
    const all = getAllImages();
    const byCat = {};
    all.forEach((img) => {
      const cat = img.category || 'other';
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(img);
    });
    const filtered = categoryFilter
      ? { [categoryFilter]: byCat[categoryFilter] || [] }
      : byCat;
    return filtered;
  };

  const categories = catalog?.categories || {};
  // Toujours HTTPS sur 4443 : mode HTTPS-Only du navigateur exige HTTPS.
  // http://127.0.0.1:4080 → iframe eve-ng.lab:4080 = bloqué. On force https://eve-ng.lab:4443.
  const EVE_NG_HTTPS_PORT = 4443;
  const eveNgUrl = typeof window !== 'undefined'
    ? `https://eve-ng.lab:${EVE_NG_HTTPS_PORT}/#!/login`
    : 'http://127.0.0.1:9080/#!/login';

  const saveWorkflowNotes = (v) => {
    setWorkflowNotes(v);
    try { localStorage.setItem(WORKFLOW_NOTES_KEY, v); } catch (_) {}
  };

  return (
    <div id="view-eve-ng-sim" class="view eve-ng-sim-view">
      <header class="page-header">
        <h1 class="page-title">Simulateur lab (type EVE-NG)</h1>
        <p class="page-desc text-muted">
          Catalogue complet d'images intégrées : PC, serveurs, routeurs Cisco, commutateurs, Linux, Windows (7/10/11), Windows Server, attaquant (Kali), DHCP, DNS, WiFi, pare-feu, Android, etc. Toutes disponibles pour l'export et le lab.
        </p>
        <div class="eve-ng-sim-links" style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <a
            href={eveNgUrl}
            class="btn btn-primary"
            target="_blank"
            rel="noopener noreferrer"
            title="Ouvrir EVE-NG (via proxy eve-ng.lab — évite CORS/mixed content)"
          >
            🌐 Ouvrir EVE-NG en nouvel onglet
          </a>
          <button type="button" class="btn btn-secondary" onClick={() => onNavigate('network-sim')}>
            Ouvrir le simulateur réseau (carte, topologie)
          </button>
          <a href="/docs/15-SIMULATEUR-EVE-NG.md" class="btn btn-secondary" target="_blank" rel="noopener">
            Doc : 15-SIMULATEUR-EVE-NG
          </a>
          <a href="/docs/18-EVE-NG-IMPORT-IMAGES.md" class="btn btn-secondary" target="_blank" rel="noopener">
            Import images (18)
          </a>
        </div>
        <p class="text-muted" style={{ marginTop: '0.35rem', fontSize: '0.85rem' }}>
          L’interface EVE-NG nécessite <code>make eve-ng-boot</code>. Login web : <strong>admin</strong> / <strong>eve</strong>. Mode HTTPS-Only : <code>https://127.0.0.1:4443</code>. Ajoute <code>127.0.0.1 eve-ng.lab</code> dans <code>/etc/hosts</code>.
        </p>
      </header>

      {/* Interface EVE-NG complète (login + labs) — rendu identique à 127.0.0.1:9080/#!/login */}
      <section class="eve-ng-sim-iframe-section" aria-labelledby="eve-ng-iframe-heading" style={{ marginTop: '1rem' }}>
        <h2 id="eve-ng-iframe-heading" class="eve-ng-sim-section-title">Interface EVE-NG complète</h2>
        <p class="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          Rendu identique à <code>http://127.0.0.1:9080/#!/login</code>. VM démarrée : <code>make eve-ng-boot</code>. Login : <strong>admin</strong> / <strong>eve</strong>.
        </p>
        <div class="eve-ng-sim-iframe-wrap" style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', minHeight: '75vh', background: 'var(--bg-secondary)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <iframe
            src={eveNgUrl}
            title="Interface EVE-NG — login et labs"
            class="eve-ng-sim-iframe"
            style={{ width: '100%', height: '75vh', minHeight: '600px', border: 'none', display: 'block' }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      </section>

      {/* Notes workflow — ce que je veux dans mon simulateur */}
      <section class="eve-ng-sim-section" aria-labelledby="eve-ng-notes-heading" style={{ marginTop: '1.5rem' }}>
        <h2 id="eve-ng-notes-heading" class="eve-ng-sim-section-title">📝 Notes workflow — ce que je veux dans mon simulateur</h2>
        <p class="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          Note les fonctionnalités, le workflow de test, les idées pour ton propre simulateur type EVE-NG. Sauvegardé localement (localStorage).
        </p>
        <textarea
          value={workflowNotes}
          onInput={(e) => saveWorkflowNotes(e.target.value)}
          placeholder="Ex: workflow login → créer lab → add node → start → console… Ce que je veux : topologie graphique, export JSON, intégration Docker…"
          style={{ width: '100%', minHeight: '140px', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'vertical' }}
          class="eve-ng-workflow-notes"
        />
      </section>

      {loading && <p class="text-muted">Chargement du catalogue d'images…</p>}
      {error && <p class="eve-ng-sim-error" style={{ color: 'var(--red)' }}>{error}</p>}

      {catalog && (
        <>
          <section class="eve-ng-sim-section" aria-labelledby="eve-ng-catalog-heading">
            <h2 id="eve-ng-catalog-heading" class="eve-ng-sim-section-title">Catalogue complet — toutes les images intégrées</h2>
            <p class="eve-ng-sim-section-desc text-muted">
              PC, serveurs, routeurs Cisco, commutateurs, Linux, Windows, attaquant, DHCP, WiFi, pare-feu… Filtrer par catégorie. Option « Favori » pour prioriser à l'export.
            </p>
            <div class="eve-ng-sim-catalog-filters" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                class={`btn btn-secondary ${!categoryFilter ? 'btn-primary' : ''}`}
                onClick={() => setCategoryFilter('')}
              >
                Toutes
              </button>
              {Object.entries(categories).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  class={`btn btn-secondary ${categoryFilter === id ? 'btn-primary' : ''}`}
                  onClick={() => setCategoryFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div class="eve-ng-sim-catalog">
              {Object.entries(imagesByCategory()).map(([catId, images]) =>
                images.length > 0 ? (
                  <div key={catId} class="eve-ng-sim-backend-block" data-category={catId}>
                    <h3 class="eve-ng-sim-backend-title">{categories[catId] || catId}</h3>
                    <ul class="eve-ng-sim-image-list">
                      {images.map((img) => {
                        const key = `${img.backend}:${img.id}`;
                        const isSaved = saved.includes(key);
                        return (
                          <li key={key} class="eve-ng-sim-image-card">
                            <div class="eve-ng-sim-image-info">
                              <strong>{img.name || img.id}</strong>
                              <span class="eve-ng-sim-backend-badge" style={{ fontSize: '0.7rem', opacity: 0.8 }}>{BACKEND_LABELS[img.backend] || img.backend}</span>
                              {img.description && <span class="eve-ng-sim-image-desc">{img.description}</span>}
                              <code class="eve-ng-sim-image-ref">{img.image}</code>
                            </div>
                            <button
                              type="button"
                              class={`btn ${isSaved ? 'btn-primary' : 'btn-secondary'}`}
                              onClick={() => (isSaved ? removeFromSaved(key) : addToSaved(img.backend, img.id))}
                              title={isSaved ? 'Retirer des favoris' : 'Ajouter aux favoris (priorité export)'}
                            >
                              {isSaved ? '★ Favori' : '☆ Favori'}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null
              )}
            </div>
          </section>

          <section class="eve-ng-sim-section" aria-labelledby="eve-ng-custom-heading" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
            <h2 id="eve-ng-custom-heading" class="eve-ng-sim-section-title">Ajouter des images personnalisées</h2>
            <p class="eve-ng-sim-section-desc text-muted">
              Ajoute une image par nom et URL. L'image sera téléchargée automatiquement dans le projet quand tu lanceras <code>make lab-images-sync</code>.
            </p>
            <form
              class="eve-ng-custom-form"
              style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1rem' }}
              onSubmit={(e) => {
                e.preventDefault();
                if (!addForm.url?.trim()) return;
                const entry = {
                  name: addForm.name?.trim() || addForm.url.split('/').pop().split('?')[0],
                  url: addForm.url.trim(),
                  type: addForm.type || 'qemu',
                  filename: addForm.filename?.trim() || undefined,
                };
                setCustomImages((prev) => {
                  const next = [...prev, entry];
                  saveCustomImages(next);
                  return next;
                });
                setAddForm({ name: '', url: '', type: 'qemu', filename: '' });
              }}
            >
              <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 0.85 }}>Nom</span>
                <input
                  type="text"
                  placeholder="ex: Alpine Linux"
                  value={addForm.name}
                  onInput={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  style={{ padding: '0.35rem 0.5rem', minWidth: 140 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 200 }}>
                <span style={{ fontSize: 0.85 }}>URL (téléchargement direct)</span>
                <input
                  type="url"
                  placeholder="https://..."
                  required
                  value={addForm.url}
                  onInput={(e) => setAddForm((f) => ({ ...f, url: e.target.value }))}
                  style={{ padding: '0.35rem 0.5rem' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 0.85 }}>Type</span>
                <select
                  value={addForm.type}
                  onChange={(e) => setAddForm((f) => ({ ...f, type: e.target.value }))}
                  style={{ padding: '0.35rem 0.5rem' }}
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 0.85 }}>Fichier (optionnel)</span>
                <input
                  type="text"
                  placeholder="nom.qcow2"
                  value={addForm.filename}
                  onInput={(e) => setAddForm((f) => ({ ...f, filename: e.target.value }))}
                  style={{ padding: '0.35rem 0.5rem', minWidth: 120 }}
                />
              </label>
              <button type="submit" class="btn btn-primary">Ajouter</button>
            </form>
            {customImages.length > 0 && (
              <>
                <ul class="eve-ng-sim-saved-list" style={{ marginBottom: '0.75rem' }}>
                  {customImages.map((img, i) => (
                    <li key={i} class="eve-ng-sim-saved-item">
                      <span class="eve-ng-sim-saved-badge">{img.type}</span>
                      <span class="eve-ng-sim-saved-name">{img.name}</span>
                      <code style={{ fontSize: 0.75, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }} title={img.url}>{img.url}</code>
                      <button
                        type="button"
                        class="btn btn-secondary eve-ng-sim-remove"
                        onClick={() => {
                          setCustomImages((prev) => {
                            const next = prev.filter((_, j) => j !== i);
                            saveCustomImages(next);
                            return next;
                          });
                        }}
                      >
                        Retirer
                      </button>
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    class="btn btn-secondary"
                    onClick={() => {
                      const blob = new Blob(
                        [JSON.stringify({ description: 'Images personnalisées LabCyber', images: customImages }, null, 2)],
                        { type: 'application/json' }
                      );
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = 'customImages.json';
                      a.click();
                      URL.revokeObjectURL(a.href);
                    }}
                  >
                    Exporter customImages.json
                  </button>
                  <span class="text-muted" style={{ fontSize: 0.85, alignSelf: 'center' }}>
                    Place le fichier dans <code>platform/data/customImages.json</code> puis lance <code>make lab-images-sync</code>
                  </span>
                </div>
              </>
            )}

          </section>

          <section class="eve-ng-sim-section" aria-labelledby="eve-ng-saved-heading">
            <h2 id="eve-ng-saved-heading" class="eve-ng-sim-section-title">Favoris pour l'export</h2>
            <p class="eve-ng-sim-section-desc text-muted">
              Images sélectionnées comme prioritaires pour l'export de topologie (PC, routeur, switch par défaut).
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
              <li>Les favoris ci-dessus servent d'images par défaut (PC, routeur, switch) lors de l'export.</li>
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
