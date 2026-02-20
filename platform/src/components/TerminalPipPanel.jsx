import { useState, useRef, useEffect, useMemo } from 'preact/hooks';

/** Iframe dont le src n'est défini qu'une fois au montage pour éviter tout rechargement au re-render (ex. ls qui faisait tout recharger). */
function StableTerminalIframe({ url, title, tabKey, onIframeLoad }) {
  const iframeRef = useRef(null);
  const urlSetRef = useRef(null);
  useEffect(() => {
    if (!iframeRef.current || !url) return;
    if (urlSetRef.current === tabKey) return;
    iframeRef.current.src = url;
    urlSetRef.current = tabKey;
  }, [url, tabKey]);
  return <iframe ref={iframeRef} title={title} class="terminal-pip-iframe" key={tabKey} onLoad={() => { if (iframeRef.current?.contentWindow) onIframeLoad?.(iframeRef.current.contentWindow); }} />;
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
  const [pos, setPos] = useState(controlledPos ?? { x: typeof window !== 'undefined' ? window.innerWidth - 420 : 400, y: typeof window !== 'undefined' ? window.innerHeight - 340 : 300 });
  const [minimized, setMinimized] = useState(controlledMinimized ?? false);
  const [dragging, setDragging] = useState(false);
  const [tabs, setTabs] = useState(controlledTabs ?? [{ id: '1', name: 'Session 1' }]);
  const [activeTabId, setActiveTabId] = useState(controlledActiveTabId ?? '1');
  const dragRef = useRef({ startX: 0, startY: 0, startPos: { x: 0, y: 0 } });
  const pipIframeWindowRef = useRef(null);

  const isControlled = controlledTabs != null && controlledActiveTabId != null;
  const displayTabs = isControlled ? controlledTabs : tabs;
  const displayActiveTabId = isControlled ? controlledActiveTabId : activeTabId;
  const displayPos = controlledPos != null ? controlledPos : pos;

  useEffect(() => {
    if (controlledMinimized !== undefined) setMinimized(controlledMinimized);
  }, [controlledMinimized]);
  useEffect(() => {
    if (controlledTabs != null) setTabs(controlledTabs);
  }, [controlledTabs]);
  useEffect(() => {
    if (controlledActiveTabId != null) setActiveTabId(controlledActiveTabId);
  }, [controlledActiveTabId]);
  useEffect(() => {
    if (controlledPos != null) setPos(controlledPos);
  }, [controlledPos]);

  const handleMinimize = () => {
    const next = !minimized;
    setMinimized(next);
    onMinimize?.(next);
    onStateChange?.({ tabs: displayTabs, activeTabId: displayActiveTabId, minimized: next, pos: displayPos });
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    setDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPos: { ...displayPos } };
  };

  useEffect(() => {
    const onMessage = (e) => {
      if (e?.data?.type !== 'lab-cyber-terminal-exit') return;
      if (e.source !== pipIframeWindowRef.current) return;
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

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const nextPos = {
        x: Math.max(0, Math.min(w - (minimized ? 220 : 400), dragRef.current.startPos.x + dx)),
        y: Math.max(0, Math.min(h - (minimized ? 48 : 320), dragRef.current.startPos.y + dy)),
      };
      setPos(nextPos);
      onStateChange?.({ tabs: displayTabs, activeTabId: displayActiveTabId, minimized, pos: nextPos });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, minimized, displayTabs, displayActiveTabId, onStateChange]);

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
      style={{ left: displayPos.x, top: displayPos.y }}
      role="dialog"
      aria-label="Terminal (PiP)"
    >
      <header
        class="terminal-pip-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      >
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
      {!minimized && (
        <div class="terminal-pip-body">
          {activeTab && termUrl && <StableTerminalIframe url={termUrl} title={activeTab.name} tabKey={`pip-${displayActiveTabId}`} onIframeLoad={(win) => { pipIframeWindowRef.current = win; }} />}
        </div>
      )}
    </div>
  );
}
