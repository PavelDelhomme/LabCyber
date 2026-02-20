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
  const [minimized, setMinimized] = useState(controlledMinimized ?? false);
  const [tabs, setTabs] = useState(controlledTabs ?? [{ id: '1', name: 'Session 1' }]);
  const [activeTabId, setActiveTabId] = useState(controlledActiveTabId ?? '1');
  const pipIframeWindowRef = useRef(null);
  const stateChangeRef = useRef(null);

  const isControlled = controlledTabs != null && controlledActiveTabId != null;
  const displayTabs = isControlled ? controlledTabs : tabs;
  const displayActiveTabId = isControlled ? controlledActiveTabId : activeTabId;
  const displayPos = controlledPos ?? { x: 0, y: 0 };
  stateChangeRef.current = { tabs: displayTabs, activeTabId: displayActiveTabId, minimized, pos: displayPos };

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
    >
      <header class="terminal-pip-header">
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
        {activeTab && termUrl && <StableTerminalIframe url={termUrl} title={activeTab.name} tabKey={`pip-${displayActiveTabId}`} onIframeLoad={(win) => { pipIframeWindowRef.current = win; }} />}
      </div>
    </div>
  );
}
