import { useState } from 'preact/hooks';
import { escapeHtml } from '../lib/store';

const NVD_API = 'https://services.nvd.nist.gov/rest/json/cves/2.0';

export default function CvePanel({ open: isOpen, onClose }) {
  const [cveIdInput, setCveIdInput] = useState('');
  const [keywordSearch, setKeywordSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCve, setSelectedCve] = useState(null);

  const openById = () => {
    const id = (cveIdInput || '').trim().toUpperCase();
    if (id) window.open('https://nvd.nist.gov/vuln/detail/' + id, '_blank');
  };

  const searchByKeyword = async () => {
    const q = (keywordSearch || '').trim();
    if (!q) return;
    setError(null);
    setResults([]);
    setSelectedCve(null);
    setLoading(true);
    try {
      const res = await fetch(`${NVD_API}?keywordSearch=${encodeURIComponent(q)}&resultsPerPage=20`);
      const data = await res.json();
      setResults(data.vulnerabilities || []);
      if ((data.vulnerabilities || []).length === 0) setError('Aucun résultat. Essaie un autre mot-clé (logiciel, OS, version).');
    } catch (e) {
      setError(e.message || 'Erreur réseau. Limite NVD : 5 requêtes / 30 s sans clé API.');
    } finally {
      setLoading(false);
    }
  };

  const getScore = (cve) => {
    const metrics = cve.metrics;
    if (!metrics) return null;
    const cvss = metrics.cvssMetricV31?.[0] || metrics.cvssMetricV30?.[0] || metrics.cvssMetricV2?.[0];
    return cvss?.cvssData?.baseScore;
  };

  const getDescription = (cve) => {
    const desc = (cve.descriptions || []).find(d => d.lang === 'en') || (cve.descriptions || [])[0];
    return desc?.value || '';
  };

  if (!isOpen) return null;

  return (
    <div class="cve-panel-overlay" onClick={onClose}>
      <div class="cve-panel cve-panel-large" onClick={e => e.stopPropagation()} role="dialog" aria-label="Recherche CVE">
        <header class="cve-panel-header">
          <h3>Recherche CVE</h3>
          <button type="button" class="cve-panel-close" onClick={onClose} aria-label="Fermer">×</button>
        </header>

        <section class="cve-panel-section">
          <h4 class="cve-panel-section-title">Ouvrir par ID</h4>
          <div class="cve-panel-form">
            <input
              type="text"
              class="cve-panel-input"
              placeholder="CVE-2024-1234"
              value={cveIdInput}
              onInput={e => setCveIdInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') openById(); }}
            />
            <button type="button" class="btn btn-primary" onClick={openById}>Ouvrir sur NVD</button>
          </div>
        </section>

        <section class="cve-panel-section">
          <h4 class="cve-panel-section-title">Rechercher (logiciel, OS, application, version)</h4>
          <div class="cve-panel-form">
            <input
              type="text"
              class="cve-panel-input"
              placeholder="ex. Redis, OpenSSH 8.1, Apache 2.4"
              value={keywordSearch}
              onInput={e => setKeywordSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') searchByKeyword(); }}
            />
            <button type="button" class="btn btn-primary" onClick={searchByKeyword} disabled={loading}>
              {loading ? 'Recherche…' : 'Rechercher'}
            </button>
          </div>
          {error && <p class="proxy-tools-error">{escapeHtml(error)}</p>}
          {results.length > 0 && (
            <div class="cve-panel-results">
              <p class="cve-panel-results-count">{results.length} CVE trouvé(s)</p>
              <ul class="cve-panel-list">
                {results.map((v, i) => {
                  const cve = v.cve || v;
                  const id = cve.id || '';
                  const score = getScore(cve);
                  const desc = getDescription(cve);
                  const sel = selectedCve === id;
                  return (
                    <li key={id || i} class={`cve-panel-list-item ${sel ? 'selected' : ''}`}>
                      <button
                        type="button"
                        class="cve-panel-list-btn"
                        onClick={() => setSelectedCve(sel ? null : id)}
                      >
                        <span class="cve-panel-list-id">{escapeHtml(id)}</span>
                        {score != null && <span class="cve-panel-list-score">{score}</span>}
                      </button>
                      {sel && (
                        <div class="cve-panel-detail">
                          <p class="cve-panel-detail-desc">{escapeHtml(desc.slice(0, 500))}{desc.length > 500 ? '…' : ''}</p>
                          <p class="cve-panel-detail-meta">Score CVSS : {score != null ? score : '—'}</p>
                          <a href={`https://nvd.nist.gov/vuln/detail/${id}`} target="_blank" rel="noopener" class="btn btn-secondary">Voir sur NVD</a>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        <p class="cve-panel-links">
          <a href="https://nvd.nist.gov/vuln/search" target="_blank" rel="noopener">NVD Search</a>
          {' · '}
          <a href="https://cve.mitre.org/" target="_blank" rel="noopener">CVE.mitre.org</a>
        </p>
      </div>
    </div>
  );
}
