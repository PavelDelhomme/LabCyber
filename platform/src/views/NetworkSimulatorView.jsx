import { useState, useEffect, useRef } from 'preact/hooks';
import { escapeHtml } from '../lib/store';

const NODE_TYPES = [
  { type: 'pc', label: 'PC', color: '#60a5fa', w: 56, h: 36 },
  { type: 'router', label: 'Routeur', color: '#f87171', w: 56, h: 36 },
  { type: 'switch', label: 'Switch', color: '#34d399', w: 56, h: 36 },
  { type: 'server', label: 'Serveur', color: '#a78bfa', w: 56, h: 36 },
];

const SERVER_TYPES = [
  { value: 'web', label: 'Web (HTTP)' },
  { value: 'dns', label: 'DNS' },
  { value: 'mail', label: 'Mail' },
  { value: 'file', label: 'Fichier' },
  { value: 'api', label: 'API' },
  { value: 'custom', label: 'Autre' },
];

const SWITCH_TYPES = [
  { value: 'layer2', label: 'Couche 2 (L2)' },
  { value: 'layer3', label: 'Couche 3 (L3)' },
];

const LINK_TYPES = [
  { id: 'ethernet-straight', label: 'Ethernet droit', short: 'Droit', stroke: '#6b7280', dash: '' },
  { id: 'ethernet-crossover', label: 'Ethernet croisé', short: 'Croisé', stroke: '#dc2626', dash: '' },
  { id: 'console', label: 'Console (RJ-45)', short: 'Console', stroke: '#16a34a', dash: '4,4' },
  { id: 'fiber', label: 'Fibre optique', short: 'Fibre', stroke: '#2563eb', dash: '1,2' },
];

function getNodeColor(type) {
  return NODE_TYPES.find((t) => t.type === type)?.color || '#9aa0a6';
}

function defaultNodeConfig(type) {
  const base = { ip: '', gateway: '', subnetMask: '255.255.255.0' };
  if (type === 'server') return { ...base, serverType: 'web' };
  if (type === 'switch') return { ...base, switchType: 'layer2' };
  return base;
}

