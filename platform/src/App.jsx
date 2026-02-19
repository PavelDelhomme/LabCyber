import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { useStore, useStorage, getTerminalUrl, getDesktopUrl } from './lib/store';

const DEFAULT_LAB = { id: 'default', name: 'Lab par défaut', description: '' };
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import LogPanel from './components/LogPanel';
import PipPanel from './components/PipPanel';
import ScenarioBottomBar from './components/ScenarioBottomBar';
import TerminalPipPanel from './components/TerminalPipPanel';
import StatsModal from './components/StatsModal';
import Dashboard from './views/Dashboard';
import OptionsView from './views/OptionsView';
import DocsView from './views/DocsView';
import LearningView from './views/LearningView';
import EngagementsView from './views/EngagementsView';
import ScenarioView from './views/ScenarioView';
import RoomView from './views/RoomView';
import ProgressionView from './views/ProgressionView';
import LabsView from './views/LabsView';
import NetworkSimulatorView from './views/NetworkSimulatorView';
import ProxyConfigView from './views/ProxyConfigView';
import ApiClientView from './views/ApiClientView';
import CaptureView from './views/CaptureView';
import TerminalFullView from './views/TerminalFullView';
import DocOfflineView from './views/DocOfflineView';
import CvePanel from './components/CvePanel';

const VIEWS = {
  dashboard: Dashboard,
  docs: DocsView,
  learning: LearningView,
  'doc-offline': DocOfflineView,
  engagements: EngagementsView,
  progression: ProgressionView,
  labs: LabsView,
  'network-sim': NetworkSimulatorView,
  'proxy-tools': ApiClientView,
  'proxy-config': ProxyConfigView,
  'api-client': ApiClientView,
  capture: CaptureView,
  'terminal-full': TerminalFullView,
  options: OptionsView,
  scenario: ScenarioView,
  room: RoomView,
};

const VALID_VIEWS = new Set(Object.keys(VIEWS));

function parseHash() {
  const h = typeof window !== 'undefined' ? window.location.hash.slice(1).replace(/^\/+/, '') || 'dashboard' : 'dashboard';
  const parts = h.split('/').filter(Boolean);
  if (parts[0] === 'scenario' && parts[1]) return { view: 'scenario', scenarioId: parts[1], roomId: null, learningTopicId: null, learningSubId: null };
  if (parts[0] === 'room' && parts[1]) return { view: 'room', scenarioId: null, roomId: parts[1], learningTopicId: null, learningSubId: null };
  if (parts[0] === 'learning') {
    return { view: 'learning', scenarioId: null, roomId: null, learningTopicId: parts[1] || null, learningSubId: parts[2] || null, docOfflineId: null };
  }
  if (parts[0] === 'doc-offline') {
    return { view: 'doc-offline', scenarioId: null, roomId: null, learningTopicId: null, learningSubId: null, docOfflineId: parts[1] || null };
  }
  const view = VALID_VIEWS.has(parts[0]) ? parts[0] : 'dashboard';
  return { view, scenarioId: null, roomId: null, learningTopicId: null, learningSubId: null, docOfflineId: null };
}

function hashFor(view, scenarioId, roomId) {
  if (view === 'scenario' && scenarioId) return `#/scenario/${encodeURIComponent(scenarioId)}`;
  if (view === 'room' && roomId) return `#/room/${encodeURIComponent(roomId)}`;
  if (view === 'dashboard') return '#/';
  return `#/${view}`;
}

/** Une iframe par onglet avec URL distincte (session=tabId) pour que chaque onglet ait sa propre session ttyd. reloadKey force un remount (bouton Recharger). */
function TerminalPanelIframe({ terminalUseDefaultLab, tabName, tabId, reloadKey = 0, onReload, onIframeLoad }) {
  const url = useMemo(() => getTerminalUrl(terminalUseDefaultLab, tabId), [terminalUseDefaultLab, tabId]);
  const iframeRef = useRef(null);
  return (
    <div class="terminal-iframe-wrap">
      {onReload && (
        <button type="button" class="terminal-reload-btn" onClick={onReload} title="Recharger le terminal (nouvelle session)">↻ Recharger</button>
      )}
      <iframe ref={iframeRef} src={url} title={tabName} class="terminal-side-panel-iframe" key={`terminal-${tabId}-${terminalUseDefaultLab}-${reloadKey}`} onLoad={() => { if (iframeRef.current?.contentWindow) onIframeLoad?.(iframeRef.current.contentWindow); }} />
    </div>
  );
}

