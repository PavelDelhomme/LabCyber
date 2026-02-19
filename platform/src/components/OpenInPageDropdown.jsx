import { useState, useRef, useEffect } from 'preact/hooks';

export default function OpenInPageDropdown({
  onTerminalPanel,
  onTerminalPip,
  onCapture,
  onSimulator,
  onProxy,
  onApi,
  captureOpen,
  label = 'Ouvrir dans la page',
  class: className = '',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const t = setTimeout(() => document.addEventListener('click', onDocClick, true), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', onDocClick, true); };
  }, [open]);

  const select = (fn) => {
    fn?.();
    setOpen(false);
  };

  return (
    <div class={`open-in-page-dropdown ${className}`} ref={ref}>
      <button
        type="button"
        class="open-in-page-btn"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={label}
      >
        <span class="open-in-page-label">{label}</span>
        <span class="open-in-page-chevron">▼</span>
      </button>
      {open && (
        <ul class="open-in-page-menu" role="listbox">
          {onTerminalPanel && (
            <li>
              <button type="button" class="open-in-page-item" onClick={(e) => { e.stopPropagation(); select(onTerminalPanel); }}>
                ⌨ Terminal (panneau)
              </button>
            </li>
          )}
          {onTerminalPip && (
            <li>
              <button type="button" class="open-in-page-item" onClick={(e) => { e.stopPropagation(); select(onTerminalPip); }}>
                ▶ Terminal (PiP)
              </button>
            </li>
          )}
          {onCapture && (
            <li>
              <button type="button" class={`open-in-page-item ${captureOpen ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); select(onCapture); }}>
                📡 Capture pcap
              </button>
            </li>
          )}
          {onSimulator && (
            <li>
              <button type="button" class="open-in-page-item" onClick={(e) => { e.stopPropagation(); select(onSimulator); }}>
                🔌 Simulateur réseau
              </button>
            </li>
          )}
          {onProxy && (
            <li>
              <button type="button" class="open-in-page-item" onClick={(e) => { e.stopPropagation(); select(onProxy); }}>
                🔧 Proxy (config)
              </button>
            </li>
          )}
          {onApi && (
            <li>
              <button type="button" class="open-in-page-item" onClick={(e) => { e.stopPropagation(); select(onApi); }}>
                📤 Requêtes API
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
