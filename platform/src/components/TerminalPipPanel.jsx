import { useState, useRef, useEffect, useMemo, useCallback } from 'preact/hooks';

const DRAG_STEP_PX = 5;
const PANEL_WIDTH = 400;
const PANEL_HEIGHT = 320;
const PANEL_MINIMIZED_WIDTH = 220;
const PANEL_MINIMIZED_HEIGHT = 48;

function getDefaultPosition() {
  if (typeof window === 'undefined') return { x: 400, y: 300 };
  return {
    x: Math.max(0, window.innerWidth - PANEL_WIDTH - 16),
    y: Math.max(0, window.innerHeight - PANEL_HEIGHT - 16),
  };
}

/** Conteneur div pour le terminal : charge l’URL via <object> (équivalent iframe, même zone de rendu). */
function StableTerminalObject({ url, title, tabKey, onContentLoad }) {
  const objectRef = useRef(null);
  const handleLoad = useCallback(() => {
    const win = objectRef.current?.contentDocument?.defaultView ?? objectRef.current?.contentWindow;
    if (win) onContentLoad?.(win);
  }, [onContentLoad]);
  return (
    <div class="terminal-pip-iframe" key={tabKey} style={{ flex: 1, minHeight: 0, position: 'relative' }}>
      <object
        ref={objectRef}
        data={url}
        type="text/html"
        title={title}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
        onLoad={handleLoad}
      />
    </div>
  );
}