export default function App() {
  const { data, scenarios, config, docs, learning, targets, challenges, docSources, loaded } = useStore();
  const storage = useStorage();
  const [view, setViewState] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [pipOpen, setPipOpen] = useState(false);
  const [terminalPipOpen, setTerminalPipOpen] = useState(false);
  const [scenarioBarCollapsed, setScenarioBarCollapsed] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [cvePanelOpen, setCvePanelOpen] = useState(false);
  const [terminalPanelOpen, setTerminalPanelOpen] = useState(false);
  const [terminalPanelEverOpened, setTerminalPanelEverOpened] = useState(false);
  const [terminalTabs, setTerminalTabs] = useState([{ id: '1', name: 'Session 1' }]);
  const [activeTerminalTabId, setActiveTerminalTabId] = useState('1');
  const [terminalPanelMinimized, setTerminalPanelMinimized] = useState(false);
  const [terminalPanelWidth, setTerminalPanelWidth] = useState(520);
  const [editingTerminalTabId, setEditingTerminalTabId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [currentScenarioId, setCurrentScenarioId] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [learningTopicId, setLearningTopicId] = useState(null);
  const [learningSubId, setLearningSubId] = useState(null);
  const [docOfflineId, setDocOfflineId] = useState(null);
  const [currentLabId, setCurrentLabId] = useState('default');
  const [labPanelOpen, setLabPanelOpen] = useState(false);
  const [capturePanelOpen, setCapturePanelOpen] = useState(false);
  const [capturePanelPosition, setCapturePanelPosition] = useState('right');
  const [optionsInLeftPanel, setOptionsInLeftPanel] = useState(false);
  const [optionsPanelOpen, setOptionsPanelOpen] = useState(false);
  const [terminalUseDefaultLab, setTerminalUseDefaultLab] = useState(true);
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [terminalJournalInput, setTerminalJournalInput] = useState('');
  const [terminalReloadKeys, setTerminalReloadKeys] = useState({});
  const [labNotes, setLabNotesState] = useState('');
  const [labReport, setLabReportState] = useState('');
  const skipNextHashChange = useRef(false);
  const terminalResizeRef = useRef({ active: false, startX: 0, startW: 0 });
  const panelIframeWindowsRef = useRef(new Set());
  const uiSessionRef = useRef({});

  useEffect(() => {
    uiSessionRef.current = { terminalPanelOpen, labPanelOpen, capturePanelOpen, capturePanelPosition, optionsInLeftPanel, optionsPanelOpen, terminalUseDefaultLab, terminalTabs, activeTerminalTabId, terminalPanelMinimized, terminalPanelWidth };
  }, [terminalPanelOpen, labPanelOpen, capturePanelOpen, capturePanelPosition, optionsInLeftPanel, optionsPanelOpen, terminalUseDefaultLab, terminalTabs, activeTerminalTabId, terminalPanelMinimized, terminalPanelWidth]);

  const persistUiSession = (patch) => {
    if (storage?.setUiSession) storage.setUiSession({ ...uiSessionRef.current, ...patch });
  };

  const openTerminalPanel = () => {
    const ui = storage?.getUiSession?.();
    const savedTabs = Array.isArray(ui?.terminalTabs) && ui.terminalTabs.length > 0 ? ui.terminalTabs : [{ id: '1', name: 'Session 1' }];
    const savedActive = ui?.activeTerminalTabId && savedTabs.some(t => t.id === ui.activeTerminalTabId) ? ui.activeTerminalTabId : savedTabs[0].id;
    setTerminalTabs(savedTabs);
    setActiveTerminalTabId(savedActive);
    setLabPanelOpen(false);
    setTerminalPanelOpen(true);
    setTerminalHistory(storage?.getTerminalHistory?.() || []);
    uiSessionRef.current = { ...uiSessionRef.current, terminalPanelOpen: true, labPanelOpen: false, terminalTabs: savedTabs, activeTerminalTabId: savedActive };
    storage?.setUiSession?.({ ...uiSessionRef.current });
  };

  useEffect(() => {
    if (!storage) return;
    const init = () => {
      const id = storage.getCurrentLabId();
      if (id != null && id !== '') setCurrentLabId(id);
      const ui = storage.getUiSession?.();
      if (ui) {
        setTerminalPanelOpen(!!ui.terminalPanelOpen);
        setLabPanelOpen(!!ui.labPanelOpen);
        setCapturePanelOpen(!!ui.capturePanelOpen);
        if (ui.capturePanelPosition === 'bottom' || ui.capturePanelPosition === 'left') setCapturePanelPosition(ui.capturePanelPosition);
        if (Array.isArray(ui.terminalTabs) && ui.terminalTabs.length > 0) {
          setTerminalTabs(ui.terminalTabs);
          setActiveTerminalTabId(ui.activeTerminalTabId || ui.terminalTabs[0].id);
        }
        if (typeof ui.terminalPanelMinimized === 'boolean') setTerminalPanelMinimized(ui.terminalPanelMinimized);
        if (typeof ui.terminalPanelWidth === 'number' && ui.terminalPanelWidth >= 320) setTerminalPanelWidth(ui.terminalPanelWidth);
        if (typeof ui.optionsInLeftPanel === 'boolean') setOptionsInLeftPanel(ui.optionsInLeftPanel);
        if (typeof ui.optionsPanelOpen === 'boolean') setOptionsPanelOpen(ui.optionsPanelOpen);
        if (typeof ui.terminalUseDefaultLab === 'boolean') setTerminalUseDefaultLab(ui.terminalUseDefaultLab);
      }
    };
    if (storage.ready) storage.ready().then(init);
    else init();
  }, []); // une seule fois au montage pour éviter re-renders en cascade

  const labs = storage ? [DEFAULT_LAB, ...(storage.getLabs() || [])] : [DEFAULT_LAB];
  const currentLab = labs.find(l => l.id === currentLabId) || DEFAULT_LAB;

  useEffect(() => {
    setLabNotesState(storage?.getLabNotes?.(currentLabId) || '');
    setLabReportState(storage?.getLabReport?.(currentLabId) || '');
  }, [currentLabId, storage]);

  const onLabChange = (id) => {
    const next = id || 'default';
    setCurrentLabId(next);
    storage?.setCurrentLabId?.(next);
  };

  useEffect(() => {
    const apply = () => {
      if (skipNextHashChange.current) {
        skipNextHashChange.current = false;
        return;
      }
      const { view: v, scenarioId: sid, roomId: rid, learningTopicId: lid, learningSubId: lsid } = parseHash();
      setViewState(v);
      setLearningTopicId(lid || null);
      setLearningSubId(lsid || null);
      setCurrentScenarioId(sid);
      setCurrentRoomId(rid);
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  useEffect(() => {
    const onEscape = (e) => {
      if (e.key !== 'Escape') return;
      if (labPanelOpen) { setLabPanelOpen(false); persistUiSession({ labPanelOpen: false }); e.preventDefault(); return; }
      if (statsOpen) { setStatsOpen(false); e.preventDefault(); return; }
      if (logOpen) { setLogOpen(false); e.preventDefault(); return; }
      if (cvePanelOpen) { setCvePanelOpen(false); e.preventDefault(); return; }
      if (optionsPanelOpen) { setOptionsPanelOpen(false); persistUiSession({ optionsPanelOpen: false }); e.preventDefault(); }
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [labPanelOpen, statsOpen, logOpen, cvePanelOpen, optionsPanelOpen]);

  useEffect(() => {
    if (terminalPanelOpen && storage) setTerminalHistory(storage.getTerminalHistory() || []);
  }, [terminalPanelOpen, storage]);
  useEffect(() => {
    if (terminalPanelOpen) setTerminalPanelEverOpened(true);
  }, [terminalPanelOpen]);

  useEffect(() => {
    const onMessage = (e) => {
      if (e?.data?.type !== 'lab-cyber-terminal-exit') return;
      const rest = terminalTabs.filter(t => t.id !== activeTerminalTabId);
      if (rest.length === 0) {
        setTerminalPanelOpen(false);
        persistUiSession({ terminalPanelOpen: false });
      } else {
        setTerminalTabs(rest);
        setActiveTerminalTabId(rest[0].id);
        persistUiSession({ terminalTabs: rest, activeTerminalTabId: rest[0].id });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [terminalTabs, activeTerminalTabId]);

  useEffect(() => {
    const onMove = (e) => {
      if (!terminalResizeRef.current.active) return;
      const delta = terminalResizeRef.current.startX - e.clientX;
      const next = Math.min(900, Math.max(320, terminalResizeRef.current.startW + delta));
      setTerminalPanelWidth(next);
    };
    const onUp = () => {
      if (terminalResizeRef.current.active) {
        terminalResizeRef.current.active = false;
        persistUiSession({ terminalPanelWidth });
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  useEffect(() => {
    if (!storage?.setUiSession) return;
    storage.setUiSession({ terminalPanelOpen, labPanelOpen, capturePanelOpen, capturePanelPosition, optionsInLeftPanel, optionsPanelOpen, terminalUseDefaultLab, terminalTabs, activeTerminalTabId, terminalPanelMinimized, terminalPanelWidth });
  }, [terminalTabs, activeTerminalTabId, terminalPanelMinimized, terminalPanelWidth, terminalUseDefaultLab, capturePanelPosition]);

  const onOptionsClick = () => {
    if (optionsInLeftPanel) {
      setOptionsPanelOpen(true);
      persistUiSession({ optionsPanelOpen: true });
    } else {
      setView('options');
    }
  };

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
  const getViewUrl = (v) => `${typeof window !== 'undefined' ? window.location.origin + (window.location.pathname || '/') : ''}#/${v}`;

  const ViewComponent = VIEWS[view] || Dashboard;

  const rightPanelWidth = terminalPanelOpen ? (terminalPanelMinimized ? 48 : terminalPanelWidth) : (capturePanelOpen && capturePanelPosition === 'right' ? 360 : 0);
  return (
    <div class={`app ${sidebarOpen ? 'sidebar-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${rightPanelWidth ? 'has-right-panel' : ''}`} style={rightPanelWidth ? { '--right-panel-width': `${rightPanelWidth}px` } : {}}>
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
      <main class={`main ${view === 'scenario' ? 'has-scenario-bar' + (scenarioBarCollapsed ? ' scenario-bar-collapsed' : '') : ''}`} style={{ marginRight: terminalPanelOpen ? (terminalPanelMinimized ? 48 : terminalPanelWidth) : (capturePanelOpen && capturePanelPosition === 'right' ? 360 : 0) }}>
        <Topbar
          view={view}
          sidebarCollapsed={sidebarCollapsed}
          categories={data?.categories || []}
          searchQuery={searchQuery}
          filterCategory={filterCategory}
          showPipButton={showPipButton}
          currentLab={currentLab}
          labPanelOpen={labPanelOpen}
          onLabPanelToggle={() => { setLabPanelOpen(o => !o); persistUiSession({ labPanelOpen: !labPanelOpen }); }}
          onLabPanelClose={() => { setLabPanelOpen(false); persistUiSession({ labPanelOpen: false }); }}
          onSearchChange={setSearchQuery}
          onFilterChange={setFilterCategory}
          onSidebarToggle={() => window.innerWidth <= 768 ? setSidebarOpen(o => !o) : setSidebarCollapsed(c => !c)}
          onLogToggle={() => setLogOpen(o => !o)}
          onPipToggle={() => setPipOpen(o => !o)}
          onStats={() => setStatsOpen(true)}
          onOptions={onOptionsClick}
          onTerminal={() => window.open(getTerminalUrl(), '_blank', 'noopener')}
          onTerminalInPanel={openTerminalPanel}
          onTerminalPip={() => setTerminalPipOpen(true)}
          capturePanelOpen={capturePanelOpen}
          onCapturePanelToggle={() => { setCapturePanelOpen(prev => { const next = !prev; setTimeout(() => persistUiSession({ capturePanelOpen: next }), 0); return next; }); }}
          onDeactivateLab={() => { storage?.setCurrentLabId('default'); setCurrentLabId('default'); setLabPanelOpen(false); }}
          onNavigate={setView}
          getTerminalUrl={getTerminalUrl}
          getDesktopUrl={getDesktopUrl}
          getViewUrl={getViewUrl}
          labNotes={labNotes}
          onLabNotesChange={(text) => { setLabNotesState(text); storage?.setLabNotes?.(currentLabId, text); }}
          labReport={labReport}
          onLabReportChange={(text) => { setLabReportState(text); storage?.setLabReport?.(currentLabId, text); }}
        />
        <div id="topbar-context" class="topbar-context" aria-live="polite">
          {view === 'scenario' && currentScenario
            ? `Scénario : ${currentScenario.title}`
            : view === 'room' && currentRoomId
              ? (data?.rooms?.find(r => r.id === currentRoomId)?.title || 'Room')
              : ({ dashboard: 'Accueil', docs: 'Documentation projet', learning: 'Doc & Cours', 'doc-offline': 'Bibliothèque doc', engagements: 'Cibles & Proxy', progression: 'Ma progression', labs: 'Labs', options: 'Options', 'network-sim': 'Simulateur réseau', 'proxy-tools': 'Requêtes API', 'proxy-config': 'Proxy (config)', 'api-client': 'Requêtes API (Postman)', capture: 'Capture pcap' }[view] || view)}
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
              learningTopicId={learningTopicId}
              learningSubId={learningSubId}
              onNavigateLearning={(topicId, subId) => { window.location.hash = '#/learning' + (topicId ? '/' + encodeURIComponent(topicId) : '') + (subId ? '/' + encodeURIComponent(subId) : ''); setLearningTopicId(topicId || null); setLearningSubId(subId || null); }}
              docSources={docSources}
              docId={docOfflineId}
              getOfflineDoc={storage?.getOfflineDoc}
              setOfflineDoc={storage?.setOfflineDoc}
              getOfflineDocIds={storage?.getOfflineDocIds}
              getDocPreferences={storage?.getDocPreferences}
              setDocPreferences={storage?.setDocPreferences}
              onOpenDoc={(id) => { window.location.hash = '#/doc-offline/' + encodeURIComponent(id); setDocOfflineId(id); setViewState('doc-offline'); }}
              onBack={() => { window.location.hash = '#/doc-offline'; setDocOfflineId(null); setViewState('doc-offline'); }}
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
              currentLabId={currentLabId}
              onLabChange={onLabChange}
              onOpenTerminalInNewTab={() => window.open(getTerminalUrl(), '_blank', 'noopener')}
              onOpenTerminalInPanel={openTerminalPanel}
              optionsInLeftPanel={optionsInLeftPanel}
              onOptionsInLeftPanelChange={(v) => { setOptionsInLeftPanel(v); persistUiSession({ optionsInLeftPanel: v }); }}
            />
          </div>
        )}
        {!loaded && <div class="page-header"><p>Chargement…</p></div>}
      </main>
      <LogPanel open={logOpen} onClose={() => setLogOpen(false)} />
      <StatsModal open={statsOpen} onClose={() => setStatsOpen(false)} scenarios={scenarios} storage={storage} />
      <button type="button" class="log-fab" onClick={() => setLogOpen(true)} aria-label="Ouvrir le journal" title="Journal d'activité">📋</button>
      <button type="button" class="cve-fab" onClick={() => setCvePanelOpen(true)} aria-label="Recherche CVE" title="Rechercher un CVE">CVE</button>
      <CvePanel open={cvePanelOpen} onClose={() => setCvePanelOpen(false)} />
      {showPipButton && <PipPanel open={pipOpen} scenario={currentScenario} onClose={() => setPipOpen(false)} />}
      {view === 'scenario' && <ScenarioBottomBar scenario={currentScenario} storage={storage} collapsed={scenarioBarCollapsed} onCollapsed={setScenarioBarCollapsed} onExpand={() => window.location.hash = '#/scenario/' + (currentScenarioId || '')} />}
      <TerminalPipPanel open={terminalPipOpen} onClose={() => setTerminalPipOpen(false)} getTerminalUrl={getTerminalUrl} />
      {terminalPanelEverOpened && (
        <div
          class={`terminal-side-panel ${terminalPanelMinimized ? 'terminal-side-panel-minimized' : ''} ${!terminalPanelOpen ? 'terminal-side-panel-hidden' : ''}`}
          role="dialog"
          aria-label="Terminal web attaquant"
          style={{ width: !terminalPanelOpen ? 0 : (terminalPanelMinimized ? 48 : terminalPanelWidth) }}
        >
          <div
            class="terminal-side-panel-resize-handle"
            aria-label="Redimensionner"
            onMouseDown={(e) => { if (!terminalPanelMinimized) { e.preventDefault(); terminalResizeRef.current = { active: true, startX: e.clientX, startW: terminalPanelWidth }; } }}
          />
          <header class="terminal-side-panel-header">
            <h3>{terminalPanelMinimized ? '⌨' : 'Terminal web (attaquant)'}</h3>
            {!terminalPanelMinimized && currentLabId !== 'default' && (
              <div class="terminal-lab-choice">
                <button type="button" class={`terminal-lab-choice-btn ${terminalUseDefaultLab ? 'active' : ''}`} onClick={() => { setTerminalUseDefaultLab(true); persistUiSession({ terminalUseDefaultLab: true }); }} title="Terminal du lab par défaut">Lab défaut</button>
                <button type="button" class={`terminal-lab-choice-btn ${!terminalUseDefaultLab ? 'active' : ''}`} onClick={() => { setTerminalUseDefaultLab(false); persistUiSession({ terminalUseDefaultLab: false }); }} title="Terminal du lab actif">Lab actif</button>
              </div>
            )}
            {!terminalPanelMinimized && (
              <div class="terminal-side-panel-tabs">
                {terminalTabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    class={`terminal-tab-btn ${activeTerminalTabId === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTerminalTabId(tab.id)}
                    title={tab.name}
                  >
                    {editingTerminalTabId === tab.id ? (
                      <input
                        id={`terminal-tab-rename-${tab.id}`}
                        name="terminal-tab-rename"
                        type="text"
                        class="terminal-tab-rename-input"
                        value={tab.name}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => setEditingTerminalTabId(null)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { const val = (e.target.value || '').trim(); setTerminalTabs(t => t.map(x => x.id === tab.id ? { ...x, name: val || x.name } : x)); setEditingTerminalTabId(null); e.target.blur(); } }}
                        onChange={(e) => setTerminalTabs(t => t.map(x => x.id === tab.id ? { ...x, name: e.target.value } : x))}
                      />
                    ) : (
                      <span onDoubleClick={(e) => { e.stopPropagation(); setEditingTerminalTabId(tab.id); }} title="Double-clic pour renommer">{tab.name}</span>
                    )}
                    {terminalTabs.length > 1 && (
                      <span class="terminal-tab-close" onClick={(e) => { e.stopPropagation(); const rest = terminalTabs.filter(x => x.id !== tab.id); setTerminalTabs(rest); if (activeTerminalTabId === tab.id) setActiveTerminalTabId(rest[0]?.id || ''); }} aria-label="Fermer">×</span>
                    )}
                  </button>
                ))}
                <button type="button" class="terminal-tab-add" onClick={(e) => { e.stopPropagation(); const newTab = { id: String(Date.now()), name: `Session ${terminalTabs.length + 1}` }; const nextTabs = [...terminalTabs, newTab]; setTerminalTabs(nextTabs); setActiveTerminalTabId(newTab.id); persistUiSession({ terminalTabs: nextTabs, activeTerminalTabId: newTab.id }); }} title="Nouvel onglet">+</button>
              </div>
            )}
            <button type="button" class="terminal-side-panel-minimize" onClick={() => { setTerminalPanelMinimized(m => !m); persistUiSession({ terminalPanelMinimized: !terminalPanelMinimized }); }} title={terminalPanelMinimized ? 'Afficher le panneau' : 'Réduire (cacher sans fermer)'} aria-label={terminalPanelMinimized ? 'Agrandir' : 'Réduire'}>{terminalPanelMinimized ? '▶' : '◀'}</button>
            <button type="button" class="terminal-side-panel-close" onClick={() => { setTerminalPanelOpen(false); persistUiSession({ terminalPanelOpen: false }); }} aria-label="Fermer le panneau">×</button>
          </header>
          {/* Toujours rendre le body pour garder les iframes en DOM (évite démontage quand minimisé → perte d'historique). Caché en CSS via .terminal-side-panel-minimized. */}
          <p class="terminal-side-panel-hint">En cas d'erreur 502 : le terminal peut mettre 15–20 s à démarrer. Double-clic sur un onglet pour le renommer.</p>
          <div class="terminal-side-panel-body">
            {terminalTabs.map(tab => (
              <div key={tab.id} class="terminal-tab-pane" style={{ display: activeTerminalTabId === tab.id ? 'flex' : 'none' }}>
                <TerminalPanelIframe terminalUseDefaultLab={terminalUseDefaultLab} tabName={tab.name} tabId={tab.id} reloadKey={terminalReloadKeys[tab.id] || 0} onReload={() => setTerminalReloadKeys(k => ({ ...k, [tab.id]: (k[tab.id] || 0) + 1 }))} onIframeLoad={(win) => { if (win) panelIframeWindowsRef.current.add(win); }} />
              </div>
            ))}
          </div>
          <div class="terminal-journal">
            <h4 class="terminal-journal-title">Journal de session (historique enregistré)</h4>
            <p class="terminal-journal-desc">Ajoute une ligne (commande ou note) pour la garder en mémoire.</p>
            <form class="terminal-journal-form" onSubmit={(e) => { e.preventDefault(); const t = terminalJournalInput.trim(); if (t) { storage?.appendTerminalHistory?.({ text: t }); setTerminalHistory(storage?.getTerminalHistory?.() || []); setTerminalJournalInput(''); } }}>
              <input id="terminal-journal-input" name="terminal-journal-entry" type="text" class="terminal-journal-input" value={terminalJournalInput} onInput={e => setTerminalJournalInput(e.target.value)} placeholder="Commande ou note à enregistrer" />
              <button type="submit" class="btn btn-secondary">Ajouter</button>
            </form>
            <ul class="terminal-journal-list">
              {(terminalHistory.length ? terminalHistory.slice().reverse() : []).slice(0, 50).map(entry => (
                <li key={entry.id} class="terminal-journal-entry">
                  <span class="terminal-journal-ts">{entry.ts ? new Date(entry.ts).toLocaleTimeString('fr-FR') : ''}</span>
                  <span class="terminal-journal-text">{entry.text}</span>
                </li>
              ))}
            </ul>
            {terminalHistory.length === 0 && <p class="terminal-journal-empty">Aucune entrée. Ajoute une commande ou une note ci-dessus.</p>}
          </div>
        </div>
      )}
      {optionsPanelOpen && (
        <div class="options-left-panel" role="dialog" aria-label="Options">
          <header class="terminal-side-panel-header">
            <h3>Options</h3>
            <button type="button" class="terminal-side-panel-close" onClick={() => { setOptionsPanelOpen(false); persistUiSession({ optionsPanelOpen: false }); }} aria-label="Fermer">×</button>
          </header>
          <div class="options-left-panel-body">
            <OptionsView
              onNavigate={setView}
              storage={storage}
              optionsInLeftPanel={optionsInLeftPanel}
              onOptionsInLeftPanelChange={(v) => { setOptionsInLeftPanel(v); persistUiSession({ optionsInLeftPanel: v }); }}
              isPanel
            />
          </div>
        </div>
      )}
      {capturePanelOpen && (
        <div class={`terminal-side-panel capture-side-panel capture-panel-${capturePanelPosition}`} role="dialog" aria-label="Capture pcap (lab actif)">
          <header class="terminal-side-panel-header">
            <h3>Capture pcap (lab : {currentLab.name})</h3>
            <div class="capture-panel-position-choice">
              <button type="button" class={capturePanelPosition === 'right' ? 'active' : ''} onClick={() => { setCapturePanelPosition('right'); persistUiSession({ capturePanelPosition: 'right' }); }} title="Panneau à droite">Droite</button>
              <button type="button" class={capturePanelPosition === 'bottom' ? 'active' : ''} onClick={() => { setCapturePanelPosition('bottom'); persistUiSession({ capturePanelPosition: 'bottom' }); }} title="Panneau en bas">Bas</button>
            </div>
            <button type="button" class="terminal-side-panel-close" onClick={() => { setCapturePanelOpen(false); persistUiSession({ capturePanelOpen: false }); }} aria-label="Fermer">×</button>
          </header>
          <div class="terminal-side-panel-body capture-panel-body">
            <CaptureView currentLabId={currentLabId} storage={storage} isPanel />
          </div>
        </div>
      )}
    </div>
  );
}
