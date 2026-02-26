import { useState, useMemo } from 'preact/hooks';
import { escapeHtml } from '../../lib/store';
import { EMBEDDED_LEARNING } from '../../lib/defaultData';

const OWASP_2021_ORDER = ['owasp-top10', 'owasp-top10-intro', 'owasp-a01', 'owasp-a02', 'owasp-a03', 'owasp-a04', 'owasp-a05', 'owasp-a06', 'owasp-a07', 'owasp-a08', 'owasp-a09', 'owasp-a10'];

export default function LearningView({ learning, learningTopicId, learningSubId, onNavigateLearning, docSources, onOpenDoc }) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const source = learning && (learning.topics?.length || learning.title) ? learning : EMBEDDED_LEARNING;
  const topics = source?.topics || [];

  const topic = learningTopicId ? topics.find(t => t.id === learningTopicId) : null;
  const sub = (topic && learningSubId) ? (topic.subcategories || []).find(s => s.id === learningSubId) : null;

  const owaspSources = useMemo(() => {
    const list = docSources?.sources || [];
    const byId = {};
    list.forEach(s => { byId[s.id] = s; });
    return OWASP_2021_ORDER.map(id => byId[id]).filter(Boolean);
  }, [docSources]);

  const goList = () => { if (onNavigateLearning) onNavigateLearning(null, null); else window.location.hash = '#/learning'; };
  const goTopic = (id) => { if (onNavigateLearning) onNavigateLearning(id, null); else window.location.hash = '#/learning/' + encodeURIComponent(id); };
  const goSub = (tid, sid) => { if (onNavigateLearning) onNavigateLearning(tid, sid); else window.location.hash = '#/learning/' + encodeURIComponent(tid) + '/' + encodeURIComponent(sid); };

  const openDocDetail = (item, type) => (e) => {
    if (e) e.preventDefault();
    setSelectedDoc({ type, label: item.label, url: item.url, desc: item.desc || '' });
  };
  const closeDocDetail = () => setSelectedDoc(null);

  const docModal = selectedDoc ? (
    <div class="learning-doc-modal-overlay" onClick={closeDocDetail} role="dialog" aria-modal="true" aria-label="Détail doc">
      <div class="learning-doc-modal" onClick={e => e.stopPropagation()}>
        <div class="learning-doc-modal-header">
          <h3>{escapeHtml(selectedDoc.label)}</h3>
          <button type="button" class="learning-doc-modal-close" onClick={closeDocDetail} aria-label="Fermer">×</button>
        </div>
        <div class="learning-doc-modal-body">
          {selectedDoc.desc && <p class="learning-doc-modal-desc">{escapeHtml(selectedDoc.desc)}</p>}
          {selectedDoc.url && <a href={selectedDoc.url} target="_blank" rel="noopener nofollow" class="learning-link">Ouvrir le lien</a>}
        </div>
      </div>
    </div>
  ) : null;

  if (topic && (!learningSubId || sub)) {
    return (
      <div class="learning-view-wrap learning-layout-with-nav">
        <nav class="learning-nav" aria-label="Doc & Cours">
          <a href="#/learning" class="learning-nav-back" onClick={(e) => { e.preventDefault(); goList(); }}>← Tous les thèmes</a>
          <h3 class="learning-nav-title">Thèmes</h3>
          <ul class="learning-nav-topics">
            {topics.map(t => (
              <li key={t.id}>
                <button type="button" class={`learning-nav-topic-btn ${t.id === topic.id ? 'active' : ''}`} onClick={() => goTopic(t.id)}>{t.icon || ''} {escapeHtml(t.name)}</button>
              </li>
            ))}
          </ul>
          <h3 class="learning-nav-title">Ce thème</h3>
          <ul class="learning-nav-sections">
            <li><a href="#doc" class="learning-nav-section-link">Documentation</a></li>
            <li><a href="#cours" class="learning-nav-section-link">Cours</a></li>
            <li><a href="#outils" class="learning-nav-section-link">Outils</a></li>
            {(topic.subcategories || []).length > 0 && <li><a href="#sous-cat" class="learning-nav-section-link">Sous-catégories</a></li>}
          </ul>
        </nav>
        <div id="view-learning" class="view learning-detail-view">
          <header class="page-header">
            <nav class="learning-breadcrumb" aria-label="Fil d'Ariane">
              <a href="#/learning" onClick={(e) => { e.preventDefault(); goList(); }}>Doc & Cours</a>
              <span class="learning-breadcrumb-sep">›</span>
              <a href="#" onClick={(e) => { e.preventDefault(); goTopic(topic.id); }}>{topic.icon || ''} {escapeHtml(topic.name)}</a>
              {sub && (<><span class="learning-breadcrumb-sep">›</span><span>{escapeHtml(sub.name)}</span></>)}
            </nav>
            <h2>{topic.icon || ''} {escapeHtml(topic.name)}{sub ? ` – ${escapeHtml(sub.name)}` : ''}</h2>
            {!sub && topic.short && <p class="room-description">{escapeHtml(topic.short)}</p>}
            {sub && sub.content && <p class="room-description">{escapeHtml(sub.content)}</p>}
          </header>
          <section class="room-section learning-detail">
            {!sub && topic.content && <div class="learning-detail-content" dangerouslySetInnerHTML={{ __html: escapeHtml(topic.content).replace(/\n/g, '<br/>') }} />}
            {(topic.subcategories || []).length > 0 && (
              <div id="sous-cat" class="learning-detail-block">
                <h3 class="learning-detail-heading">Sous-catégories</h3>
                <ul class="learning-subcats-list">
                  {(topic.subcategories || []).map(sc => (
                    <li key={sc.id} class="learning-subcat-card">
                      <button type="button" class="learning-subcat-link learning-subcat-card-btn" onClick={() => goSub(topic.id, sc.id)}>
                        <span class="learning-subcat-card-name">{escapeHtml(sc.name)}</span>
                        <span class="learning-subcat-card-arrow"> →</span>
                      </button>
                      {sc.content && <p class="learning-subcat-content">{escapeHtml(sc.content)}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {topic.id === 'web' && owaspSources.length > 0 && (
              <div id="doc-owasp" class="learning-detail-block learning-owasp-block">
                <h3 class="learning-detail-heading">OWASP Top 10:2021 (documentation complète)</h3>
                <p class="learning-detail-desc">Chaque page peut être ouverte dans l’app (Bibliothèque doc) ou récupérée pour lecture hors ligne.</p>
                <ul class="learning-doc-list learning-owasp-list">
                  {owaspSources.map(s => (
                    <li key={s.id} class="learning-doc-item">
                      <span class="learning-doc-item-label">{escapeHtml(s.label)}</span>
                      {onOpenDoc && <button type="button" class="btn btn-secondary learning-doc-item-inapp" onClick={() => onOpenDoc(s.id)}>Ouvrir dans l’app</button>}
                      <a href={s.url} target="_blank" rel="noopener nofollow" class="learning-link learning-doc-item-open">Ouvrir (externe)</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div id="doc" class="learning-detail-block">
              <h3 class="learning-detail-heading">Documentation (autres liens)</h3>
              <ul class="learning-doc-list learning-doc-list-clickable">
                {(topic.documentation || []).length ? (topic.documentation || []).map(d => (
                  <li key={d.url} class="learning-doc-item">
                    <button type="button" class="learning-doc-item-btn" onClick={openDocDetail(d, 'doc')}>
                      <span class="learning-doc-item-label">{escapeHtml(d.label)}</span>
                      {d.desc && <span class="learning-doc-desc"> – {escapeHtml(d.desc)}</span>}
                      <span class="learning-doc-item-arrow"> → Voir détail</span>
                    </button>
                    {d.docRef && onOpenDoc && <button type="button" class="btn btn-secondary learning-doc-item-inapp" onClick={() => onOpenDoc(d.docRef)}>Ouvrir dans l’app</button>}
                    <a href={d.url} target="_blank" rel="noopener nofollow" class="learning-link learning-doc-item-open">Ouvrir</a>
                  </li>
                )) : <li class="text-muted">—</li>}
              </ul>
            </div>
            <div id="cours" class="learning-detail-block">
              <h3 class="learning-detail-heading">Cours complets</h3>
              <ul class="learning-doc-list learning-doc-list-clickable">
                {(topic.courses || []).length ? (topic.courses || []).map(c => (
                  <li key={c.url} class="learning-doc-item">
                    <button type="button" class="learning-doc-item-btn" onClick={openDocDetail(c, 'course')}>
                      <span class="learning-doc-item-label">{escapeHtml(c.label)}</span>
                      {c.desc && <span class="learning-doc-desc"> – {escapeHtml(c.desc)}</span>}
                      <span class="learning-doc-item-arrow"> → Voir détail</span>
                    </button>
                    <a href={c.url} target="_blank" rel="noopener nofollow" class="learning-link learning-doc-item-open">Ouvrir</a>
                  </li>
                )) : <li class="text-muted">—</li>}
              </ul>
            </div>
            <div id="outils" class="learning-detail-block">
              <h3 class="learning-detail-heading">Outils</h3>
              <ul class="learning-tools-list">
                {(topic.tools || []).map(tool => (
                  <li key={tool.name}>
                    <strong>{escapeHtml(tool.name)}</strong>
                    {tool.url && <> – <a href={tool.url} target="_blank" rel="noopener nofollow" class="learning-link">Lien</a></>}
                    {tool.desc && <> – {escapeHtml(tool.desc)}</>}
                  </li>
                )) || <li class="text-muted">—</li>}
              </ul>
            </div>
          </section>
        </div>
        {docModal}
      </div>
    );
  }

  return (
    <div class="learning-view-wrap">
    <div id="view-learning" class="view">
      <header class="page-header">
        <h2>{source?.title || 'Documentation & Cours'}</h2>
        <p class="room-description">{source?.description || 'Cours et documentation par thème. Clique sur un thème pour ouvrir sa page détaillée (sous-catégories, documentation, cours, outils).'} Chaque thème liste des liens vers OWASP, PortSwigger, outils (Burp, Wireshark, etc.).</p>
      </header>
      <section class="room-section">
        <div id="learning-topics" class="learning-topics">
          {topics.length === 0 && <p class="section-desc text-muted">Aucun thème disponible pour le moment.</p>}
          {topics.map(t => (
            <article key={t.id} class="learning-topic">
              <h3 class="learning-topic-title">
                <button type="button" class="learning-topic-btn" onClick={() => goTopic(t.id)}>
                  {t.icon || ''} {escapeHtml(t.name)}
                </button>
              </h3>
              {t.short && <p class="learning-topic-short">{escapeHtml(t.short)}</p>}
              {t.content && <div class="learning-topic-content">{escapeHtml(t.content)}</div>}
              {(t.subcategories || []).length > 0 && (
                <div>
                  <h4 class="learning-subcats-title">Sous-catégories (clique pour ouvrir la page détail)</h4>
                  <ul class="learning-subcats learning-subcats-cards">
                    {(t.subcategories || []).map(sc => (
                      <li key={sc.id} class="learning-subcat learning-subcat-card">
                        <button type="button" class="learning-subcat-btn learning-subcat-card-btn" onClick={() => goSub(t.id, sc.id)}>
                          <span class="learning-subcat-card-name">{escapeHtml(sc.name)}</span>
                          <span class="learning-subcat-card-arrow"> → page détail</span>
                        </button>
                        {sc.content && <p class="learning-subcat-content">{escapeHtml(sc.content)}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div class="learning-topic-actions">
                <button type="button" class="btn btn-primary" onClick={() => goTopic(t.id)}>Voir la page détaillée</button>
              </div>
              <h4>Documentation (clique pour le détail)</h4>
              <ul class="learning-doc-list learning-doc-list-clickable">
                {(t.documentation || []).length ? (t.documentation || []).map(d => (
                  <li key={d.url} class="learning-doc-item">
                    <button type="button" class="learning-doc-item-btn" onClick={openDocDetail(d, 'doc')}>
                      {escapeHtml(d.label)}
                      <span class="learning-doc-item-arrow"> → détail</span>
                    </button>
                    <a href={d.url} target="_blank" rel="noopener nofollow" class="learning-link learning-doc-item-open">Ouvrir</a>
                  </li>
                )) : <li class="text-muted">—</li>}
              </ul>
              <h4>Cours complets (clique pour le détail)</h4>
              <ul class="learning-doc-list learning-doc-list-clickable">
                {(t.courses || []).length ? (t.courses || []).map(c => (
                  <li key={c.url} class="learning-doc-item">
                    <button type="button" class="learning-doc-item-btn" onClick={openDocDetail(c, 'course')}>
                      {escapeHtml(c.label)}
                      <span class="learning-doc-item-arrow"> → détail</span>
                    </button>
                    <a href={c.url} target="_blank" rel="noopener nofollow" class="learning-link learning-doc-item-open">Ouvrir</a>
                  </li>
                )) : <li class="text-muted">—</li>}
              </ul>
              <h4>Outils</h4>
              <ul class="learning-tools">
                {(t.tools || []).map(tool => (
                  <li key={tool.name}>
                    <strong>{escapeHtml(tool.name)}</strong>
                    {tool.url && <> – <a href={tool.url} target="_blank" rel="noopener nofollow">Lien</a></>}
                    {tool.desc && <> – {escapeHtml(tool.desc)}</>}
                  </li>
                )) || <li class="text-muted">—</li>}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
    {docModal}
    </div>
  );
}
