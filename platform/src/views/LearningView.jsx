import { escapeHtml } from '../lib/store';

export default function LearningView({ learning }) {
  const topics = learning?.topics || [];
  const learningLoaded = learning !== null;

  return (
    <div id="view-learning" class="view">
      <header class="page-header">
        <h2>{learning?.title || 'Documentation & Cours'}</h2>
        <p class="room-description">{learning?.description || 'Cours et documentation par thème (Web, Crypto, Stégano, Phishing, etc.).'}</p>
      </header>
      <section class="room-section">
        <div id="learning-topics" class="learning-topics">
          {learningLoaded && topics.length === 0 && <p class="section-desc text-muted">Aucun thème dans /data/learning.json.</p>}
          {!learningLoaded && <p class="section-desc text-muted">Chargement des thèmes…</p>}
          {topics.map(t => (
            <article key={t.id} class="learning-topic">
              <h3 class="learning-topic-title">{t.icon || ''} {escapeHtml(t.name)}</h3>
              {t.short && <p class="learning-topic-short">{escapeHtml(t.short)}</p>}
              {t.content && <div class="learning-topic-content">{escapeHtml(t.content)}</div>}
              {(t.subcategories || []).length > 0 && (
                <div>
                  <h4 class="learning-subcats-title">Sous-catégories</h4>
                  <ul class="learning-subcats">
                    {(t.subcategories || []).map(sc => (
                      <li key={sc.id} class="learning-subcat">
                        <strong>{escapeHtml(sc.name)}</strong>
                        {sc.content && <p class="learning-subcat-content">{escapeHtml(sc.content)}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <h4>Documentation</h4>
              <div class="learning-links">
                {(t.documentation || []).length ? (t.documentation || []).map(d => (
                  <a key={d.url} href={d.url} target="_blank" rel="noopener nofollow" class="learning-link">{escapeHtml(d.label)}</a>
                )) : <span class="text-muted">—</span>}
              </div>
              <h4>Cours complets</h4>
              <div class="learning-links">
                {(t.courses || []).length ? (t.courses || []).map(c => (
                  <a key={c.url} href={c.url} target="_blank" rel="noopener nofollow" class="learning-link">{escapeHtml(c.label)}</a>
                )) : <span class="text-muted">—</span>}
              </div>
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
  );
}
