import { useState, useRef, useEffect } from 'preact/hooks';

export default function LabButtonDropdown({
  currentLab,
  labPanelOpen,
  onLabPanelToggle,
  onLabPanelClose,
  onTerminalInPanel,
  onTerminalPip,
  onTerminalNewTab,
  onCapturePanelToggle,
  onCaptureNewTab,
  onNavigate,
  onDeactivateLab,
  getViewUrl,
  capturePanelOpen,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isActiveLab = currentLab?.id && currentLab.id !== 'default';

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

  if (!isActiveLab) {
    return (
      <button
        type="button"
        class="topbar-btn topbar-btn-lab"
        onClick={onLabPanelToggle}
        title={`Lab actif : ${currentLab?.name || 'Lab par défaut'}`}
        aria-expanded={labPanelOpen}
      >
        <span class="topbar-btn-lab-label">Lab</span>
        <span class="topbar-btn-lab-name">{currentLab?.name || 'Lab par défaut'}</span>
      </button>
    );
  }

  return (
    <div class="lab-button-dropdown" ref={ref}>
      <button
        type="button"
        class="topbar-btn topbar-btn-lab topbar-btn-lab-dropdown"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        title={`Lab actif : ${currentLab.name}`}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span class="topbar-btn-lab-label">Lab</span>
        <span class="topbar-btn-lab-name">{currentLab.name}</span>
        <span class="lab-dropdown-chevron">▼</span>
      </button>
      {open && (
        <ul class="lab-dropdown-menu" role="menu">
          <li>
            <button type="button" class="lab-dropdown-item" onClick={(e) => { e.stopPropagation(); select(() => { onLabPanelToggle(); }); }}>
              📋 Détails du lab (notes, rapport)
            </button>
          </li>
          <li class="lab-dropdown-divider" role="separator" />
          {onTerminalInPanel && (
            <li>
              <button type="button" class="lab-dropdown-item" onClick={(e) => { e.stopPropagation(); select(onTerminalInPanel); }}>
                ⌨ Terminal (panneau)
              </button>
            </li>
          )}
          {onTerminalNewTab && (
            <li>
              <button type="button" class="lab-dropdown-item" onClick={(e) => { e.stopPropagation(); select(onTerminalNewTab); }}>
                ⌨ Terminal (nouvel onglet)
              </button>
            </li>
          )}
          {onTerminalPip && (
            <li>
              <button type="button" class="lab-dropdown-item" onClick={(e) => { e.stopPropagation(); select(onTerminalPip); }}>
                ▶ Terminal (PiP)
              </button>
            </li>
          )}
          {onCapturePanelToggle && (
            <li>
              <button type="button" class={`lab-dropdown-item ${capturePanelOpen ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); select(onCapturePanelToggle); }}>
                📡 Capture pcap (panneau)
              </button>
            </li>
          )}
          {onCaptureNewTab && (
            <li>
              <button type="button" class="lab-dropdown-item" onClick={(e) => { e.stopPropagation(); select(onCaptureNewTab); }}>
                📡 Capture pcap (nouvel onglet)
              </button>
            </li>
          )}
          {onNavigate && (
            <>
              <li>
                <button type="button" class="lab-dropdown-item" onClick={(e) => { e.stopPropagation(); select(() => onNavigate('network-sim')); }}>
                  🔌 Simulateur réseau
                </button>
              </li>
              <li>
                <button type="button" class="lab-dropdown-item" onClick={(e) => { e.stopPropagation(); select(() => onNavigate('proxy-config')); }}>
                  🔧 Proxy (config)
                </button>
              </li>
              <li>
                <button type="button" class="lab-dropdown-item" onClick={(e) => { e.stopPropagation(); select(() => onNavigate('api-client')); }}>
                  📤 Requêtes API
                </button>
              </li>
            </>
          )}
          {onDeactivateLab && (
            <>
              <li class="lab-dropdown-divider" role="separator" />
              <li>
                <button type="button" class="lab-dropdown-item lab-dropdown-item-danger" onClick={(e) => { e.stopPropagation(); select(onDeactivateLab); }}>
                  Désactiver le lab
                </button>
              </li>
            </>
          )}
        </ul>
      )}
    </div>
  );
}