export default function TerminalPipPanel({
  open,
  onClose,
  getTerminalUrl,
  minimized: controlledMinimized,
  onMinimize,
  tabs: controlledTabs,
  activeTabId: controlledActiveTabId,
  pos: controlledPos,
  onStateChange,
}) {
  const [minimized, setMinimized] = useState(controlledMinimized ?? false);
  const [tabs, setTabs] = useState(controlledTabs ?? [{ id: '1', name: 'Session 1' }]);
  const [activeTabId, setActiveTabId] = useState(controlledActiveTabId ?? '1');
  const [internalPos, setInternalPos] = useState(getDefaultPosition);
  const pipContentWindowRef = useRef(null);
  const stateChangeRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startPos: { x: 0, y: 0 } });

  const isControlled = controlledTabs != null && controlledActiveTabId != null;
  const displayTabs = isControlled ? controlledTabs : tabs;
  const displayActiveTabId = isControlled ? controlledActiveTabId : activeTabId;
  const displayPos = controlledPos ?? internalPos;
  stateChangeRef.current = { tabs: displayTabs, activeTabId: displayActiveTabId, minimized, pos: displayPos };

  const applyNewPos = useCallback((newPos) => {
    if (controlledPos != null) {
      onStateChange?.({ tabs: displayTabs, activeTabId: displayActiveTabId, minimized, pos: newPos });
    } else {
      setInternalPos(newPos);
      onStateChange?.({ tabs: displayTabs, activeTabId: displayActiveTabId, minimized, pos: newPos });
    }
  }, [controlledPos, displayTabs, displayActiveTabId, minimized, onStateChange]);

  const onHeaderPointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startPos: { x: displayPos.x, y: displayPos.y },
    };
    const onPointerMove = (ev) => {
      if (!dragRef.current.active) return;
      const { startX, startY, startPos } = dragRef.current;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const stepX = Math.round(dx / DRAG_STEP_PX) * DRAG_STEP_PX;
      const stepY = Math.round(dy / DRAG_STEP_PX) * DRAG_STEP_PX;
      const w = minimized ? PANEL_MINIMIZED_WIDTH : PANEL_WIDTH;
      const h = minimized ? PANEL_MINIMIZED_HEIGHT : PANEL_HEIGHT;
      const maxX = typeof window !== 'undefined' ? Math.max(0, window.innerWidth - w) : 0;
      const maxY = typeof window !== 'undefined' ? Math.max(0, window.innerHeight - h) : 0;
      const newX = Math.max(0, Math.min(maxX, startPos.x + stepX));
      const newY = Math.max(0, Math.min(maxY, startPos.y + stepY));
      applyNewPos({ x: newX, y: newY });
      dragRef.current.startX = ev.clientX;
      dragRef.current.startY = ev.clientY;
      dragRef.current.startPos = { x: newX, y: newY };
    };
    const onPointerUp = () => {
      dragRef.current.active = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }, [displayPos, minimized, applyNewPos]);

  useEffect(() => {
    if (controlledMinimized !== undefined) setMinimized(controlledMinimized);
  }, [controlledMinimized]);
  useEffect(() => {
    if (controlledTabs != null) setTabs(controlledTabs);
  }, [controlledTabs]);
  useEffect(() => {
    if (controlledActiveTabId != null) setActiveTabId(controlledActiveTabId);
  }, [controlledActiveTabId]);
  const handleMinimize = () => {
    const next = !minimized;
    setMinimized(next);
    requestAnimationFrame(() => {
      onMinimize?.(next);
      onStateChange?.({ tabs: displayTabs, activeTabId: displayActiveTabId, minimized: next, pos: displayPos });
    });
  };

  useEffect(() => {
    const onMessage = (e) => {
      if (e?.data?.type !== 'lab-cyber-terminal-exit') return;
      if (e.source !== pipContentWindowRef.current) return;
      const rest = displayTabs.filter(t => t.id !== displayActiveTabId);
      if (rest.length === 0) {
        onClose?.();
      } else {
        const nextTabs = rest;
        const nextActive = rest[0].id;
        if (!isControlled) {
          setTabs(nextTabs);
          setActiveTabId(nextActive);
        }
        onStateChange?.({ tabs: nextTabs, activeTabId: nextActive, minimized, pos: displayPos });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [displayTabs, displayActiveTabId, minimized, displayPos, isControlled, onClose, onStateChange]);

  const addTab = (e) => {
    e.stopPropagation();
    const newTab = { id: String(Date.now()), name: `Session ${displayTabs.length + 1}` };
    const nextTabs = [...displayTabs, newTab];
    if (!isControlled) {
      setTabs(nextTabs);
      setActiveTabId(newTab.id);
    }
    onStateChange?.({ tabs: nextTabs, activeTabId: newTab.id, minimized, pos: displayPos });
  };

  const closeTab = (tabId, e) => {
    e.stopPropagation();
    const rest = displayTabs.filter(t => t.id !== tabId);
    if (rest.length === 0) return;
    const nextActive = rest[0].id;
    if (!isControlled) {
      setTabs(rest);
      setActiveTabId(nextActive);
    }
    onStateChange?.({ tabs: rest, activeTabId: nextActive, minimized, pos: displayPos });
  };

  if (!open) return null;

  const termUrl = useMemo(() => (typeof getTerminalUrl === 'function' ? getTerminalUrl() : ''), []);
  const activeTab = displayTabs.find(t => t.id === displayActiveTabId);

  return (
    <div
      class={`terminal-pip-panel ${minimized ? 'terminal-pip-minimized' : ''}`}
      role="dialog"
      aria-label="Terminal (PiP)"
      style={{
        position: 'fixed',
        left: displayPos.x,
        top: displayPos.y,
        zIndex: 99999,
      }}
    >
      <header class="terminal-pip-header" onPointerDown={onHeaderPointerDown}>
        <span class="terminal-pip-title">⌨ Terminal</span>
        {!minimized && displayTabs.length > 0 && (
          <div class="terminal-pip-tabs">
            {displayTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                class={`terminal-pip-tab-btn ${displayActiveTabId === tab.id ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); if (!isControlled) setActiveTabId(tab.id); onStateChange?.({ tabs: displayTabs, activeTabId: tab.id, minimized, pos: displayPos }); }}
                title={tab.name}
              >
                <span class="terminal-pip-tab-label">{tab.name}</span>
                {displayTabs.length > 1 && (
                  <span class="terminal-pip-tab-close" onClick={(e) => closeTab(tab.id, e)} aria-label="Fermer">×</span>
                )}
              </button>
            ))}
            <button type="button" class="terminal-pip-tab-add" onClick={addTab} title="Nouvel onglet">+</button>
          </div>
        )}
        <div class="terminal-pip-actions">
          <button type="button" class="terminal-pip-btn" onClick={handleMinimize} title={minimized ? 'Agrandir' : 'Réduire'} aria-label={minimized ? 'Agrandir' : 'Réduire'}>
            {minimized ? '▶' : '▼'}
          </button>
          <button type="button" class="terminal-pip-btn" onClick={onClose} title="Fermer" aria-label="Fermer">×</button>
        </div>
      </header>
      <div class={`terminal-pip-body ${minimized ? 'terminal-pip-body-hidden' : ''}`} aria-hidden={minimized}>
        {activeTab && termUrl && <StableTerminalObject url={termUrl} title={activeTab.name} tabKey={`pip-${displayActiveTabId}`} onContentLoad={(win) => { pipContentWindowRef.current = win; }} />}
      </div>
    </div>
  );
}
