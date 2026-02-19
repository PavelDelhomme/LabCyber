import { useState, useEffect, useMemo } from 'preact/hooks';
import { escapeHtml } from '../lib/store';

const FILTER_ALL = 'all';
const FILTER_CACHED = 'cached';
const FILTER_NOT_CACHED = 'not_cached';

/** Enlève scripts et attributs d'événement pour affichage sécurisé. */
function sanitizeHtml(html) {
  if (typeof html !== 'string') return '';
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
}

export default function DocOfflineView({ docSources, docId, getOfflineDoc, setOfflineDoc, getOfflineDocIds, getDocPreferences, onOpenDoc, onBack }) {
  const categories = docSources?.categories || [];
  const catalogSources = docSources?.sources || [];
  const prefs = getDocPreferences?.() || {};
  const customSources = (prefs.customSources || []).map((cs, i) => ({
    id: cs.id || 'custom-' + i,
    label: cs.label || 'Custom',
    url: cs.url || '',
    category: cs.category || 'cyber',
    desc: cs.desc || ''
  }));
  const sources = useMemo(() => [...catalogSources, ...customSources], [catalogSources, prefs.customSources]);
  const [fetchingId, setFetchingId] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [cachedIds, setCachedIds] = useState([]);
  const [filter, setFilter] = useState(FILTER_ALL);

  const refreshCached = () => {
    if (getOfflineDocIds) setCachedIds(getOfflineDocIds());
  };
  useEffect(refreshCached, [getOfflineDocIds, fetchingId]);

  const cachedCount = cachedIds.length;
  const totalCount = sources.length;

  const fetchDoc = (source) => {
    if (!source?.id || !source?.url) return;
    setFetchingId(source.id);
    setFetchError(null);
    fetch(source.url, { mode: 'cors', credentials: 'omit' })
      .then(r => {
        if (!r.ok) throw new Error(r.statusText || 'Erreur HTTP');
        return r.text();
      })
      .then(text => {
        const ct = (text || '').trim();
        const contentType = (ct.startsWith('{') || ct.startsWith('[')) ? 'application/json' : 'text/html';
        setOfflineDoc?.(source.id, {
          content: text,
          contentType,
          fetchedAt: new Date().toISOString(),
          title: source.label || source.url
        });
        refreshCached();
      })
      .catch(err => {
        setFetchError(source.id);
        console.warn('DocOffline fetch failed:', source.url, err);
      })
      .finally(() => setFetchingId(null));
  };

  if (docId) {
    const source = sources.find(s => s.id === docId);
    const cached = getOfflineDoc?.(docId);
    return (
      <div id="view-doc-offline" class="view view-doc-offline">
        <header class="page-header">
          <nav class="learning-breadcrumb" aria-label="Fil d'Ariane">
            <a href="#/doc-offline" onClick={(e) => { e.preventDefault(); onBack?.(); }}>Bibliothèque doc</a>
            <span class="learning-breadcrumb-sep">›</span>
            <span>{source ? escapeHtml(source.label) : escapeHtml(docId)}</span>
          </nav>
          <h2>{source ? escapeHtml(source.label) : escapeHtml(docId)}</h2>
          {cached?.fetchedAt && <p class="room-description text-muted">Récupéré le {new Date(cached.fetchedAt).toLocaleString()}</p>}
        </header>
        <section class="room-section doc-offline-viewer">
          {!cached && (
            <p class="docs-error">Document non présent en cache. Récupérez-le depuis la liste (onglet Bibliothèque doc).</p>
          )}
          {cached?.content != null && source?.url && (
            <div class="doc-offline-actions">
              <a href={source.url} target="_blank" rel="noopener nofollow" class="doc-offline-link-external">
                <span class="doc-offline-link-icon" aria-hidden="true">↗</span> Ouvrir la page d’origine
              </a>
            </div>
          )}
          {cached?.content != null && (
            <div
              class="doc-offline-content doc-offline-content-isolated doc-rendered"
              dangerouslySetInnerHTML={{
                __html: cached.contentType && cached.contentType.includes('html')
                  ? sanitizeHtml(cached.content).replace(/<a /g, '<a target="_blank" rel="noopener" ')
                  : '<pre class="doc-offline-raw">' + escapeHtml(cached.content) + '</pre>'
              }}
            />
          )}
        </section>
      </div>
    );
  }

  const byCategory = useMemo(() => {
    const out = {};
    categories.forEach(c => { out[c.id] = { ...c, sources: [] }; });
    sources.forEach(s => {
      const cat = s.category || 'cyber';
      if (out[cat]) out[cat].sources.push(s); else (out[cat] = out[cat] || { sources: [] }).sources.push(s);
    });
    return out;
  }, [categories, sources]);

  const filteredCategories = useMemo(() => {
    return categories.map(cat => {
      let list = byCategory[cat.id]?.sources || [];
      if (filter === FILTER_CACHED) list = list.filter(s => cachedIds.includes(s.id));
      else if (filter === FILTER_NOT_CACHED) list = list.filter(s => !cachedIds.includes(s.id));
      return { ...cat, sources: list };
    }).filter(c => c.sources.length > 0);
  }, [categories, byCategory, filter, cachedIds]);

  const recentCached = useMemo(() => {
    return sources.filter(s => cachedIds.includes(s.id)).slice(0, 8);
  }, [sources, cachedIds]);

  return (
    <div id="view-doc-offline" class="view view-doc-offline">
      <header class="page-header">
        <h2>{docSources?.title || 'Bibliothèque de documentation'}</h2>
        <p class="room-description">{docSources?.description || 'Récupérez les documentations pour les consulter dans l’app, hors réseau. Mise à jour possible quand vous êtes connecté.'}</p>
      </header>
      <section class="room-section">
        {fetchError && <p class="docs-error">Certaines pages bloquent la récupération (CORS). Utilisez le lien « Ouvrir en ligne » pour les consulter.</p>}
        <div class="doc-offline-stats">
          <span class="doc-offline-stats-count">
            <strong>{cachedCount}</strong> disponible{cachedCount !== 1 ? 's' : ''} hors ligne / <strong>{totalCount}</strong> au total
          </span>
          <div class="doc-offline-filters" role="tablist">
            <button type="button" role="tab" class={`doc-offline-filter-btn ${filter === FILTER_ALL ? 'active' : ''}`} onClick={() => setFilter(FILTER_ALL)}>Tous</button>
            <button type="button" role="tab" class={`doc-offline-filter-btn ${filter === FILTER_CACHED ? 'active' : ''}`} onClick={() => setFilter(FILTER_CACHED)}>Récupérés</button>
            <button type="button" role="tab" class={`doc-offline-filter-btn ${filter === FILTER_NOT_CACHED ? 'active' : ''}`} onClick={() => setFilter(FILTER_NOT_CACHED)}>Non récupérés</button>
          </div>
        </div>
        {recentCached.length > 0 && (
          <div class="doc-offline-quick">
            <h3 class="doc-offline-quick-title">Accès rapide (récupérés)</h3>
            <ul class="doc-offline-quick-list">
              {recentCached.map(s => (
                <li key={s.id}>
                  <button type="button" class="doc-offline-quick-btn" onClick={() => onOpenDoc?.(s.id)}>{escapeHtml(s.label)}</button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p class="section-desc">Cliquez sur <strong>Récupérer</strong> pour télécharger la page et la consulter hors ligne. <strong>Mettre à jour</strong> remplace le cache par la dernière version en ligne.</p>
        <div class="doc-offline-categories">
          {filteredCategories.map(cat => (
            <div key={cat.id} class="doc-offline-category">
              <h3 class="doc-offline-cat-title">{cat.icon || ''} {escapeHtml(cat.name)}</h3>
              <ul class="doc-offline-list">
                {cat.sources.map(s => {
                  const isCached = cachedIds.includes(s.id);
                  const loading = fetchingId === s.id;
                  return (
                    <li key={s.id} class="doc-offline-item">
                      <div class="doc-offline-item-main">
                        <span class={`doc-offline-badge ${isCached ? 'doc-offline-badge-cached' : 'doc-offline-badge-online'}`}>
                          {isCached ? 'Hors ligne' : 'En ligne'}
                        </span>
                        <strong>{escapeHtml(s.label)}</strong>
                        {s.desc && <span class="text-muted"> – {escapeHtml(s.desc)}</span>}
                      </div>
                      <div class="doc-offline-item-actions">
                        <button type="button" class="doc-offline-btn doc-offline-btn-primary" onClick={() => fetchDoc(s)} disabled={loading}>
                          {loading ? '…' : (isCached ? 'Mettre à jour' : 'Récupérer')}
                        </button>
                        {isCached && (
                          <button type="button" class="doc-offline-btn" onClick={() => onOpenDoc?.(s.id)}>Ouvrir dans l’app</button>
                        )}
                        <a href={s.url} target="_blank" rel="noopener nofollow" class="doc-offline-link-external doc-offline-btn">
                          <span class="doc-offline-link-icon" aria-hidden="true">↗</span> Ouvrir en ligne
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
