import { useState, useEffect, useRef } from 'preact/hooks';
import { useStore, useStorage, getTerminalUrl } from './lib/store';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import LogPanel from './components/LogPanel';
import PipPanel from './components/PipPanel';
import StatsModal from './components/StatsModal';
import OptionsModal from './components/OptionsModal';
import Dashboard from './views/Dashboard';
import DocsView from './views/DocsView';
import LearningView from './views/LearningView';
import EngagementsView from './views/EngagementsView';
import ScenarioView from './views/ScenarioView';
import RoomView from './views/RoomView';
import ProgressionView from './views/ProgressionView';
import LabsView from './views/LabsView';
import NetworkSimulatorView from './views/NetworkSimulatorView';
import ProxyToolsView from './views/ProxyToolsView';
import CaptureView from './views/CaptureView';

const VIEWS = {
  dashboard: Dashboard,
  docs: DocsView,
  learning: LearningView,
  engagements: EngagementsView,
  progression: ProgressionView,
  labs: LabsView,
  'network-sim': NetworkSimulatorView,
  'proxy-tools': ProxyToolsView,
  capture: CaptureView,
  scenario: ScenarioView,
  room: RoomView,
};

const VALID_VIEWS = new Set(Object.keys(VIEWS));

function parseHash() {
  const h = typeof window !== 'undefined' ? window.location.hash.slice(1).replace(/^\/+/, '') || 'dashboard' : 'dashboard';
  const parts = h.split('/');
  if (parts[0] === 'scenario' && parts[1]) return { view: 'scenario', scenarioId: parts[1], roomId: null };
  if (parts[0] === 'room' && parts[1]) return { view: 'room', scenarioId: null, roomId: parts[1] };
  const view = VALID_VIEWS.has(parts[0]) ? parts[0] : 'dashboard';
  return { view, scenarioId: null, roomId: null };
}

function hashFor(view, scenarioId, roomId) {
  if (view === 'scenario' && scenarioId) return `#/scenario/${encodeURIComponent(scenarioId)}`;
  if (view === 'room' && roomId) return `#/room/${encodeURIComponent(roomId)}`;
  if (view === 'dashboard') return '#/';
  return `#/${view}`;
}

