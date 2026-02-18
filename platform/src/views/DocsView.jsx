import { useState } from 'preact/hooks';
import { escapeHtml } from '../lib/store';

export default function DocsView({ docs }) {
  const [viewerContent, setViewerContent] = useState(null);
  const [rawContent, setRawContent] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const openDoc = (file) => {
    setViewerContent(null);
    setRawContent(null);
    setError(null);
    setShowRaw(false);
    setLoading(true);
    fetch(`/docs/${file}`)
      .then(r => { if (!r.ok) throw new Error('Non trouvé'); return r.text(); })
      .then(md => {
        setRawContent(md);
        setViewerContent(typeof marked !== 'undefined' ? marked.parse(md) : md.replace(/</g, '&lt;'));
        setLoading(false);
      })
      .catch(() => {
        setError('Document non disponible.');
        setLoading(false);
      });
  };

  const copyRaw = () => {
    if (rawContent && navigator.clipboard) {
      navigator.clipboard.writeText(rawContent);
    }
  };

  const entries = docs?.entries || [];
  const docsLoaded = docs !== null;

  return (
    <div id="view-docs" class="view view-docs">
      <header class="page-header docs-header">
        <h2 id="docs-title">{docs?.title || 'Documentation du projet'}</h2>
        <p id="docs-description" class="room-description">{docs?.description || 'Accès à la documentation du lab (démarrage, usage, tests, catégories).'} Clique sur un fichier dans la liste pour l’ouvrir.</p>
      </header>
      <div class="docs-layout">
        <nav class="docs-nav">
          <h3>Fichiers</h3>
          <ul id="docs-list" class="docs-list">
            {entries.length === 0 && <li class="text-muted">Aucun document dans la liste. Vérifiez que <code>/data/docs.json</code> et le dossier <code>/docs/</code> sont servis (ex. via <code>public/</code>).</li>}
            {entries.map(e => (
              <li key={e.id}>
                <button type="button" class="docs-list-btn" onClick={() => openDoc(e.file)}>{escapeHtml(e.name)}</button>
              </li>
            ))}
          </ul>
        </nav>
        <div id="docs-viewer" class="docs-viewer">
          {!viewerContent && !loading && !error && <div class="docs-viewer-placeholder">Choisissez un document dans la liste.</div>}
          {loading && <p class="docs-loading">Chargement…</p>}
          {error && <p class="docs-error">{error}</p>}
          {viewerContent && !showRaw && (
            <div>
              <div class="docs-viewer-actions">
                <button type="button" class="topbar-btn" onClick={() => setShowRaw(true)}>Voir la source</button>
              </div>
              <div class="docs-viewer-content doc-rendered" dangerouslySetInnerHTML={{ __html: viewerContent.replace(/<a /g, '<a target="_blank" rel="noopener" ') }} />
            </div>
          )}
          {viewerContent && showRaw && (
            <div>
              <div class="docs-viewer-actions">
                <button type="button" class="topbar-btn" onClick={copyRaw}>Copier la source</button>
                <button type="button" class="topbar-btn" onClick={() => setShowRaw(false)}>Voir le rendu</button>
              </div>
              <pre class="docs-viewer-raw">{rawContent}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
