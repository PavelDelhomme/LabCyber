import { useState, useRef, useEffect } from 'preact/hooks';

export default function TerminalPipPanel({ open, onClose, getTerminalUrl, minimized: controlledMinimized, onMinimize }) {
  const [pos, setPos] = useState({ x: typeof window !== 'undefined' ? window.innerWidth - 420 : 400, y: typeof window !== 'undefined' ? window.innerHeight - 340 : 300 });
  const [minimized, setMinimized] = useState(controlledMinimized ?? false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPos: { x: 0, y: 0 } });

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

  if (!open) return null;

  const termUrl = typeof getTerminalUrl === 'function' ? getTerminalUrl() : '';

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
        <div class="terminal-pip-actions">
          <button type="button" class="terminal-pip-btn" onClick={handleMinimize} title={minimized ? 'Agrandir' : 'Réduire'} aria-label={minimized ? 'Agrandir' : 'Réduire'}>
            {minimized ? '▶' : '▼'}
          </button>
          <button type="button" class="terminal-pip-btn" onClick={onClose} title="Fermer" aria-label="Fermer">×</button>
        </div>
      </header>
      {!minimized && (
        <div class="terminal-pip-body">
          <iframe src={termUrl} title="Terminal" class="terminal-pip-iframe" />
        </div>
      )}
    </div>
  );
}
