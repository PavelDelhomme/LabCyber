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

export default function TerminalPipPanel({ open, onClose, getTerminalUrl, minimized: controlledMinimized, onMinimize }) {
  const [pos, setPos] = useState({ x: typeof window !== 'undefined' ? window.innerWidth - 420 : 400, y: typeof window !== 'undefined' ? window.innerHeight - 340 : 300 });
  const [minimized, setMinimized] = useState(controlledMinimized ?? false);
  const [dragging, setDragging] = useState(false);
  const [tabs, setTabs] = useState([{ id: '1', name: 'Session 1' }]);
  const [activeTabId, setActiveTabId] = useState('1');
  const dragRef = useRef({ startX: 0, startY: 0, startPos: { x: 0, y: 0 } });
  const pipIframeWindowRef = useRef(null);

  useEffect(() => {
    if (controlledMinimized !== undefined) setMinimized(controlledMinimized);
  }, [controlledMinimized]);

  const handleMinimize = () => {
    const next = !minimized;
    setMinimized(next);
    onMinimize?.(next);
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    setDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPos: { ...pos } };
  };

  useEffect(() => {
    const onMessage = (e) => {
      if (e?.data?.type !== 'lab-cyber-terminal-exit') return;
      if (e.source !== pipIframeWindowRef.current) return;
      const rest = tabs.filter(t => t.id !== activeTabId);
      if (rest.length === 0) onClose?.();
      else {
        setTabs(rest);
        setActiveTabId(rest[0].id);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [tabs, activeTabId, onClose]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const w = window.innerWidth;
      const h = window.innerHeight;
      setPos({
        x: Math.max(0, Math.min(w - (minimized ? 220 : 400), dragRef.current.startPos.x + dx)),
        y: Math.max(0, Math.min(h - (minimized ? 48 : 320), dragRef.current.startPos.y + dy)),
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, minimized]);

  const addTab = (e) => {
    e.stopPropagation();
    const newTab = { id: String(Date.now()), name: `Session ${tabs.length + 1}` };
    setTabs(t => [...t, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId, e) => {
    e.stopPropagation();
    const rest = tabs.filter(t => t.id !== tabId);
    if (rest.length === 0) return;
    setTabs(rest);
    if (activeTabId === tabId) setActiveTabId(rest[0].id);
  };

  if (!open) return null;

  const termUrl = useMemo(() => (typeof getTerminalUrl === 'function' ? getTerminalUrl() : ''), []);
  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div
      class={`terminal-pip-panel ${minimized ? 'terminal-pip-minimized' : ''}`}
      style={{ left: pos.x, top: pos.y }}
      role="dialog"
      aria-label="Terminal (PiP)"
    >
      <header
        class="terminal-pip-header"
        onMouseDown={handleMouseDown}
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      >
        <span class="terminal-pip-title">⌨ Terminal</span>
        {!minimized && tabs.length > 0 && (
          <div class="terminal-pip-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                class={`terminal-pip-tab-btn ${activeTabId === tab.id ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setActiveTabId(tab.id); }}
                title={tab.name}
              >
                <span class="terminal-pip-tab-label">{tab.name}</span>
                {tabs.length > 1 && (
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
          {activeTab && termUrl && <StableTerminalIframe url={termUrl} title={activeTab.name} tabKey={`pip-${activeTabId}`} onIframeLoad={(win) => { pipIframeWindowRef.current = win; }} />}
        </div>
      )}
    </div>
  );
}
