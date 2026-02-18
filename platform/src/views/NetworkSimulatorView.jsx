import { useState, useEffect, useRef } from 'preact/hooks';
import { escapeHtml } from '../lib/store';

const NODE_TYPES = [
  { type: 'pc', label: 'PC', color: '#60a5fa', w: 56, h: 36 },
  { type: 'router', label: 'Routeur', color: '#f87171', w: 56, h: 36 },
  { type: 'switch', label: 'Switch', color: '#34d399', w: 56, h: 36 },
  { type: 'server', label: 'Serveur', color: '#a78bfa', w: 56, h: 36 },
];

function getNodeColor(type) {
  return NODE_TYPES.find(t => t.type === type)?.color || '#9aa0a6';
}

export default function NetworkSimulatorView({ storage }) {
  const currentLabId = storage?.getCurrentLabId() || 'default';
  const topologies = storage?.getTopologies() || {};
  const saved = topologies[currentLabId] || { nodes: [], edges: [] };

  const [nodes, setNodes] = useState(saved.nodes || []);
  const [edges, setEdges] = useState(saved.edges || []);
  const [connectFrom, setConnectFrom] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dragOff, setDragOff] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  const initialLoad = useRef(true);
  useEffect(() => {
    const t = topologies[currentLabId];
    initialLoad.current = true;
    if (t?.nodes) setNodes(t.nodes);
    else setNodes([]);
    if (t?.edges) setEdges(t.edges);
    else setEdges([]);
  }, [currentLabId]);

  const saveTopology = () => {
    const topo = { nodes: [...nodes], edges: [...edges] };
    storage?.setTopology(currentLabId, topo);
  };

  const addNode = (type) => {
    const def = NODE_TYPES.find(t => t.type === type) || NODE_TYPES[0];
    const id = 'n' + Date.now();
    setNodes(n => [...n, { id, type, x: 120 + (n.length % 4) * 140, y: 100 + Math.floor(n.length / 4) * 100, label: def.label + ' ' + (n.filter(x => x.type === type).length + 1) }]);
  };

  const getNodePos = (id) => {
    const n = nodes.find(x => x.id === id);
    if (!n) return { x: 0, y: 0 };
    const def = NODE_TYPES.find(t => t.type === n.type);
    return { x: n.x + (def?.w || 40) / 2, y: n.y + (def?.h || 30) / 2 };
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    const nextNodes = nodes.filter(x => x.id !== selectedId);
    const nextEdges = edges.filter(x => x.from !== selectedId && x.to !== selectedId);
    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedId(null);
    storage?.setTopology(currentLabId, { nodes: nextNodes, edges: nextEdges });
  };

  const handleSvgClick = (e) => {
    if (e.target !== svgRef.current && e.target.getAttribute('data-node-id')) return;
    if (connectFrom) setConnectFrom(null);
    else setSelectedId(null);
  };

  const handleNodeClick = (id, e) => {
    e.stopPropagation();
    if (connectFrom) {
      if (connectFrom === id) setConnectFrom(null);
      else {
        setEdges(ed => [...ed, { id: 'e' + Date.now(), from: connectFrom, to: id }]);
        setConnectFrom(null);
      }
      return;
    }
    setSelectedId(id);
  };

  const svgWrapRef = useRef(null);

  const clientToSvg = (clientX, clientY) => {
    const wrap = svgWrapRef.current;
    if (!wrap) return { x: clientX, y: clientY };
    const rect = wrap.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (800 / rect.width),
      y: (clientY - rect.top) * (520 / rect.height),
    };
  };

  const handleNodeMouseDown = (id, e) => {
    e.stopPropagation();
    const n = nodes.find(x => x.id === id);
    if (!n) return;
    const pt = clientToSvg(e.clientX, e.clientY);
    setDragId(id);
    setDragOff({ x: pt.x - n.x, y: pt.y - n.y });
  };

  const handleMouseMove = (e) => {
    if (!dragId) return;
    const pt = clientToSvg(e.clientX, e.clientY);
    setNodes(n => n.map(x => x.id === dragId ? { ...x, x: pt.x - dragOff.x, y: pt.y - dragOff.y } : x));
  };

  const handleMouseUp = () => {
    setDragId(null);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [dragId, dragOff]);

  const clearTopology = () => {
    if (confirm('Effacer toute la topologie ?')) {
      setNodes([]);
      setEdges([]);
      setSelectedId(null);
      setConnectFrom(null);
      storage?.setTopology(currentLabId, { nodes: [], edges: [] });
    }
  };

  useEffect(() => {
    if (initialLoad.current) { initialLoad.current = false; return; }
    storage?.setTopology(currentLabId, { nodes, edges });
  }, [nodes, edges]);

  return (
    <div id="view-network-sim" class="view">
      <header class="page-header">
        <h2>Simulateur réseau (topologie)</h2>
        <p class="room-description">Dessine une topologie type Packet Tracer : ajoute des nœuds (PC, routeur, switch, serveur), relie-les. La topologie est enregistrée pour le lab actif.</p>
      </header>

      <div class="network-sim-toolbar">
        <span class="network-sim-toolbar-label">Ajouter :</span>
        {NODE_TYPES.map(t => (
          <button key={t.type} type="button" class="btn btn-secondary" onClick={() => addNode(t.type)} style={{ borderColor: t.color }}>
            {t.label}
          </button>
        ))}
        <button type="button" class="btn btn-secondary" onClick={() => setConnectFrom(selectedId)} disabled={!selectedId} title="Puis cliquer sur un autre nœud pour relier">
          {connectFrom ? 'Annuler liaison' : 'Relier (clic sur 2 nœuds)'}
        </button>
        {selectedId && (
          <button type="button" class="topbar-btn danger" onClick={deleteSelected}>Supprimer le nœud</button>
        )}
        <button type="button" class="btn btn-secondary" onClick={clearTopology}>Effacer tout</button>
      </div>

      <div class="network-sim-canvas-wrap" ref={svgWrapRef}>
        <svg
          ref={svgRef}
          class="network-sim-canvas"
          width="100%"
          height="520"
          viewBox="0 0 800 520"
          onClick={handleSvgClick}
        >
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-muted)" />
            </marker>
          </defs>
          {edges.map(ed => {
            const a = getNodePos(ed.from);
            const b = getNodePos(ed.to);
            return (
              <line key={ed.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--text-muted)" strokeWidth="2" markerEnd="url(#arrowhead)" />
            );
          })}
          {nodes.map(n => {
            const def = NODE_TYPES.find(t => t.type === n.type) || NODE_TYPES[0];
            const color = getNodeColor(n.type);
            const sel = selectedId === n.id;
            const conn = connectFrom === n.id;
            return (
              <g
                key={n.id}
                data-node-id={n.id}
                transform={`translate(${n.x},${n.y})`}
                onClick={e => handleNodeClick(n.id, e)}
                onMouseDown={e => handleNodeMouseDown(n.id, e)}
                style="cursor:pointer"
              >
                <rect width={def.w} height={def.h} rx="4" fill={color} stroke={sel || conn ? '#fff' : 'transparent'} strokeWidth="2" opacity="0.9" />
                <text x={def.w / 2} y={def.h / 2 + 4} textAnchor="middle" fill="#fff" fontSize="10">{escapeHtml(n.label)}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <p class="section-desc" style="margin-top:0.75rem">
        Pour capturer du trafic réel sur une topologie, utilise le <strong>Terminal</strong> (tcpdump, tshark) ou le visualiseur <strong>Capture</strong> après avoir exporté un .pcap depuis le terminal.
      </p>
    </div>
  );
}
