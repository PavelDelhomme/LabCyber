import OpenInPageDropdown from './OpenInPageDropdown';
import LabButtonDropdown from './LabButtonDropdown';

export default function Topbar({
  view,
  categories = [],
  searchQuery,
  filterCategory,
  showPipButton,
  currentLab = { id: 'default', name: 'Lab par défaut' },
  labPanelOpen,
  onLabPanelToggle,
  onLabPanelClose,
  onSearchChange,
  onFilterChange,
  onSidebarToggle,
  onLogToggle,
  onPipToggle,
  onStats,
  onOptions,
  onTerminal,
  onTerminalInPanel,
  onTerminalPip,
  capturePanelOpen,
  onCapturePanelToggle,
  onDeactivateLab,
  onNavigate,
  getTerminalUrl,
  getDesktopUrl,
  getViewUrl = (v) => (typeof window !== 'undefined' ? window.location.origin + (window.location.pathname || '/') : '') + '#/' + v,
  labNotes = '',
  onLabNotesChange,
  labReport = '',
  onLabReportChange,
  sidebarCollapsed = false,
}) {
  const REPORT_TEMPLATE = `## Cibles
- 

## Méthodologie
- 

## Découvertes
- 

## Failles (CVE, vulnérabilités)
- 

## Recommandations
- 
`;
  const termUrl = typeof getTerminalUrl === 'function' ? getTerminalUrl() : '';
  const desktopUrl = typeof getDesktopUrl === 'function' ? getDesktopUrl() : '';

  return (
    <header class={`topbar ${sidebarCollapsed ? 'topbar-sidebar-collapsed' : ''}`}>
      <div class="topbar-head">
        <button type="button" class="topbar-btn sidebar-toggle" onClick={onSidebarToggle} aria-label="Menu" title="Menu">☰</button>
        <h1 class="topbar-title">Lab Cyber</h1>
      </div>
      <div class="topbar-toolbar">
        <input
          type="search"
          class="search-input"
          placeholder="Rechercher scénarios, rooms, docs…"
          aria-label="Recherche"
          value={searchQuery}
          onInput={e => onSearchChange(e.target.value)}
        />
        <select
          class="filter-category"
          aria-label="Catégorie"
          value={filterCategory}
          onChange={e => onFilterChange(e.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name || c.id}</option>
          ))}
        </select>
        <div class="topbar-actions">
          <LabButtonDropdown
            currentLab={currentLab}
            labPanelOpen={labPanelOpen}
            onLabPanelToggle={onLabPanelToggle}
            onLabPanelClose={onLabPanelClose}
            onTerminalInPanel={onTerminalInPanel}
            onTerminalPip={onTerminalPip}
            onTerminalNewTab={onTerminal}
            onCapturePanelToggle={onCapturePanelToggle}
            onCaptureNewTab={() => window.open(getViewUrl('capture'), '_blank', 'noopener')}
            onNavigate={onNavigate}
            onDeactivateLab={onDeactivateLab}
            getViewUrl={getViewUrl}
            capturePanelOpen={capturePanelOpen}
          />
          <button type="button" class="topbar-btn" onClick={onTerminal} title="Terminal (nouvel onglet)">⌨</button>
          <OpenInPageDropdown
            class="topbar-dropdown"
            onTerminalPanel={onTerminalInPanel}
            onTerminalPip={onTerminalPip}
            onCapture={onCapturePanelToggle}
            onSimulator={() => onNavigate?.('network-sim')}
            onProxy={() => onNavigate?.('proxy-config')}
            onApi={() => onNavigate?.('api-client')}
            captureOpen={capturePanelOpen}
            label="Ouvrir"
          />
          <button type="button" class="topbar-btn" onClick={onStats} title="Statistiques">📊</button>
          <button type="button" class="topbar-btn" onClick={onOptions} title="Options">⚙️</button>
          {showPipButton && (
            <button type="button" class="topbar-btn" onClick={onPipToggle} title="PiP scénario">📌</button>
          )}
          <button type="button" class="topbar-btn topbar-btn-log" onClick={onLogToggle} title="Journal d'activité">📋</button>
        </div>
      </div>
      {labPanelOpen && (
        <div class="lab-panel-overlay" onClick={onLabPanelClose}>
          <div class="lab-panel" onClick={e => e.stopPropagation()} role="dialog" aria-label="Lab actif">
            <header class="lab-panel-header">
              <h3>Lab actif</h3>
              <button type="button" class="lab-panel-close" onClick={onLabPanelClose} aria-label="Fermer">×</button>
            </header>
            <p class="lab-panel-current">
              <strong>{currentLab.name}</strong>
              {currentLab.description && <span class="lab-panel-desc">{currentLab.description}</span>}
              {currentLab.vncPassword && <span class="lab-panel-desc">Mot de passe VNC : {currentLab.vncPassword}</span>}
            </p>
            {currentLab.id !== 'default' && (
              <button type="button" class="btn btn-secondary" onClick={() => { onDeactivateLab?.(); }} style="margin-bottom:0.75rem">
                Désactiver (revenir au lab par défaut)
              </button>
            )}
            <p class="lab-panel-section">Notes du lab</p>
            <textarea
              class="lab-panel-notes"
              placeholder="Notes, infos importantes, chemins de fichiers ou dossiers pour ce lab…"
              value={labNotes}
              onInput={e => onLabNotesChange?.(e.target.value)}
              rows={3}
            />
            <p class="lab-panel-section">Rapport / Failles (test de cybersécurité)</p>
            <textarea
              class="lab-panel-notes lab-panel-report"
              placeholder="Cibles, méthodologie, découvertes, failles (CVE), recommandations… Utilisez « Insérer modèle » pour une structure de rapport."
              value={labReport}
              onInput={e => onLabReportChange?.(e.target.value)}
              rows={6}
            />
            <button type="button" class="btn btn-secondary" onClick={() => onLabReportChange?.(labReport ? labReport + '\n\n' + REPORT_TEMPLATE : REPORT_TEMPLATE)} style={{ marginBottom: '0.5rem' }}>Insérer modèle rapport</button>
            <div class="lab-panel-actions">
              <p class="lab-panel-section">Ouvrir dans la page</p>
              <OpenInPageDropdown
                onTerminalPanel={() => { onTerminalInPanel?.(); onLabPanelClose(); }}
                onTerminalPip={onTerminalPip ? () => { onTerminalPip?.(); onLabPanelClose(); } : undefined}
                onCapture={() => { onCapturePanelToggle?.(); onLabPanelClose(); }}
                onSimulator={() => { onNavigate?.('network-sim'); onLabPanelClose(); }}
                onProxy={() => { onNavigate?.('proxy-config'); onLabPanelClose(); }}
                onApi={() => { onNavigate?.('api-client'); onLabPanelClose(); }}
                captureOpen={capturePanelOpen}
                label="Choisir un outil à ouvrir…"
              />
              <p class="lab-panel-section">Ouvrir dans un nouvel onglet</p>
              <button type="button" class="btn btn-secondary" onClick={() => { window.open(getViewUrl('terminal-full'), '_blank', 'noopener'); onLabPanelClose(); }}>Terminal</button>
              <button type="button" class="btn btn-secondary" onClick={() => { window.open(getViewUrl('capture'), '_blank', 'noopener'); onLabPanelClose(); }}>Capture pcap</button>
              <button type="button" class="btn btn-secondary" onClick={() => { window.open(getViewUrl('network-sim'), '_blank', 'noopener'); onLabPanelClose(); }}>Simulateur réseau</button>
              <button type="button" class="btn btn-secondary" onClick={() => { window.open(getViewUrl('proxy-config'), '_blank', 'noopener'); onLabPanelClose(); }}>Proxy (config)</button>
              <button type="button" class="btn btn-secondary" onClick={() => { window.open(getViewUrl('api-client'), '_blank', 'noopener'); onLabPanelClose(); }}>Requêtes API</button>
              <p class="lab-panel-section">Bureau noVNC</p>
              <a href={desktopUrl} target="_blank" rel="noopener" class="btn btn-secondary" onClick={onLabPanelClose}>Ouvrir le bureau</a>
              <p class="lab-panel-section">Paramètres & scénarios</p>
              <button type="button" class="btn btn-secondary" onClick={() => { onNavigate?.('engagements'); onLabPanelClose(); }}>
                Cibles & Proxy
              </button>
              <button type="button" class="btn btn-secondary" onClick={() => { onNavigate?.('labs'); onLabPanelClose(); }}>
                Gérer les labs
              </button>
              <button type="button" class="btn btn-primary" onClick={() => { onNavigate?.('dashboard'); onLabPanelClose(); }}>
                Accueil (scénarios)
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