export default function NetworkSimulatorView({ storage, currentLabId: appLabId }) {
  const currentLabId = appLabId || storage?.getCurrentLabId?.() || 'default';
  const [simContext, setSimContext] = useState('lab');
  const effectiveLabId = simContext === 'custom' ? 'custom' : currentLabId;

  const simData = storage?.getNetworkSimulations?.(effectiveLabId) || { simulations: [], currentId: null };
  const topologies = storage?.getTopologies?.() || {};

  const [simulations, setSimulations] = useState(simData.simulations || []);
  const [currentSimId, setCurrentSimId] = useState(simData.currentId || null);

  const currentSim = simulations.find((s) => s.id === currentSimId);
  const [nodes, setNodes] = useState(currentSim?.nodes || []);
  const [edges, setEdges] = useState(currentSim?.edges || []);
  const [linkMode, setLinkMode] = useState(false);
  const [connectLinkType, setConnectLinkType] = useState('ethernet-straight');
  const [connectFrom, setConnectFrom] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dragOff, setDragOff] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const initialLoad = useRef(true);
  const prevLabIdRef = useRef(effectiveLabId);
  const lastSimStateRef = useRef({ simulations: [], nodes: [], edges: [], currentSimId: null });
  lastSimStateRef.current = { simulations, nodes, edges, currentSimId };

  useEffect(() => {
    const prevLabId = prevLabIdRef.current;
    if (prevLabId !== effectiveLabId && storage?.setNetworkSimulations) {
      const { simulations: prevSims, nodes: prevNodes, edges: prevEdges, currentSimId: prevCurId } = lastSimStateRef.current;
      if (prevCurId) {
        const updated = prevSims.map((s) =>
          s.id === prevCurId ? { ...s, nodes: prevNodes, edges: prevEdges, updatedAt: new Date().toISOString() } : s
        );
        storage.setNetworkSimulations(prevLabId, { simulations: updated, currentId: prevCurId });
      }
    }
    prevLabIdRef.current = effectiveLabId;

    let data = storage?.getNetworkSimulations?.(effectiveLabId) || { simulations: [], currentId: null };
    const oldTopo = topologies[effectiveLabId];
    if (
      (!data.simulations || data.simulations.length === 0) &&
      oldTopo &&
      Array.isArray(oldTopo.nodes) &&
      oldTopo.nodes.length > 0
    ) {
      const simId = 'sim' + Date.now();
      const migrated = {
        simulations: [{ id: simId, name: 'Topologie 1', nodes: oldTopo.nodes, edges: oldTopo.edges || [], createdAt: new Date().toISOString() }],
        currentId: simId,
      };
      storage?.setNetworkSimulations?.(effectiveLabId, migrated);
      data = migrated;
    }
    const sims = data.simulations || [];
    const cur = data.currentId || (sims.length ? sims[0].id : null);
    setSimulations(sims);
    setCurrentSimId(cur);
  }, [effectiveLabId, storage]);

  useEffect(() => {
    const sim = (storage?.getNetworkSimulations?.(effectiveLabId) || {}).simulations?.find((s) => s.id === currentSimId);
    if (sim) {
      setNodes(sim.nodes || []);
      setEdges(sim.edges || []);
    } else {
      setNodes([]);
      setEdges([]);
    }
    setSelectedId(null);
    setConnectFrom(null);
    setLinkMode(false);
    initialLoad.current = true;
  }, [currentSimId, effectiveLabId]);

  const persistCurrentSim = (nextNodes, nextEdges) => {
    const n = nextNodes ?? nodes;
    const e = nextEdges ?? edges;
    if (!currentSimId) return;
    const updated = simulations.map((s) =>
      s.id === currentSimId ? { ...s, nodes: n, edges: e, updatedAt: new Date().toISOString() } : s
    );
    setSimulations(updated);
    storage?.setNetworkSimulations?.(effectiveLabId, { simulations: updated, currentId: currentSimId });
  };

  const addSimulation = () => {
    const id = 'sim' + Date.now();
    const name = 'Carte ' + (simulations.length + 1);
    const next = [...simulations, { id, name, nodes: [], edges: [], createdAt: new Date().toISOString() }];
    setSimulations(next);
    setCurrentSimId(id);
    setNodes([]);
    setEdges([]);
    storage?.setNetworkSimulations?.(effectiveLabId, { simulations: next, currentId: id });
  };

  const duplicateSimulation = () => {
    if (!currentSim) return;
    const id = 'sim' + Date.now();
    const name = (currentSim.name || 'Carte') + ' (copie)';
    const oldNodes = currentSim.nodes || [];
    const idMap = {};
    const newNodes = oldNodes.map((n, i) => {
      const newId = 'n' + Date.now() + '_' + i;
      idMap[n.id] = newId;
      return { ...n, id: newId };
    });
    const newEdges = (currentSim.edges || []).map((e, i) => ({
      ...e,
      id: 'e' + Date.now() + '_' + i,
      from: idMap[e.from] || e.from,
      to: idMap[e.to] || e.to,
    }));
    const newSim = { id, name, nodes: newNodes, edges: newEdges, createdAt: new Date().toISOString() };
    const next = [...simulations, newSim];
    setSimulations(next);
    setCurrentSimId(id);
    setNodes(newNodes);
    setEdges(newEdges);
    storage?.setNetworkSimulations?.(effectiveLabId, { simulations: next, currentId: id });
  };

  const deleteSimulation = () => {
    if (!currentSimId || !confirm('Supprimer cette carte ?')) return;
    const next = simulations.filter((s) => s.id !== currentSimId);
    const newCurrent = next[0]?.id || null;
    setSimulations(next);
    setCurrentSimId(newCurrent);
    setNodes(next.find((s) => s.id === newCurrent)?.nodes || []);
    setEdges(next.find((s) => s.id === newCurrent)?.edges || []);
    storage?.setNetworkSimulations?.(effectiveLabId, { simulations: next, currentId: newCurrent });
  };

  const renameSimulation = () => {
    const name = prompt('Nom de la carte ?', currentSim?.name || '');
    if (name == null) return;
    const next = simulations.map((s) => (s.id === currentSimId ? { ...s, name: name.trim() || s.name } : s));
    setSimulations(next);
    storage?.setNetworkSimulations?.(effectiveLabId, { simulations: next, currentId: currentSimId });
  };

  const addNode = (type) => {
    const def = NODE_TYPES.find((t) => t.type === type) || NODE_TYPES[0];
    const id = 'n' + Date.now();
    const count = nodes.filter((x) => x.type === type).length + 1;
    const config = defaultNodeConfig(type);
    setNodes((n) => [
      ...n,
      {
        id,
        type,
        x: 120 + (n.length % 4) * 140,
        y: 100 + Math.floor(n.length / 4) * 100,
        label: def.label + ' ' + count,
        ...config,
      },
    ]);
  };

  const getNodePos = (id) => {
    const n = nodes.find((x) => x.id === id);
    if (!n) return { x: 0, y: 0 };
    const def = NODE_TYPES.find((t) => t.type === n.type);
    return { x: n.x + (def?.w || 40) / 2, y: n.y + (def?.h || 30) / 2 };
  };

  const getNextPort = (nodeId) => {
    const used = edges.filter((e) => e.from === nodeId || e.to === nodeId);
    const fromPorts = used.filter((e) => e.from === nodeId).map((e) => e.fromPort).filter((p) => p != null);
    const toPorts = used.filter((e) => e.to === nodeId).map((e) => e.toPort).filter((p) => p != null);
    const max = Math.max(0, ...fromPorts, ...toPorts);
    return max + 1;
  };

  const selectedNode = selectedId ? nodes.find((x) => x.id === selectedId) : null;

  const updateNodeConfig = (id, patch) => {
    setNodes((n) => n.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const nextNodes = nodes.filter((x) => x.id !== selectedId);
    const nextEdges = edges.filter((x) => x.from !== selectedId && x.to !== selectedId);
    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedId(null);
    persistCurrentSim(nextNodes, nextEdges);
  };

  const handleSvgClick = (e) => {
    if (e.target !== svgRef.current && e.target.getAttribute('data-node-id')) return;
    if (linkMode) setConnectFrom(null);
    else setSelectedId(null);
  };

  const cancelLinkMode = () => {
    setLinkMode(false);
    setConnectFrom(null);
  };

  const handleNodeClick = (id, e) => {
    e.stopPropagation();
    if (linkMode && connectFrom !== null) {
      if (connectFrom === id) {
        setConnectFrom(null);
        return;
      }
      const fromPort = getNextPort(connectFrom);
      const toPort = getNextPort(id);
      setEdges((ed) => [
        ...ed,
        {
          id: 'e' + Date.now(),
          from: connectFrom,
          to: id,
          linkType: connectLinkType,
          fromPort,
          toPort,
        },
      ]);
      setConnectFrom(null);
      return;
    }
    if (linkMode) {
      setConnectFrom(id);
      return;
    }
    setSelectedId(id);
  };

  const svgWrapRef = useRef(null);
  const clientToSvg = (clientX, clientY) => {
    const wrap = svgWrapRef.current;
    if (!wrap) return { x: clientX, y: clientY };
    const rect = wrap.getBoundingClientRect();
    return { x: (clientX - rect.left) * (800 / rect.width), y: (clientY - rect.top) * (520 / rect.height) };
  };

  const handleNodeMouseDown = (id, e) => {
    e.stopPropagation();
    const n = nodes.find((x) => x.id === id);
    if (!n) return;
    const pt = clientToSvg(e.clientX, e.clientY);
    setDragId(id);
    setDragOff({ x: pt.x - n.x, y: pt.y - n.y });
  };

  const handleMouseMove = (e) => {
    if (!dragId) return;
    const pt = clientToSvg(e.clientX, e.clientY);
    setNodes((n) => n.map((x) => (x.id === dragId ? { ...x, x: pt.x - dragOff.x, y: pt.y - dragOff.y } : x)));
  };

  const handleMouseUp = () => setDragId(null);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragId, dragOff]);

  const clearTopology = () => {
    if (!confirm('Effacer toute la topologie de cette carte ?')) return;
    setNodes([]);
    setEdges([]);
    setSelectedId(null);
    setConnectFrom(null);
    setLinkMode(false);
    persistCurrentSim([], []);
  };

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    persistCurrentSim(nodes, edges);
  }, [nodes, edges]);

  return (
    <div id="view-network-sim" class="view">
      <header class="page-header">
        <h2>Simulateur réseau (type Packet Tracer)</h2>
        <p class="room-description">
          Plusieurs cartes réseau par lab : topologie, config IP (PC, routeur, switch, serveur), types de service (Web, DNS, etc.) et de switch (L2/L3). Contexte lab actif ou session personnalisée. Intégré aux scénarios et à la progression.
        </p>
      </header>

      <div class="network-sim-context" style="margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap">
        <span class="network-sim-toolbar-label">Contexte :</span>
        <label style="display:inline-flex; align-items:center; gap:0.35rem; cursor:pointer">
          <input type="radio" name="sim-context" checked={simContext === 'lab'} onChange={() => setSimContext('lab')} />
          Lab actuel
        </label>
        <label style="display:inline-flex; align-items:center; gap:0.35rem; cursor:pointer">
          <input type="radio" name="sim-context" checked={simContext === 'custom'} onChange={() => setSimContext('custom')} />
          Session personnalisée
        </label>
      </div>

      <div class="network-sim-maps" style="margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap">
        <span class="network-sim-toolbar-label">Carte :</span>
        <select
          class="api-client-select"
          value={currentSimId || ''}
          onInput={(e) => {
            const newId = e.target.value || null;
            if (currentSimId) persistCurrentSim(nodes, edges);
            setCurrentSimId(newId);
          }}
          style="minWidth:180px"
        >
          <option value="">— Nouvelle carte —</option>
          {simulations.map((s) => (
            <option key={s.id} value={s.id}>{escapeHtml(s.name || s.id)}</option>
          ))}
        </select>
        <button type="button" class="btn btn-primary" onClick={addSimulation}>Nouvelle carte</button>
        <button type="button" class="btn btn-secondary" onClick={duplicateSimulation} disabled={!currentSim}>
          Dupliquer
        </button>
        <button type="button" class="btn btn-secondary" onClick={renameSimulation} disabled={!currentSim}>
          Renommer
        </button>
        <button type="button" class="topbar-btn danger" onClick={deleteSimulation} disabled={!currentSim}>
          Supprimer la carte
        </button>
      </div>

      <div class="network-sim-toolbar">
        <span class="network-sim-toolbar-label">Ajouter :</span>
        {NODE_TYPES.map((t) => (
          <button key={t.type} type="button" class="btn btn-secondary" onClick={() => addNode(t.type)} style={{ borderColor: t.color }}>
            {t.label}
          </button>
        ))}
        <span class="network-sim-toolbar-sep">|</span>
        <span class="network-sim-toolbar-label">Relier (type Packet Tracer) :</span>
        <button
          type="button"
          class={`btn ${linkMode ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setLinkMode(!linkMode); if (linkMode) cancelLinkMode(); }}
          title="Choisis le type de câble puis clique sur le 1er appareil, puis le 2ème"
        >
          {linkMode ? 'Mode liaison actif' : 'Relier 2 appareils'}
        </button>
        {linkMode && (
          <>
            <span class="network-sim-toolbar-label">Type de câble :</span>
            {LINK_TYPES.map((lt) => (
              <button
                key={lt.id}
                type="button"
                class={`btn btn-secondary ${connectLinkType === lt.id ? 'active' : ''}`}
                onClick={() => setConnectLinkType(lt.id)}
                title={lt.label}
                style={{ borderColor: lt.stroke }}
              >
                {lt.short}
              </button>
            ))}
            <span class="network-sim-toolbar-hint">
              {connectFrom ? `2ème appareil : ${(nodes.find((n) => n.id === connectFrom)?.label || connectFrom)} → ?` : 'Clique sur le 1er appareil'}
            </span>
            <button type="button" class="btn btn-secondary" onClick={cancelLinkMode}>Annuler</button>
          </>
        )}
        {selectedId && !linkMode && (
          <button type="button" class="topbar-btn danger" onClick={deleteSelected}>Supprimer le nœud</button>
        )}
        <button type="button" class="btn btn-secondary" onClick={clearTopology}>Effacer cette carte</button>
      </div>

      <div class="network-sim-canvas-and-config">
        <div class="network-sim-canvas-wrap" ref={svgWrapRef}>
          {nodes.length === 0 && !currentSimId && (
            <p class="section-desc text-muted" style="padding:1rem">Choisis une carte ou crée-en une nouvelle.</p>
          )}
          {nodes.length === 0 && currentSimId && (
            <p class="section-desc text-muted" style="padding:1rem">Aucun nœud. Ajoute des équipements (PC, routeur, switch, serveur), relie-les, puis clique sur un nœud pour configurer IP / type.</p>
          )}
          <svg
            ref={svgRef}
            class="network-sim-canvas"
            width="100%"
            height="520"
            viewBox="0 0 800 520"
            onClick={handleSvgClick}
            style={{ display: nodes.length ? 'block' : 'none' }}
          >
            <defs>
              {LINK_TYPES.map((lt) => (
                <marker key={lt.id} id={`arrow-${lt.id}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill={lt.stroke} />
                </marker>
              ))}
            </defs>
            {edges.map((ed) => {
              const a = getNodePos(ed.from);
              const b = getNodePos(ed.to);
              const lt = LINK_TYPES.find((l) => l.id === (ed.linkType || 'ethernet-straight')) || LINK_TYPES[0];
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
              return (
                <g key={ed.id}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={lt.stroke}
                    strokeWidth="2.5"
                    strokeDasharray={lt.dash || undefined}
                    markerEnd={`url(#arrow-${lt.id})`}
                  />
                  <text x={mx} y={my} textAnchor="middle" fill={lt.stroke} fontSize="9" fontWeight="600">
                    {ed.fromPort != null && ed.toPort != null ? `Fa0/${ed.fromPort}→Fa0/${ed.toPort}` : lt.short}
                  </text>
                </g>
              );
            })}
            {nodes.map((n) => {
              const def = NODE_TYPES.find((t) => t.type === n.type) || NODE_TYPES[0];
              const color = getNodeColor(n.type);
              const sel = selectedId === n.id;
              const conn = connectFrom === n.id;
              return (
                <g
                  key={n.id}
                  data-node-id={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  onClick={(e) => handleNodeClick(n.id, e)}
                  onMouseDown={(e) => handleNodeMouseDown(n.id, e)}
                  style="cursor:pointer"
                >
                  <rect width={def.w} height={def.h} rx="4" fill={color} stroke={sel || conn ? '#fff' : 'transparent'} strokeWidth="2" opacity="0.9" />
                  <text x={def.w / 2} y={def.h / 2 + 4} textAnchor="middle" fill="#fff" fontSize="10">
                    {escapeHtml(n.label || n.id)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {selectedNode && (
          <aside class="network-sim-config-panel">
            <h4>Config : {escapeHtml(selectedNode.label || selectedNode.id)}</h4>
            {(() => {
              const nodeEdges = edges.filter((e) => e.from === selectedNode.id || e.to === selectedNode.id);
              return nodeEdges.length > 0 ? (
                <div class="network-sim-ports" style={{ marginBottom: '0.75rem' }}>
                  <label>Ports / Liaisons</label>
                  <ul class="network-sim-ports-list">
                    {nodeEdges.map((e) => {
                      const isFrom = e.from === selectedNode.id;
                      const port = isFrom ? e.fromPort : e.toPort;
                      const otherId = isFrom ? e.to : e.from;
                      const other = nodes.find((n) => n.id === otherId);
                      const lt = LINK_TYPES.find((l) => l.id === (e.linkType || 'ethernet-straight'));
                      return (
                        <li key={e.id}>
                          Fa0/{port != null ? port : '?'} → {escapeHtml(other?.label || otherId)} ({lt?.short || e.linkType})
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null;
            })()}
            <div class="network-sim-config-form">
              <label>Nom affiché</label>
              <input
                type="text"
                value={selectedNode.label || ''}
                onInput={(e) => updateNodeConfig(selectedNode.id, { label: e.target.value })}
                placeholder="PC 1"
              />
              {['pc', 'server', 'router'].includes(selectedNode.type) && (
                <>
                  <label>IP</label>
                  <input
                    type="text"
                    value={selectedNode.ip || ''}
                    onInput={(e) => updateNodeConfig(selectedNode.id, { ip: e.target.value })}
                    placeholder="192.168.1.10"
                  />
                  <label>Masque</label>
                  <input
                    type="text"
                    value={selectedNode.subnetMask || '255.255.255.0'}
                    onInput={(e) => updateNodeConfig(selectedNode.id, { subnetMask: e.target.value })}
                  />
                  <label>Passerelle</label>
                  <input
                    type="text"
                    value={selectedNode.gateway || ''}
                    onInput={(e) => updateNodeConfig(selectedNode.id, { gateway: e.target.value })}
                    placeholder="192.168.1.1"
                  />
                </>
              )}
              {selectedNode.type === 'server' && (
                <>
                  <label>Type de service</label>
                  <select
                    value={selectedNode.serverType || 'web'}
                    onInput={(e) => updateNodeConfig(selectedNode.id, { serverType: e.target.value })}
                  >
                    {SERVER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </>
              )}
              {selectedNode.type === 'switch' && (
                <>
                  <label>Type de switch</label>
                  <select
                    value={selectedNode.switchType || 'layer2'}
                    onInput={(e) => updateNodeConfig(selectedNode.id, { switchType: e.target.value })}
                  >
                    {SWITCH_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      <p class="section-desc" style="margin-top:0.75rem">
        Pour du trafic réel : <strong>Terminal</strong> (tcpdump, tshark) et <strong>Capture pcap</strong>. Les cartes sont sauvegardées automatiquement pour le lab.
      </p>
    </div>
  );
}
