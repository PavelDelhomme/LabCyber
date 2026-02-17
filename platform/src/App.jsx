import { useState, useEffect } from 'preact/hooks';
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

const VIEWS = {
  dashboard: Dashboard,
  docs: DocsView,
  learning: LearningView,
  engagements: EngagementsView,
  scenario: ScenarioView,
  room: RoomView,
};

export default function App() {
  const { data, scenarios, config, docs, learning, loaded } = useStore();
  const storage = useStorage();
  const [view, setView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [pipOpen, setPipOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [terminalPanelOpen, setTerminalPanelOpen] = useState(false);
  const [terminalTabs, setTerminalTabs] = useState([{ id: '1', name: 'Session 1' }]);
  const [activeTerminalTabId, setActiveTerminalTabId] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [currentScenarioId, setCurrentScenarioId] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(null);

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
        onOpenScenario={(id) => { setCurrentScenarioId(id); setView('scenario'); }}
        onOpenRoom={(id) => { setCurrentRoomId(id); setView('room'); }}
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
          {view === 'scenario' && currentScenario ? `Scénario : ${currentScenario.title}` : ''}
          {view === 'dashboard' ? 'Accueil' : ''}
          {view === 'docs' ? 'Documentation projet' : ''}
          {view === 'learning' ? 'Documentation & Cours' : ''}
          {view === 'engagements' ? 'Cibles & Proxy' : ''}
        </div>
        {loaded && (
          <div class="view active">
            <ViewComponent
              view={view}
              data={data}
              scenarios={scenarios}
              config={config}
              docs={docs}
              learning={learning}
              searchQuery={searchQuery}
              filterCategory={filterCategory}
              currentScenarioId={currentScenarioId}
              currentRoomId={currentRoomId}
              onNavigate={setView}
              onOpenScenario={(id) => { setCurrentScenarioId(id); setView('scenario'); }}
              onOpenRoom={(id) => { setCurrentRoomId(id); setView('room'); }}
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