export default function App() {
  const { data, scenarios, config, docs, learning, targets, challenges, loaded } = useStore();
  const storage = useStorage();
  const [view, setViewState] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [pipOpen, setPipOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [cvePanelOpen, setCvePanelOpen] = useState(false);
  const [cveSearchId, setCveSearchId] = useState('');
  const [terminalPanelOpen, setTerminalPanelOpen] = useState(false);
  const [terminalTabs, setTerminalTabs] = useState([{ id: '1', name: 'Session 1' }]);
  const [activeTerminalTabId, setActiveTerminalTabId] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [currentScenarioId, setCurrentScenarioId] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const skipNextHashChange = useRef(false);

  useEffect(() => {
    const apply = () => {
      if (skipNextHashChange.current) {
        skipNextHashChange.current = false;
        return;
      }
      const { view: v, scenarioId: sid, roomId: rid } = parseHash();
      setViewState(v);
      setCurrentScenarioId(sid);
      setCurrentRoomId(rid);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  const setView = (v) => {
    skipNextHashChange.current = true;
    setViewState(v);
    setCurrentScenarioId(null);
    setCurrentRoomId(null);
    window.location.hash = hashFor(v, null, null);
  };
  const onOpenScenario = (id) => {
    skipNextHashChange.current = true;
    setCurrentScenarioId(id);
    setViewState('scenario');
    setCurrentRoomId(null);
    window.location.hash = hashFor('scenario', id, null);
  };
  const onOpenRoom = (id) => {
    skipNextHashChange.current = true;
    setCurrentRoomId(id);
    setViewState('room');
    setCurrentScenarioId(null);
    window.location.hash = hashFor('room', null, id);
  };

  const currentScenario = currentScenarioId ? scenarios.find(s => s.id === currentScenarioId) : null;
  const showPipButton = view === 'scenario';

  const ViewComponent = VIEWS[view] || Dashboard;

  return (
    <div class={`app ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        view={view}
        currentScenarioId={currentScenarioId}
        currentRoomId={currentRoomId}
        scenarios={scenarios}
        data={data}
        config={config}
        onNavigate={setView}
        onOpenScenario={onOpenScenario}
        onOpenRoom={onOpenRoom}
      />
      <main class="main">
        <Topbar
          view={view}
          categories={data?.categories || []}
          searchQuery={searchQuery}
          filterCategory={filterCategory}
          showPipButton={showPipButton}
          onSearchChange={setSearchQuery}
          onFilterChange={setFilterCategory}
          onSidebarToggle={() => window.innerWidth <= 768 ? setSidebarOpen(o => !o) : setSidebarCollapsed(c => !c)}
          onLogToggle={() => setLogOpen(o => !o)}
          onPipToggle={() => setPipOpen(o => !o)}
          onStats={() => setStatsOpen(true)}
          onOptions={() => setOptionsOpen(true)}
          onTerminal={() => window.open(getTerminalUrl(), '_blank', 'noopener')}
        />
        <div id="topbar-context" class="topbar-context" aria-live="polite">
          {view === 'scenario' && currentScenario
            ? `Scénario : ${currentScenario.title}`
            : view === 'room' && currentRoomId
              ? (data?.rooms?.find(r => r.id === currentRoomId)?.title || 'Room')
              : ({ dashboard: 'Accueil', docs: 'Documentation projet', learning: 'Doc & Cours', engagements: 'Cibles & Proxy', progression: 'Ma progression', labs: 'Labs', 'network-sim': 'Simulateur réseau', 'proxy-tools': 'Proxy / Requêtes', capture: 'Capture pcap' }[view] || view)}
        </div>
        {loaded && (
          <div class="view active" key={view}>
            <ViewComponent
              view={view}
              data={data}
              scenarios={scenarios}
              config={config}
              docs={docs}
              learning={learning}
              targets={targets}
              challenges={challenges}
              searchQuery={searchQuery}
              filterCategory={filterCategory}
              currentScenarioId={currentScenarioId}
              currentRoomId={currentRoomId}
              onNavigate={setView}
              onOpenScenario={onOpenScenario}
              onOpenRoom={onOpenRoom}
              storage={storage}
              onOpenTerminalInNewTab={() => window.open(getTerminalUrl(), '_blank', 'noopener')}
              onOpenTerminalInPanel={() => { setTerminalTabs([{ id: '1', name: 'Session 1' }]); setActiveTerminalTabId('1'); setTerminalPanelOpen(true); }}
            />
          </div>
        )}
        {!loaded && <div class="page-header"><p>Chargement…</p></div>}
      </main>
      <LogPanel open={logOpen} onClose={() => setLogOpen(false)} />
      <StatsModal open={statsOpen} onClose={() => setStatsOpen(false)} scenarios={scenarios} storage={storage} />
      <OptionsModal open={optionsOpen} onClose={() => setOptionsOpen(false)} storage={storage} />
      <button type="button" class="log-fab" onClick={() => setLogOpen(true)} aria-label="Ouvrir le journal" title="Journal d'activité">📋</button>
      <button type="button" class="cve-fab" onClick={() => setCvePanelOpen(true)} aria-label="Recherche CVE" title="Rechercher un CVE">CVE</button>
      {cvePanelOpen && (
        <div class="cve-panel-overlay" onClick={() => setCvePanelOpen(false)}>
          <div class="cve-panel" onClick={e => e.stopPropagation()} role="dialog" aria-label="Recherche CVE">
            <header class="cve-panel-header">
              <h3>Recherche CVE</h3>
              <button type="button" class="cve-panel-close" onClick={() => setCvePanelOpen(false)} aria-label="Fermer">×</button>
            </header>
            <p class="cve-panel-desc">Saisis un identifiant (ex. CVE-2024-1234) pour l’ouvrir sur NVD.</p>
            <div class="cve-panel-form">
              <input
                type="text"
                class="cve-panel-input"
                placeholder="CVE-2024-1234"
                value={cveSearchId}
                onInput={e => setCveSearchId(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { const id = (cveSearchId || '').trim().toUpperCase(); if (id) window.open('https://nvd.nist.gov/vuln/detail/' + id, '_blank'); } }}
              />
              <button
                type="button"
                class="btn btn-primary"
                onClick={() => { const id = (cveSearchId || '').trim().toUpperCase(); if (id) window.open('https://nvd.nist.gov/vuln/detail/' + id, '_blank'); }}
              >
                Ouvrir NVD
              </button>
            </div>
            <p class="cve-panel-links">
              <a href="https://nvd.nist.gov/vuln/search" target="_blank" rel="noopener">NVD Search</a>
              {' · '}
              <a href="https://cve.mitre.org/" target="_blank" rel="noopener">CVE.mitre.org</a>
            </p>
          </div>
        </div>
      )}
      {showPipButton && <PipPanel open={pipOpen} scenario={currentScenario} onClose={() => setPipOpen(false)} />}
      {terminalPanelOpen && (
        <div class="terminal-side-panel" role="dialog" aria-label="Terminal web attaquant">
          <header class="terminal-side-panel-header">
            <h3>Terminal web (attaquant)</h3>
            <div class="terminal-side-panel-tabs">
              {terminalTabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  class={`terminal-tab-btn ${activeTerminalTabId === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTerminalTabId(tab.id)}
                  title={tab.name}
                >
                  {tab.name}
                  {terminalTabs.length > 1 && (
                    <span class="terminal-tab-close" onClick={(e) => { e.stopPropagation(); const rest = terminalTabs.filter(x => x.id !== tab.id); setTerminalTabs(rest); if (activeTerminalTabId === tab.id) setActiveTerminalTabId(rest[0]?.id || ''); }} aria-label="Fermer">×</span>
                  )}
                </button>
              ))}
              <button type="button" class="terminal-tab-add" onClick={() => { const id = String(Date.now()); setTerminalTabs(t => [...t, { id, name: `Session ${t.length + 1}` }]); setActiveTerminalTabId(id); }} title="Nouvel onglet">+</button>
            </div>
            <button type="button" class="terminal-side-panel-close" onClick={() => setTerminalPanelOpen(false)} aria-label="Fermer le panneau">×</button>
          </header>
          <p class="terminal-side-panel-hint">En cas d'erreur 502 : le terminal peut mettre 15–20 s à démarrer. Rouvrez le panneau ou utilisez « Ouvrir dans un nouvel onglet ».</p>
          <div class="terminal-side-panel-body">
            {terminalTabs.map(tab => (
              <div key={tab.id} class="terminal-tab-pane" style={{ display: activeTerminalTabId === tab.id ? 'flex' : 'none' }}>
                <iframe src={getTerminalUrl()} title={tab.name} class="terminal-side-panel-iframe" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
