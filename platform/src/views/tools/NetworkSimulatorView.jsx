import { useState, useEffect, useRef } from 'preact/hooks';
import { escapeHtml, getTerminalUrl } from '../../lib/store';

const NODE_TYPES = [
  { type: 'pc', label: 'PC', color: '#60a5fa', w: 56, h: 36, layer: 'L3' },
  { type: 'router', label: 'Routeur', color: '#f87171', w: 56, h: 36, layer: 'L3' },
  { type: 'switch', label: 'Switch', color: '#34d399', w: 56, h: 36, layer: 'L2' },
  { type: 'server', label: 'Serveur', color: '#a78bfa', w: 56, h: 36, layer: 'L3' },
  { type: 'firewall', label: 'Pare-feu', color: '#ef4444', w: 56, h: 36, layer: 'L3' },
  { type: 'ap', label: 'Point d\'accès', color: '#f59e0b', w: 52, h: 34, layer: 'L2' },
  { type: 'cloud', label: 'Cloud / WAN', color: '#06b6d4', w: 58, h: 38, layer: 'L3' },
  { type: 'modem', label: 'Modem', color: '#8b5cf6', w: 50, h: 32, layer: 'L2' },
  { type: 'hub', label: 'Concentrateur (hub)', color: '#84cc16', w: 52, h: 34, layer: 'L1' },
  { type: 'bridge', label: 'Pont (bridge)', color: '#22c55e', w: 52, h: 34, layer: 'L2' },
  { type: 'backbone', label: 'Backbone', color: '#dc2626', w: 60, h: 38, layer: 'L3' },
  { type: 'phone', label: 'Téléphone IP', color: '#ec4899', w: 48, h: 32, layer: 'L3' },
  { type: 'printer', label: 'Imprimante', color: '#64748b', w: 50, h: 32, layer: 'L3' },
  { type: 'tablet', label: 'Tablette', color: '#a78bfa', w: 46, h: 30, layer: 'L3' },
  { type: 'camera', label: 'Caméra IP', color: '#475569', w: 48, h: 30, layer: 'L3' },
];

/** Types d'appareils proposés dans l'interface (base : PC, routeur, switch, serveur — vrais ISO Cisco/HP). Les autres types restent définis pour afficher les anciennes cartes. */
const BASE_NODE_TYPES = ['pc', 'router', 'switch', 'server'];
const NODE_TYPES_BASE = NODE_TYPES.filter((t) => BASE_NODE_TYPES.includes(t.type));

/** Logique type EVE-NG : mapping type nœud → backend réel (PC/serveur = Docker, routeur = Dynamips, switch = IOL). */
const BACKEND_TYPES = { docker: 'Docker', dynamips: 'Dynamips (Cisco)', iol: 'IOL (Cisco)', qemu: 'QEMU (VM)' };
const NODE_TYPE_TO_BACKEND = { pc: 'docker', server: 'docker', router: 'dynamips', switch: 'iol' };
const DEFAULT_BACKEND_IMAGE = { pc: 'network-multitool', server: 'network-multitool', router: 'c7200', switch: 'iol-l2' };
const EVE_NG_SAVED_IMAGES_KEY = 'lab-cyber-eve-ng-saved-images';

/** Utilise les images mises de côté (page EVE-NG) comme images par défaut pour l'export si présentes. */
function getDefaultImagesFromSaved() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(EVE_NG_SAVED_IMAGES_KEY) : null;
    if (!raw) return {};
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return {};
    const byBackend = {};
    for (const key of list) {
      const idx = key.indexOf(':');
      if (idx <= 0) continue;
      const backend = key.slice(0, idx);
      const imageId = key.slice(idx + 1);
      if (!byBackend[backend]) byBackend[backend] = imageId;
    }
    return byBackend;
  } catch {
    return {};
  }
}

/** Modèles par type : spécificités et interface adaptée (sélection type Packet Tracer : catégorie → modèle) */
const DEVICE_MODELS = {
  pc: [
    { value: 'laptop', label: 'PC portable', vendor: 'Generic', layer: 'L3' },
    { value: 'desktop', label: 'PC fixe', vendor: 'Generic', layer: 'L3' },
    { value: 'smartphone', label: 'Smartphone', vendor: 'Generic', layer: 'L3' },
    { value: 'generic', label: 'PC générique', vendor: 'Generic', layer: 'L3' },
    { value: 'cisco', label: 'PC Cisco', vendor: 'Cisco', layer: 'L3' },
  ],
  router: [
    { value: 'generic', label: 'Routeur générique', vendor: 'Generic', layer: 'L3', hasWifi: false },
    { value: 'cisco-1941', label: 'Cisco 1941', vendor: 'Cisco', layer: 'L3', hasWifi: true },
    { value: 'cisco-4321', label: 'Cisco 4321 ISR', vendor: 'Cisco', layer: 'L3', hasWifi: true },
    { value: 'cisco-2911', label: 'Cisco 2911', vendor: 'Cisco', layer: 'L3', hasWifi: false },
    { value: 'cisco-2901', label: 'Cisco 2901', vendor: 'Cisco', layer: 'L3', hasWifi: false },
    { value: 'hp-msr', label: 'HP MSR', vendor: 'HP', layer: 'L3', hasWifi: false },
    { value: 'juniper-mx', label: 'Juniper MX', vendor: 'Juniper', layer: 'L3', hasWifi: false },
    { value: 'mikrotik', label: 'MikroTik RouterOS', vendor: 'MikroTik', layer: 'L3', hasWifi: true },
  ],
  switch: [
    { value: 'generic-l2', label: 'Switch L2 générique', vendor: 'Generic', layer: 'L2' },
    { value: 'cisco-2960', label: 'Cisco 2960', vendor: 'Cisco', layer: 'L2' },
    { value: 'cisco-3560', label: 'Cisco 3560 (L3)', vendor: 'Cisco', layer: 'L3' },
    { value: 'cisco-3850', label: 'Cisco 3850', vendor: 'Cisco', layer: 'L3' },
    { value: 'hp-procurve', label: 'HP ProCurve', vendor: 'HP', layer: 'L2' },
    { value: 'hp-1920', label: 'HP 1920', vendor: 'HP', layer: 'L2' },
  ],
  server: [
    { value: 'generic', label: 'Serveur générique', vendor: 'Generic', layer: 'L3' },
    { value: 'linux', label: 'Serveur Linux', vendor: 'Generic', layer: 'L3' },
    { value: 'windows', label: 'Serveur Windows', vendor: 'Microsoft', layer: 'L3' },
  ],
  firewall: [
    { value: 'generic', label: 'Pare-feu générique', vendor: 'Generic', layer: 'L3' },
    { value: 'cisco-asa', label: 'Cisco ASA', vendor: 'Cisco', layer: 'L3' },
    { value: 'pfsense', label: 'pfSense', vendor: 'Netgate', layer: 'L3' },
    { value: 'fortinet', label: 'FortiGate', vendor: 'Fortinet', layer: 'L3' },
    { value: 'paloalto', label: 'Palo Alto', vendor: 'Palo Alto', layer: 'L3' },
  ],
  ap: [
    { value: 'generic', label: 'AP générique', vendor: 'Generic', layer: 'L2' },
    { value: 'cisco-wap', label: 'Cisco WAP', vendor: 'Cisco', layer: 'L2' },
    { value: 'unifi', label: 'UniFi', vendor: 'Ubiquiti', layer: 'L2' },
    { value: 'aruba', label: 'Aruba AP', vendor: 'Aruba', layer: 'L2' },
    { value: 'ruckus', label: 'Ruckus', vendor: 'Ruckus', layer: 'L2' },
  ],
  cloud: [
    { value: 'generic', label: 'Cloud / Internet', vendor: 'Generic', layer: 'L3' },
    { value: 'wan', label: 'WAN (réseau étendu)', vendor: 'Generic', layer: 'L3' },
    { value: 'isp', label: 'FAI / ISP', vendor: 'Generic', layer: 'L3' },
    { value: 'datacenter', label: 'Datacenter', vendor: 'Generic', layer: 'L3' },
  ],
  modem: [
    { value: 'generic', label: 'Modem générique', vendor: 'Generic', layer: 'L2' },
    { value: 'dsl', label: 'Modem DSL', vendor: 'Generic', layer: 'L2' },
    { value: 'cable', label: 'Modem câble', vendor: 'Generic', layer: 'L2' },
  ],
  hub: [
    { value: 'generic', label: 'Hub générique', vendor: 'Generic', layer: 'L1' },
  ],
  bridge: [
    { value: 'generic', label: 'Pont générique', vendor: 'Generic', layer: 'L2' },
  ],
  backbone: [
    { value: 'generic', label: 'Backbone générique', vendor: 'Generic', layer: 'L3' },
    { value: 'cisco-core', label: 'Cisco Core', vendor: 'Cisco', layer: 'L3' },
  ],
  phone: [
    { value: 'generic', label: 'IP Phone générique', vendor: 'Generic', layer: 'L3' },
    { value: 'cisco-ip', label: 'Cisco IP Phone', vendor: 'Cisco', layer: 'L3' },
  ],
  printer: [
    { value: 'generic', label: 'Imprimante réseau', vendor: 'Generic', layer: 'L3' },
  ],
  tablet: [
    { value: 'generic', label: 'Tablette', vendor: 'Generic', layer: 'L3' },
  ],
  camera: [
    { value: 'generic', label: 'Caméra IP', vendor: 'Generic', layer: 'L3' },
  ],
};

const SERVER_TYPES = [
  { value: 'web', label: 'Web (HTTP)' },
  { value: 'dns', label: 'DNS' },
  { value: 'mail', label: 'Mail' },
  { value: 'file', label: 'Fichier' },
  { value: 'api', label: 'API' },
  { value: 'custom', label: 'Autre' },
];

const SWITCH_TYPES = [
  { value: 'layer2', label: 'Couche 2 (L2) — commutateur' },
  { value: 'layer3', label: 'Couche 3 (L3) — commutateur multi-couches' },
];

/** Niveau du routeur (L2 ou L3) — affiché et utilisé pour la couche logique */
const ROUTER_LAYERS = [
  { value: 'L2', label: 'Niveau 2 (L2)' },
  { value: 'L3', label: 'Niveau 3 (L3) — routage IP' },
];

const PRINTER_TYPES = [
  { value: 'network', label: 'Réseau (IP)' },
  { value: 'laser', label: 'Laser' },
  { value: 'inkjet', label: 'Jet d\'encre' },
  { value: 'multifunction', label: 'Multifonction' },
];

const MODEM_TYPES = [
  { value: 'dsl', label: 'DSL' },
  { value: 'cable', label: 'Câble' },
  { value: 'fiber', label: 'Fibre (FTTH)' },
];

const CLOUD_ROLES = [
  { value: 'wan', label: 'WAN / Réseau étendu' },
  { value: 'internet', label: 'Internet' },
  { value: 'datacenter', label: 'Datacenter' },
];

/** Types de câbles par catégorie (cuivre, fibre, console, sans fil) */
const LINK_CATEGORIES = [
  { id: 'copper', label: 'Cuivre' },
  { id: 'fiber', label: 'Fibre' },
  { id: 'console', label: 'Console' },
  { id: 'wireless', label: 'Sans fil' },
];
const LINK_TYPES = [
  { id: 'ethernet-straight', label: 'Ethernet droit (PC–Switch)', short: 'Droit', stroke: '#6b7280', dash: '', category: 'copper' },
  { id: 'ethernet-crossover', label: 'Ethernet croisé (PC–PC, Switch–Switch)', short: 'Croisé', stroke: '#dc2626', dash: '', category: 'copper' },
  { id: 'copper-rollover', label: 'Rollover (console)', short: 'Rollover', stroke: '#ca8a04', dash: '6,3', category: 'copper' },
  { id: 'fiber-single', label: 'Fibre monomode', short: 'Fibre S', stroke: '#2563eb', dash: '1,2', category: 'fiber' },
  { id: 'fiber-multi', label: 'Fibre multimode', short: 'Fibre M', stroke: '#7c3aed', dash: '2,3', category: 'fiber' },
  { id: 'fiber', label: 'Fibre optique (générique)', short: 'Fibre', stroke: '#2563eb', dash: '1,2', category: 'fiber' },
  { id: 'console', label: 'Console (RJ-45)', short: 'Console', stroke: '#16a34a', dash: '4,4', category: 'console' },
  { id: 'serial-dte', label: 'Série DTE-DCE', short: 'Série', stroke: '#0d9488', dash: '3,2', category: 'console' },
  { id: 'wireless-24', label: 'WiFi 2,4 GHz', short: 'WiFi', stroke: '#e11d48', dash: '2,2', category: 'wireless' },
  { id: 'wireless-5', label: 'WiFi 5 GHz', short: 'WiFi 5', stroke: '#be185d', dash: '2,2', category: 'wireless' },
];

function getNodeColor(type) {
  return NODE_TYPES.find((t) => t.type === type)?.color || '#9aa0a6';
}

/** Formes SVG par type d'appareil (vue du dessus / schéma réseau) */
function renderNodeShape(n, def, color, sel, conn) {
  const w = def.w || 56;
  const h = def.h || 36;
  const stroke = sel || conn ? '#fff' : 'transparent';
  const sw = sel ? 3.5 : 2;
  const r = 4;
  const label = n?.label || n?.id || '';
  const layer = getNodeLayer(n);
  const selHalo = sel ? (
    <rect x={-4} y={-4} width={w + 8} height={h + 8} rx={r + 2} fill="none" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 4" opacity={0.95} />
  ) : null;

  switch (def.type) {
    case 'pc':
      return (
        <g>
          {selHalo}
          <rect x={2} y={2} width={w - 4} height={h - 10} rx={r} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <rect x={w / 2 - 6} y={h - 10} width={12} height={8} rx={1} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <text x={w / 2} y={h / 2 - 2} textAnchor="middle" fill="#fff" fontSize="9">{escapeHtml(label)}</text>
          {layer && <text x={w - 4} y={10} textAnchor="end" fill="rgba(255,255,255,0.85)" fontSize="7" fontWeight="600">{layer}</text>}
        </g>
      );
    case 'router':
      return (
        <g>
          {selHalo}
          <rect x={0} y={6} width={w} height={h - 12} rx={r} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <rect x={w / 2 - 8} y={0} width={6} height={8} rx={1} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <rect x={w / 2 + 2} y={0} width={6} height={8} rx={1} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <text x={w / 2} y={h / 2 + 4} textAnchor="middle" fill="#fff" fontSize="9">{escapeHtml(label)}</text>
          {layer && <text x={w - 4} y={14} textAnchor="end" fill="rgba(255,255,255,0.85)" fontSize="7" fontWeight="600">{layer}</text>}
        </g>
      );
    case 'switch':
      return (
        <g>
          {selHalo}
          <rect x={0} y={0} width={w} height={h} rx={r} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          {[4, 12, 20, 28, 36, 44].slice(0, Math.min(6, Math.floor(w / 8))).map((y0, i) => (
            <line key={i} x1={8} y1={y0} x2={w - 8} y2={y0} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          ))}
          <text x={w / 2} y={h / 2 + 4} textAnchor="middle" fill="#fff" fontSize="9">{escapeHtml(label)}</text>
          {layer && <text x={w - 4} y={12} textAnchor="end" fill="rgba(255,255,255,0.85)" fontSize="7" fontWeight="600">{layer}</text>}
        </g>
      );
    case 'server':
      return (
        <g>
          {selHalo}
          <rect x={4} y={0} width={w - 8} height={h} rx={2} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <rect x={8} y={4} width={6} height={4} rx={0} fill="rgba(255,255,255,0.3)" />
          <text x={w / 2} y={h / 2 + 4} textAnchor="middle" fill="#fff" fontSize="9">{escapeHtml(label)}</text>
          {layer && <text x={w - 8} y={10} textAnchor="end" fill="rgba(255,255,255,0.85)" fontSize="7" fontWeight="600">{layer}</text>}
        </g>
      );
    case 'firewall':
      return (
        <g>
          {selHalo}
          <polygon points={`${w/2},2 ${w-2},${h/2} ${w/2},${h-2} 2,${h/2}`} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <text x={w / 2} y={h / 2 + 4} textAnchor="middle" fill="#fff" fontSize="8">{escapeHtml(label)}</text>
          {layer && <text x={w - 4} y={12} textAnchor="end" fill="rgba(255,255,255,0.85)" fontSize="7" fontWeight="600">{layer}</text>}
        </g>
      );
    case 'ap':
      return (
        <g>
          {selHalo}
          <circle cx={w / 2} cy={h / 2} r={Math.min(w, h) / 2 - 2} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <path d={`M ${w/2} ${h/2-6} Q ${w/2+8} ${h/2} ${w/2} ${h/2+6} Q ${w/2-8} ${h/2} ${w/2} ${h/2-6}`} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
          <text x={w / 2} y={h / 2 + 4} textAnchor="middle" fill="#fff" fontSize="8">{escapeHtml(label)}</text>
        </g>
      );
    case 'cloud':
      return (
        <g>
          {selHalo}
          <ellipse cx={w/2} cy={h/2-2} rx={w/2-4} ry={h/3} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <ellipse cx={w/2-12} cy={h/2+2} rx={12} ry={h/4} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <ellipse cx={w/2+10} cy={h/2+2} rx={14} ry={h/4} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <text x={w / 2} y={h / 2 + 4} textAnchor="middle" fill="#fff" fontSize="8">{escapeHtml(label)}</text>
        </g>
      );
    case 'phone':
      return (
        <g>
          {selHalo}
          <rect x={4} y={2} width={w - 8} height={h - 4} rx={r} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <circle cx={w / 2} cy={h - 8} r={2} fill="rgba(255,255,255,0.5)" />
          <text x={w / 2} y={h / 2} textAnchor="middle" fill="#fff" fontSize="8">{escapeHtml(label)}</text>
        </g>
      );
    case 'printer':
      return (
        <g>
          {selHalo}
          <rect x={2} y={6} width={w - 4} height={h - 10} rx={2} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <rect x={6} y={2} width={w - 12} height={4} rx={0} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <text x={w / 2} y={h / 2 + 2} textAnchor="middle" fill="#fff" fontSize="8">{escapeHtml(label)}</text>
        </g>
      );
    case 'tablet':
      return (
        <g>
          {selHalo}
          <rect x={2} y={2} width={w - 4} height={h - 4} rx={r} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <text x={w / 2} y={h / 2 + 2} textAnchor="middle" fill="#fff" fontSize="8">{escapeHtml(label)}</text>
        </g>
      );
    case 'camera':
      return (
        <g>
          {selHalo}
          <rect x={4} y={4} width={w - 8} height={h - 8} rx={r} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <circle cx={w / 2} cy={h / 2 - 2} r={4} fill="rgba(0,0,0,0.3)" />
          <text x={w / 2} y={h - 6} textAnchor="middle" fill="#fff" fontSize="7">{escapeHtml(label)}</text>
        </g>
      );
    default:
      return (
        <g>
          {selHalo}
          <rect width={w} height={h} rx={r} fill={color} stroke={stroke} strokeWidth={sw} opacity={0.9} />
          <text x={w / 2} y={h / 2 + 4} textAnchor="middle" fill="#fff" fontSize="10">{escapeHtml(label)}</text>
          {layer && <text x={w - 4} y={12} textAnchor="end" fill="rgba(255,255,255,0.85)" fontSize="8" fontWeight="600">{layer}</text>}
        </g>
      );
  }
}

function defaultNodeConfig(type) {
  const base = { ip: '', gateway: '', subnetMask: '255.255.255.0' };
  const models = DEVICE_MODELS[type];
  const model = models && models[0] ? models[0].value : 'generic';
  if (type === 'server') return { ...base, serverType: 'web', deviceModel: 'generic', dnsServer: '' };
  if (type === 'switch') return { ...base, switchType: 'layer2', deviceModel: 'generic-l2' };
  if (type === 'router') return { ...base, deviceModel: 'generic', routerLayer: 'L3', routerWifi: false };
  if (type === 'firewall') return { ...base, deviceModel: 'generic' };
  if (type === 'ap') return { ...base, deviceModel: 'generic', ssid: '' };
  if (type === 'cloud' || type === 'backbone') return { ...base, deviceModel: 'generic', cloudRole: 'wan' };
  if (type === 'hub' || type === 'bridge') return { ...base, deviceModel: 'generic', hubPorts: 8 };
  if (type === 'modem') return { ...base, deviceModel: model, modemType: 'dsl' };
  if (type === 'phone') return { ...base, deviceModel: model, sipServer: '' };
  if (type === 'printer') return { ...base, deviceModel: model, printerType: 'network' };
  if (type === 'tablet' || type === 'camera') return { ...base, deviceModel: model };
  return { ...base, deviceModel: model };
}

/** Applique les valeurs par défaut manquantes sur un nœud (migration des anciennes cartes). */
function migrateNode(node) {
  if (!node || !node.type) return node;
  const def = defaultNodeConfig(node.type);
  const out = { ...node };
  for (const k of Object.keys(def)) {
    if (out[k] === undefined || out[k] === null) out[k] = def[k];
  }
  return out;
}

/** Retourne le libellé de couche pour un nœud (L1/L2/L3) */
function getNodeLayer(node) {
  if (!node) return '';
  if (node.type === 'router' && (node.routerLayer === 'L2' || node.routerLayer === 'L3')) return node.routerLayer;
  if (node.type === 'switch' && node.switchType === 'layer3') return 'L3';
  if (node.type === 'switch') return 'L2';
  const def = NODE_TYPES.find((t) => t.type === node.type);
  return def?.layer || '';
}

/** Commandes type par type d'appareil (aide pour le terminal réel — Cisco, Linux, etc.) */
function getDeviceCommandsHelp(type) {
  const byType = {
    router: 'show ip route, show running-config, show interfaces, ping <ip>, enable, configure terminal, interface fa0/0, ip address …, no shutdown, exit',
    switch: 'show mac address-table, show vlan brief, show running-config, show interfaces status, show interfaces trunk, vlan 10, interface range fa0/1-4, switchport mode access, switchport access vlan 10, exit',
    server: 'ip a, ip route, ping <ip>, curl …, nslookup <host>, systemctl status …, ss -tlnp',
    firewall: 'show access-list, show config, show interface, ping <ip>',
    ap: 'show dot11 associations, show running-config, show interface dot11Radio0',
    cloud: 'show ip route, show interfaces, ping (équipement cœur réseau)',
    backbone: 'show ip route, show running-config, show interfaces',
    phone: 'ipconfig, ping <ip>, show sip',
    printer: 'ipconfig, ping <ip>',
    modem: 'show interfaces (équipement L1/L2), ping <ip>',
    hub: 'show interfaces (L1), ping <ip>',
    bridge: 'show mac address-table, show spanning-tree, show interfaces',
    pc: 'ip a, ip route, ping <ip>, curl …, nslookup <host>',
  };
  return byType[type] || 'ip a, ping <ip>, curl …, nslookup <host>';
}

/** Anciennes commandes simulées — conservées pour référence uniquement (non utilisées). */
function _runSimulatedCommand(node, nodes, edges, cmdLine) {
  const line = (cmdLine || '').trim().toLowerCase();
  const label = node?.label || 'Device';
  const ip = node?.ip || '(non configuré)';
  const gateway = node?.gateway || '';
  const mask = node?.subnetMask || '255.255.255.0';
  if (!line) return '';

  const args = line.split(/\s+/);
  const cmd = args[0];

  if (cmd === 'help' || cmd === '?') {
    if (node?.type === 'router' || node?.type === 'backbone') {
      return 'Commandes: show ip route, show running-config, show interfaces, ping <ip>, enable, configure terminal, exit';
    }
    if (node?.type === 'switch') {
      return 'Commandes: show mac address-table, show running-config, show interfaces, ping <ip>, enable, exit';
    }
    if (node?.type === 'server') {
      return 'Commandes: ipconfig, ping <ip>, nslookup <host>, dig <host>, help, exit';
    }
    if (node?.type === 'firewall') {
      return 'Commandes: show access-list, show config, show interfaces, ping <ip>, exit';
    }
    if (node?.type === 'ap') {
      return 'Commandes: show dot11 associations, show running-config, ping <ip>, exit';
    }
    if (node?.type === 'cloud') {
      return 'Commandes: show ip route, show interfaces, ping <ip> (équipement cœur réseau), exit';
    }
    if (node?.type === 'phone') {
      return 'Commandes: ipconfig, ping <ip>, show sip (téléphone IP), exit';
    }
    if (node?.type === 'printer') {
      return 'Commandes: ipconfig, ping <ip> (imprimante réseau), exit';
    }
    if (node?.type === 'modem' || node?.type === 'hub' || node?.type === 'bridge') {
      return 'Commandes: show interfaces (équipement L1/L2), ping <ip>, exit';
    }
    if (node?.type === 'tablet' || node?.type === 'camera') {
      return 'Commandes: ipconfig, ping <ip>, nslookup <host>, exit';
    }
    return 'Commandes: ipconfig, ping <ip>, nslookup <host>, help, exit';
  }
  if ((cmd === 'nslookup' || cmd === 'dig') && args[1]) {
    const host = args[1];
    const dnsNode = nodes.find((n) => n.type === 'server' && (n.serverType === 'dns' || (n.label && n.label.toLowerCase().includes('dns'))));
    const target = nodes.find((n) => n.ip === host || (n.label && n.label.toLowerCase().includes(host.replace(/\./g, ''))));
    if (target) return `Serveur:  ${target.ip || '(non configuré)'}\nAddress:  ${target.ip || 'N/A'}\nNom: ${target.label || host}`;
    if (dnsNode && dnsNode.ip) return `Serveur:  ${dnsNode.ip}\nAddress:  ${dnsNode.ip}\nNom: ${host}`;
    return `*** Le serveur ${host} est introuvable : Non-existent domain`;
  }
  if (cmd === 'show' && args[1] === 'ip' && args[2] === 'route') {
    if (gateway) return `Gateway of last resort is ${gateway}\nC     ${ip} is directly connected, FastEthernet0/0`;
    return `C     ${ip} is directly connected, FastEthernet0/0`;
  }
  if (cmd === 'show' && (args[1] === 'interfaces' || args[1] === 'int')) {
    if (['router', 'switch', 'firewall', 'backbone', 'cloud', 'modem', 'hub', 'bridge'].includes(node?.type)) {
      return `FastEthernet0/0 is up, line protocol is up\n  Hardware is FastEthernet, address is 0000.0c00.0001\n  Internet address is ${ip}/${mask.replace(/255\.255\.255\.0/, '24')}\n  MTU 1500 bytes`;
    }
    return `Commande non supportée sur ce type d'appareil.`;
  }
  if ((node?.type === 'phone') && (cmd === 'show' && args[1] === 'sip')) {
    return `SIP Server: ${node?.sipServer || '(non configuré)'}\nRegister: ${node?.sipServer ? 'OK' : '—'}`;
  }
  if (cmd === 'show' && args[1] === 'mac' && args[2] === 'address-table') {
    if (node?.type === 'switch') {
      const linked = edges.filter((e) => e.from === node.id || e.to === node.id);
      const otherNodes = linked.map((e) => nodes.find((n) => n.id === (e.from === node.id ? e.to : e.from))).filter(Boolean);
      const lines = otherNodes.slice(0, 5).map((n, i) => `  ${i + 1}    0000.0c00.000${i + 1}    DYNAMIC     Fa0/${i + 1}`);
      return lines.length ? lines.join('\n') : 'Table d\'adresses MAC vide.';
    }
    return 'Commande réservée aux commutateurs.';
  }
  if (cmd === 'show' && (args[1] === 'running-config' || args[1] === 'run')) {
    return [
      `hostname ${label.replace(/\s/g, '')}`,
      `interface FastEthernet0/0`,
      ` ip address ${ip} ${mask}`,
      gateway ? ` ip default-gateway ${gateway}` : '',
    ].filter(Boolean).join('\n');
  }
  if (cmd === 'ipconfig' || cmd === 'ip' || (cmd === 'show' && args[1] === 'ip')) {
    return [
      `Interface Ethernet0`,
      `  Adresse IPv4. . . . . . : ${ip}`,
      `  Masque sous-réseau . . : ${mask}`,
      gateway ? `  Passerelle par défaut . : ${gateway}` : '',
    ].filter(Boolean).join('\n');
  }
  if (cmd === 'ping' && args[1]) {
    const target = args[1];
    const other = nodes.find((n) => n.ip === target || n.label === target);
    if (other) return `Réponse de ${target}: octets=32 temps<1ms TTL=64`;
    return `Ping statistiques pour ${target}: Paquets: envoyés=4, reçus=0, perdus=4 (100% perte).`;
  }
  if ((node?.type === 'firewall') && (cmd === 'show' && (args[1] === 'access-list' || args[1] === 'acl'))) {
    return 'Standard IP access list SIM-ACL\n  10 permit any';
  }
  if ((node?.type === 'firewall') && (cmd === 'show' && args[1] === 'config')) {
    return `hostname ${label.replace(/\s/g, '')}\ninterface inside\n ip address ${ip} ${mask}\ninterface outside\n ip address ${gateway || 'dhcp'}`;
  }
  if (cmd === 'enable') return '';
  if (cmd === 'exit') return '';
  return `Commande inconnue: ${args[0]}. Tapez "help" pour la liste.`;
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
  const buildings = currentSim?.buildings || [];
  const [currentBuildingId, setCurrentBuildingId] = useState(null);
  const [linkMode, setLinkMode] = useState(false);
  const [connectLinkType, setConnectLinkType] = useState('ethernet-straight');
  const [connectFrom, setConnectFrom] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [dragOff, setDragOff] = useState({ x: 0, y: 0 });
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulationPaused, setSimulationPaused] = useState(false);
  const [placeMode, setPlaceMode] = useState(null);
  const [placeModel, setPlaceModel] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [panelWidth, setPanelWidth] = useState(320);
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(520);
  const GRID_SIZE = 20;
  const panStartRef = useRef(null);
  const nodeDragMovedRef = useRef(false);
  const zoomPanRef = useRef({ zoom: 1, pan: { x: 0, y: 0 } });
  useEffect(() => { zoomPanRef.current = { zoom, pan }; }, [zoom, pan]);
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
    let cur = data.currentId || (sims.length ? sims[0].id : null);
    if (sims.length === 0) {
      const newId = 'sim' + Date.now();
      const newSims = [{ id: newId, name: 'Carte 1', nodes: [], edges: [], buildings: [], createdAt: new Date().toISOString() }];
      setSimulations(newSims);
      setCurrentSimId(newId);
      storage?.setNetworkSimulations?.(effectiveLabId, { simulations: newSims, currentId: newId });
      return;
    }
    setSimulations(sims);
    setCurrentSimId(cur);
  }, [effectiveLabId, storage]);

  useEffect(() => {
    const sim = (storage?.getNetworkSimulations?.(effectiveLabId) || {}).simulations?.find((s) => s.id === currentSimId);
    if (sim) {
      const rawNodes = sim.nodes || [];
      const migratedNodes = rawNodes.map((n) => migrateNode(n));
      setNodes(migratedNodes);
      setEdges(sim.edges || []);
    } else {
      setNodes([]);
      setEdges([]);
    }
    setSelectedId(null);
    setConnectFrom(null);
    setLinkMode(false);
    initialLoad.current = true;
    setSelectedEdgeId(null);
  }, [currentSimId, effectiveLabId]);


  const panelResizeStartRef = useRef({ x: 0 });
  const handlePanelResizeStart = (e) => {
    e.preventDefault();
    panelResizeStartRef.current = { x: e.clientX };
    const onMove = (ev) => {
      setPanelWidth((prev) => {
        const delta = panelResizeStartRef.current.x - ev.clientX;
        panelResizeStartRef.current = { x: ev.clientX };
        return Math.min(560, Math.max(220, prev + delta));
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const persistCurrentSim = (nextNodes, nextEdges, nextBuildings) => {
    const n = nextNodes ?? nodes;
    const e = nextEdges ?? edges;
    const b = nextBuildings ?? buildings;
    if (!currentSimId) return;
    const updated = simulations.map((s) =>
      s.id === currentSimId ? { ...s, nodes: n, edges: e, buildings: b, updatedAt: new Date().toISOString() } : s
    );
    setSimulations(updated);
    storage?.setNetworkSimulations?.(effectiveLabId, { simulations: updated, currentId: currentSimId });
  };

  /** Export topologie au format backend lab (EVE-NG-like) : chaque nœud a un backend (docker/dynamips/iol), les liens décrivent les connexions. Utilise les images mises de côté (EVE-NG) si disponibles. */
  const getTopologyExportForBackend = () => {
    const savedImages = getDefaultImagesFromSaved();
    const labNodes = nodes.map((n) => {
      const backend = NODE_TYPE_TO_BACKEND[n.type] || 'docker';
      const image = savedImages[backend] || DEFAULT_BACKEND_IMAGE[n.type] || 'generic';
      return {
        id: n.id,
        label: n.label || n.id,
        type: n.type,
        backend,
        image,
        deviceModel: n.deviceModel,
        config: { ip: n.ip, gateway: n.gateway, subnetMask: n.subnetMask },
      };
    });
    const labLinks = edges.map((e, i) => ({
      id: e.id || 'link_' + i,
      from: e.from,
      to: e.to,
      fromPort: e.fromPort,
      toPort: e.toPort,
      linkType: e.linkType,
    }));
    return { version: '1.0', format: 'eve-ng-lab', nodes: labNodes, links: labLinks, labId: effectiveLabId, simId: currentSimId };
  };

  const addBuilding = () => {
    const name = prompt('Nom du bâtiment ou zone ?', 'Bâtiment ' + (buildings.length + 1));
    if (name == null || !name.trim()) return;
    const id = 'b' + Date.now();
    const next = [...buildings, { id, name: name.trim(), floors: [{ id: 'f' + Date.now(), name: 'RDC' }] }];
    persistCurrentSim(nodes, edges, next);
  };
  const getBuildingDeviceCount = (buildingId) => nodes.filter((n) => n.buildingId === buildingId).length;
  const renameBuilding = (id) => {
    const b = buildings.find((x) => x.id === id);
    const name = prompt('Nouveau nom ?', b?.name || '');
    if (name == null) return;
    const next = buildings.map((x) => (x.id === id ? { ...x, name: name.trim() || x.name } : x));
    persistCurrentSim(nodes, edges, next);
  };
  const deleteBuilding = (id) => {
    if (!confirm('Supprimer ce bâtiment ? Les appareils restent sur la carte.')) return;
    const nextBuildings = buildings.filter((x) => x.id !== id);
    const nextNodes = nodes.map((x) => (x.buildingId === id ? { ...x, buildingId: undefined, buildingFloorId: undefined } : x));
    setNodes(nextNodes);
    persistCurrentSim(nextNodes, edges, nextBuildings);
    if (currentBuildingId === id) setCurrentBuildingId(null);
  };

  const addBuildingFloor = (buildingId) => {
    const b = buildings.find((x) => x.id === buildingId);
    const name = prompt('Nom de l\'étage ou salle ?', 'Étage ' + ((b?.floors?.length || 0) + 1));
    if (name == null || !name.trim()) return;
    const id = 'f' + Date.now();
    const next = buildings.map((x) => (x.id === buildingId ? { ...x, floors: [...(x.floors || []), { id, name: name.trim() }] } : x));
    persistCurrentSim(nodes, edges, next);
  };

  const addSimulation = () => {
    const id = 'sim' + Date.now();
    const name = 'Carte ' + (simulations.length + 1);
    const next = [...simulations, { id, name, nodes: [], edges: [], buildings: [], createdAt: new Date().toISOString() }];
    setSimulations(next);
    setCurrentSimId(id);
    setNodes([]);
    setEdges([]);
    setCurrentBuildingId(null);
    storage?.setNetworkSimulations?.(effectiveLabId, { simulations: next, currentId: id });
  };

  const duplicateSimulation = () => {
    if (!currentSim) return;
    const id = 'sim' + Date.now();
    const name = (currentSim.name || 'Carte') + ' (copie)';
    const oldNodes = currentSim.nodes || [];
    const oldBuildings = currentSim.buildings || [];
    const buildingIdMap = {};
    const newBuildings = oldBuildings.map((b, i) => {
      const newId = 'b' + Date.now() + '_' + i;
      buildingIdMap[b.id] = newId;
      const floorIdMap = {};
      const newFloors = (b.floors || []).map((f, j) => {
        const fid = 'f' + Date.now() + '_' + i + '_' + j;
        floorIdMap[f.id] = fid;
        return { id: fid, name: f.name };
      });
      return { id: newId, name: b.name, floors: newFloors };
    });
    const idMap = {};
    const newNodes = oldNodes.map((n, i) => {
      const newId = 'n' + Date.now() + '_' + i;
      idMap[n.id] = newId;
      const bid = n.buildingId ? buildingIdMap[n.buildingId] : undefined;
      const b = bid ? newBuildings.find((x) => x.id === bid) : null;
      const floors = b?.floors || [];
      const oldB = n.buildingId ? oldBuildings.find((x) => x.id === n.buildingId) : null;
      const oldFloorId = n.buildingFloorId;
      const sameFloorIndex = oldB?.floors?.findIndex((f) => f.id === oldFloorId);
      const newFloorId = bid && floors[sameFloorIndex] ? floors[sameFloorIndex].id : (floors[0]?.id || undefined);
      return { ...n, id: newId, buildingId: bid, buildingFloorId: newFloorId };
    });
    const newEdges = (currentSim.edges || []).map((e, i) => ({
      ...e,
      id: 'e' + Date.now() + '_' + i,
      from: idMap[e.from] || e.from,
      to: idMap[e.to] || e.to,
    }));
    const newSim = { id, name, nodes: newNodes, edges: newEdges, buildings: newBuildings, createdAt: new Date().toISOString() };
    const next = [...simulations, newSim];
    setSimulations(next);
    setCurrentSimId(id);
    setNodes(newNodes);
    setEdges(newEdges);
    setCurrentBuildingId(null);
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

  /** Ajoute un nœud à la position (x,y) dans le repère SVG (modèle choisi avant placement, type Packet Tracer). */
  const addNodeAt = (type, svgX, svgY, deviceModel) => {
    const def = NODE_TYPES.find((t) => t.type === type) || NODE_TYPES[0];
    const w = def?.w || 56;
    const h = def?.h || 36;
    const x = Math.max(0, Math.min(canvasWidth - w, svgX - w / 2));
    const y = Math.max(0, Math.min(canvasHeight - h, svgY - h / 2));
    const id = 'n' + Date.now();
    const count = nodes.filter((n) => n.type === type).length + 1;
    const config = defaultNodeConfig(type);
    const model = deviceModel || placeModel || config.deviceModel;
    setNodes((n) => [...n, { id, type, x, y, label: def.label + ' ' + count, buildingId: currentBuildingId || undefined, ...config, deviceModel: model }]);
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

  /** Changer le type d'un appareil déjà placé (comme Packet Tracer). */
  const changeNodeType = (id, newType) => {
    const def = NODE_TYPES.find((t) => t.type === newType);
    const config = defaultNodeConfig(newType);
    setNodes((n) =>
      n.map((x) =>
        x.id === id
          ? { ...x, type: newType, ...config, id: x.id, x: x.x, y: x.y, label: x.label || (def?.label + ' 1') }
          : x
      )
    );
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

  const deleteSelectedEdge = () => {
    if (!selectedEdgeId) return;
    const nextEdges = edges.filter((e) => e.id !== selectedEdgeId);
    setEdges(nextEdges);
    setSelectedEdgeId(null);
    persistCurrentSim(nodes, nextEdges);
  };

  const [isPanning, setIsPanning] = useState(false);

  const handleSvgClick = (e) => {
    const isNode = e.target.closest && e.target.closest('[data-node-id]');
    const insideSvg = svgRef.current && svgRef.current.contains(e.target);
    if (placeMode && !isNode && insideSvg) {
      if (nodeDragMovedRef.current) {
        nodeDragMovedRef.current = false;
        return;
      }
      const pt = clientToSvg(e.clientX, e.clientY);
      addNodeAt(placeMode, pt.x, pt.y, placeModel);
      return;
    }
    if (e.target !== svgRef.current && e.target.getAttribute('data-node-id')) return;
    if (linkMode) setConnectFrom(null);
    else setSelectedId(null);
    setSelectedEdgeId(null);
  };

  const handleCanvasMouseDown = (e) => {
    if (e.target.closest && e.target.closest('[data-node-id]')) return;
    if (e.target === svgRef.current || e.target.tagName === 'svg') {
      e.preventDefault();
      panStartRef.current = { clientX: e.clientX, clientY: e.clientY, panX: pan.x, panY: pan.y };
      setIsPanning(true);
    }
  };

  useEffect(() => {
    if (!isPanning) return;
    const onMove = (e) => {
      const wrap = svgWrapRef.current;
      if (!wrap || !panStartRef.current) return;
      const rect = wrap.getBoundingClientRect();
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      const w = canvasWidth / zoom;
      const h = canvasHeight / zoom;
      const newPanX = panStartRef.current.panX - (dx / rect.width) * w;
      const newPanY = panStartRef.current.panY - (dy / rect.height) * h;
      setPan({ x: newPanX, y: newPanY });
      panStartRef.current = { clientX: e.clientX, clientY: e.clientY, panX: newPanX, panY: newPanY };
    };
    const onUp = () => setIsPanning(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isPanning, zoom]);

  useEffect(() => {
    const wrap = svgWrapRef.current;
    if (!wrap) return;
    const onWheel = (e) => {
      e.preventDefault();
      const { zoom: z, pan: p } = zoomPanRef.current;
      const rect = wrap.getBoundingClientRect();
      const factor = e.deltaY > 0 ? 1 / 1.15 : 1.15;
      const newZoom = Math.min(4, Math.max(0.2, z * factor));
      const mx = p.x + (e.clientX - rect.left) / rect.width * (800 / z);
      const my = p.y + (e.clientY - rect.top) / rect.height * (520 / z);
      const newPanX = mx - (e.clientX - rect.left) / rect.width * (800 / newZoom);
      const newPanY = my - (e.clientY - rect.top) / rect.height * (520 / newZoom);
      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    };
    wrap.addEventListener('wheel', onWheel, { passive: false });
    return () => wrap.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setPlaceMode(null);
        setLinkMode(false);
        setConnectFrom(null);
        setSelectedId(null);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && !e.target.closest('input') && !e.target.closest('textarea')) {
          e.preventDefault();
          deleteSelected();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  const cancelLinkMode = () => {
    setLinkMode(false);
    setConnectFrom(null);
  };

  /** Type de câble par défaut selon les deux appareils (PC–Switch → droit, PC–PC → croisé, AP → WiFi). */
  const getDefaultLinkType = (fromNode, toNode) => {
    const a = nodes.find((n) => n.id === fromNode?.id || n.id === fromNode);
    const b = nodes.find((n) => n.id === toNode?.id || n.id === toNode);
    const tA = a?.type || '';
    const tB = b?.type || '';
    if (tA === 'ap' || tB === 'ap') return 'wireless-24';
    if ((tA === 'pc' && tB === 'pc') || (tA === 'switch' && tB === 'switch')) return 'ethernet-crossover';
    return 'ethernet-straight';
  };

  const handleNodeClick = (id, e) => {
    e.stopPropagation();
    if (nodeDragMovedRef.current) {
      nodeDragMovedRef.current = false;
      return;
    }
    if (linkMode && connectFrom !== null) {
      if (connectFrom === id) {
        setConnectFrom(null);
        return;
      }
      const fromNode = nodes.find((n) => n.id === connectFrom);
      const toNode = nodes.find((n) => n.id === id);
      const fromPort = getNextPort(connectFrom);
      const toPort = getNextPort(id);
      const defaultLt = getDefaultLinkType(fromNode, toNode);
      setEdges((ed) => [
        ...ed,
        {
          id: 'e' + Date.now(),
          from: connectFrom,
          to: id,
          linkType: connectLinkType || defaultLt,
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
    setSelectedEdgeId(null);
  };

  const svgWrapRef = useRef(null);
  /** Conversion coordonnées écran → SVG via getScreenCTM pour un placement précis (préserveAspectRatio). */
  const clientToSvg = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg || !svg.createSVGPoint) {
      const wrap = svgWrapRef.current;
      if (!wrap) return { x: clientX, y: clientY };
    const rect = wrap.getBoundingClientRect();
    const w = canvasWidth / zoom;
    const h = canvasHeight / zoom;
    let x = pan.x + (clientX - rect.left) / rect.width * w;
      let y = pan.y + (clientY - rect.top) / rect.height * h;
      if (snapToGrid) { x = Math.round(x / GRID_SIZE) * GRID_SIZE; y = Math.round(y / GRID_SIZE) * GRID_SIZE; }
      return { x, y };
    }
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: clientX, y: clientY };
    const svgPt = pt.matrixTransform(ctm.inverse());
    let x = svgPt.x, y = svgPt.y;
    if (snapToGrid) {
      x = Math.round(x / GRID_SIZE) * GRID_SIZE;
      y = Math.round(y / GRID_SIZE) * GRID_SIZE;
    }
    return { x, y };
  };

  const snap = (v) => (snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v);

  const handleNodeMouseDown = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof getSelection === 'function') getSelection().removeAllRanges();
    nodeDragMovedRef.current = false;
    if (placeMode) setPlaceMode(null);
    const n = nodes.find((x) => x.id === id);
    if (!n) return;
    const pt = clientToSvg(e.clientX, e.clientY);
    setDragId(id);
    setDragOff({ x: pt.x - n.x, y: pt.y - n.y });
  };

  const handleMouseMove = (e) => {
    if (!dragId) return;
    e.preventDefault();
    nodeDragMovedRef.current = true;
    const pt = clientToSvg(e.clientX, e.clientY);
    const nx = snap(pt.x - dragOff.x);
    const ny = snap(pt.y - dragOff.y);
    setNodes((n) => n.map((x) => (x.id === dragId ? { ...x, x: nx, y: ny } : x)));
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
    persistCurrentSim([], [], buildings);
  };

  useEffect(() => {
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }
    persistCurrentSim(nodes, edges, buildings);
  }, [nodes, edges]);

  const [packetPosition, setPacketPosition] = useState({ edgeIndex: 0, t: 0 });
  useEffect(() => {
    if (!simulationMode || simulationPaused || edges.length === 0) return;
    const speed = 0.008;
    let raf;
    const tick = () => {
      setPacketPosition((prev) => {
        let nextT = prev.t + speed;
        let idx = prev.edgeIndex;
        if (nextT >= 1) {
          nextT = 0;
          idx = (idx + 1) % edges.length;
        }
        return { edgeIndex: idx, t: nextT };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [simulationMode, simulationPaused, edges.length]);

  const packetCoords = (() => {
    if (!simulationMode || edges.length === 0) return null;
    const ed = edges[packetPosition.edgeIndex];
    if (!ed) return null;
    const a = getNodePos(ed.from);
    const b = getNodePos(ed.to);
    const t = packetPosition.t;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  })();

  return (
    <div id="view-network-sim" class="view">
      <header class="page-header">
        <h2>Simulateur réseau (type Packet Tracer)</h2>
        <p class="room-description">
          Plusieurs cartes réseau par lab : topologie, config IP (PC, routeur, switch, serveur), types de service (Web, DNS, etc.) et de switch (L2/L3). Contexte lab actif ou session personnalisée. Intégré aux scénarios et à la progression.
        </p>
      </header>

      <div class="network-sim-section network-sim-section-context">
        <h3 class="network-sim-section-title">Contexte et carte</h3>
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
        <div class="network-sim-maps" style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap">
          <span class="network-sim-toolbar-label">Carte :</span>
          <select
            class="api-client-select network-sim-select"
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
      </div>

      <div class="network-sim-section network-sim-section-buildings" data-testid="sim-buildings">
        <h3 class="network-sim-section-title">Bâtiments / Zones</h3>
        <div class="network-sim-how-it-works" role="region" aria-label="Comment utiliser les bâtiments">
          <strong>Comment ça marche :</strong>
          <ol class="network-sim-how-steps">
            <li>Créez un bâtiment (ou zone) avec le bouton <em>+ Nouveau bâtiment</em>.</li>
            <li><em>Optionnel :</em> sur chaque carte de bâtiment ci‑dessous, ajoutez des étages avec <em>+ étage</em>.</li>
            <li>Pour assigner un appareil à un bâtiment : sélectionnez l’appareil sur la carte, puis dans le panneau de droite choisissez <em>Bâtiment / Zone</em> et, si besoin, <em>Étage / Salle</em>. Vous pouvez aussi choisir un bâtiment dans la liste « Nouveaux appareils dans » avant d’ajouter un appareil pour qu’il soit assigné automatiquement.</li>
          </ol>
        </div>
        <div class="network-sim-buildings-row">
          <div class="network-sim-buildings-controls">
            <label class="network-sim-label">Nouveaux appareils dans :</label>
            <select
              class="api-client-select network-sim-select"
              value={currentBuildingId || ''}
              onInput={(e) => setCurrentBuildingId(e.target.value || null)}
              title="Les appareils que vous ajoutez sur la carte seront assignés à ce bâtiment"
            >
              <option value="">Carte (aucun bâtiment)</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{escapeHtml(b.name)} ({getBuildingDeviceCount(b.id)} app.)</option>
              ))}
            </select>
            <button type="button" class="btn btn-primary" onClick={addBuilding}>+ Nouveau bâtiment</button>
          </div>
          <div class="network-sim-building-chips">
            {buildings.map((b) => {
              const count = getBuildingDeviceCount(b.id);
              const floors = b.floors || [];
              return (
                <div key={b.id} class="network-sim-building-chip" title={floors.length ? `Étages: ${floors.map((f) => f.name).join(', ')}` : ''}>
                  <span class="network-sim-building-chip-name">{escapeHtml(b.name)}</span>
                  <span class="network-sim-building-chip-meta">{count} app. · {floors.length} étage(s)</span>
                  <div class="network-sim-building-chip-actions">
                    <button type="button" class="btn btn-secondary btn-icon" onClick={() => addBuildingFloor(b.id)} title="Ajouter un étage">+ étage</button>
                    <button type="button" class="btn btn-secondary btn-icon" onClick={() => renameBuilding(b.id)} title="Renommer">✎</button>
                    <button type="button" class="btn btn-secondary btn-icon btn-icon-danger" onClick={() => deleteBuilding(b.id)} title="Supprimer">×</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div class="network-sim-section network-sim-section-toolbar">
        <h3 class="network-sim-section-title">Appareils et liaisons</h3>
        <p class="network-sim-section-desc text-muted" style="font-size:0.85rem; margin:0 0 0.5rem">Pour l’instant : PC, routeur, switch, serveur, <strong>Pare-feu, Point d'accès, Cloud</strong>, modem, hub, bridge, téléphone IP, imprimante, tablette, caméra. Export EVE-NG : PC/routeur/switch/serveur uniquement.</p>
      <div class="network-sim-toolbar" data-testid="sim-toolbar-devices">
        <div class="network-sim-toolbar-row" data-testid="sim-toolbar-device-buttons">
          <span class="network-sim-toolbar-label">Appareils — Catégorie :</span>
        {placeMode && (
          <span class="network-sim-toolbar-hint" style="font-size:0.8rem; color:var(--text-muted)">Clique sur la carte pour placer. Pour modifier ou supprimer un appareil, clique sur l'appareil sur la carte.</span>
        )}
        {NODE_TYPES.map((t) => (
          <button
            key={t.type}
            type="button"
            class={`btn btn-secondary ${placeMode === t.type ? 'active' : ''}`}
            data-testid={t.type === 'firewall' ? 'sim-btn-firewall' : t.type === 'ap' ? 'sim-btn-ap' : t.type === 'cloud' ? 'sim-btn-cloud' : undefined}
            onClick={() => { setPlaceMode(placeMode === t.type ? null : t.type); setPlaceModel(DEVICE_MODELS[t.type]?.[0]?.value ?? null); setLinkMode(false); }}
            style={{ borderColor: t.color }}
            title={`Choisir modèle puis cliquer sur la carte`}
          >
            {t.label}
          </button>
        ))}
        {placeMode && (
          <>
            <span class="network-sim-toolbar-sep">→</span>
            <span class="network-sim-toolbar-label">Modèle :</span>
            {(DEVICE_MODELS[placeMode] || []).map((m, idx) => (
              <button
                key={m.value}
                type="button"
                class={`btn btn-secondary ${placeModel === m.value ? 'active' : ''}`}
                onClick={() => setPlaceModel(m.value)}
                title={m.label}
              >
                {m.label}{idx === 0 ? ' (défaut)' : ''}
              </button>
            ))}
            <span class="network-sim-toolbar-hint">Modèle actuel : {(DEVICE_MODELS[placeMode] || []).find((m) => m.value === placeModel)?.label || placeModel || '—'}. Puis cliquez sur la carte.</span>
            <button type="button" class="btn btn-secondary" onClick={() => { setPlaceMode(null); setPlaceModel(null); }}>Annuler</button>
          </>
        )}
        {selectedId && !linkMode && (
          <button type="button" class="topbar-btn danger" onClick={deleteSelected}>Supprimer le nœud</button>
        )}
        </div>
        <div class="network-sim-toolbar-row">
          <span class="network-sim-toolbar-label" style="font-weight:600">Liaisons — Type de câble :</span>
        <button
          type="button"
          class={`btn ${linkMode ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setPlaceMode(null); setPlaceModel(null); setLinkMode(!linkMode); if (linkMode) cancelLinkMode(); }}
          title="Choisis le type de câble puis clique sur le 1er appareil, puis le 2ème"
        >
          {linkMode ? 'Mode liaison actif' : 'Relier 2 appareils'}
        </button>
        {linkMode && (
          <>
            <span class="network-sim-toolbar-label">Type de câble :</span>
            {LINK_CATEGORIES.map((cat) => (
              <span key={cat.id} style="display:inline-flex;align-items:center;flex-wrap:wrap;gap:0.25rem">
                <span class="network-sim-toolbar-label" style="font-size:0.8rem;color:var(--text-muted)">{cat.label} :</span>
                {LINK_TYPES.filter((lt) => lt.category === cat.id).map((lt) => (
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
              </span>
            ))}
            <span class="network-sim-toolbar-hint">
              {connectFrom ? `2ème appareil : ${(nodes.find((n) => n.id === connectFrom)?.label || connectFrom)} → ?` : 'Clique sur le 1er appareil'}
            </span>
            <button type="button" class="btn btn-secondary" onClick={cancelLinkMode}>Annuler</button>
          </>
        )}
        </div>
        <div class="network-sim-toolbar-row">
          <span class="network-sim-toolbar-label">Simulation :</span>
        {!simulationMode ? (
          <button
            type="button"
            class="btn btn-secondary"
            onClick={() => { setSimulationMode(true); setSimulationPaused(false); }}
            title="Démarrer l’animation d’un paquet le long des liaisons"
          >
            ▶ Démarrer
          </button>
        ) : (
          <>
            <button
              type="button"
              class="btn btn-secondary"
              onClick={() => setSimulationPaused(!simulationPaused)}
              title={simulationPaused ? 'Reprendre' : 'Pause'}
            >
              {simulationPaused ? '▶ Reprendre' : '⏸ Pause'}
            </button>
            <button
              type="button"
              class="topbar-btn danger"
              onClick={() => { setSimulationMode(false); setSimulationPaused(false); }}
              title="Arrêter la simulation"
            >
              ■ Arrêter
            </button>
          </>
        )}
        <button type="button" class="btn btn-secondary" onClick={clearTopology}>Effacer cette carte</button>
        </div>
        <div class="network-sim-toolbar-row">
          <label class="network-sim-toolbar-label" style="display:inline-flex;align-items:center;gap:0.35rem">
          Zone :
          <select
            value={`${canvasWidth}x${canvasHeight}`}
            onInput={(e) => {
              const v = e.target.value;
              if (v === '1200x800') { setCanvasWidth(1200); setCanvasHeight(800); }
              else if (v === '1600x900') { setCanvasWidth(1600); setCanvasHeight(900); }
              else { setCanvasWidth(800); setCanvasHeight(520); }
            }}
            class="api-client-select"
            style={{ width: 'auto', padding: '0.25rem 0.5rem', marginLeft: '0.25rem' }}
            title="Taille de la zone posable"
          >
            <option value="800x520">800×520</option>
            <option value="1200x800">1200×800</option>
            <option value="1600x900">1600×900</option>
          </select>
        </label>
        <label class="network-sim-toolbar-label" style="display:inline-flex;align-items:center;gap:0.35rem;cursor:pointer">
          <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} />
          Aligner à la grille
        </label>
        <span class="network-sim-toolbar-hint" style="font-size:0.8rem">Molette: zoom · Glisser fond: pan · Échap: annuler · Suppr: supprimer</span>
        </div>
      </div>
      </div>

      <div class="network-sim-canvas-and-config">
        <div class="network-sim-canvas-area">
          <div
          class={`network-sim-canvas-wrap ${placeMode ? 'network-sim-place-mode' : ''} ${isPanning ? 'network-sim-panning' : ''} ${dragId ? 'network-sim-dragging' : ''}`}
          ref={svgWrapRef}
          onMouseDownCapture={(e) => {
            e.preventDefault();
            if (typeof getSelection === 'function') getSelection().removeAllRanges();
          }}
          onMouseDown={handleCanvasMouseDown}
          style={{ cursor: isPanning ? 'grabbing' : (placeMode ? 'crosshair' : 'grab') }}
        >
          {nodes.length === 0 && !currentSimId && !placeMode && (
            <p class="section-desc text-muted" style="padding:1rem">Choisis une carte ou crée-en une nouvelle.</p>
          )}
          {nodes.length === 0 && currentSimId && !placeMode && (
            <p class="section-desc text-muted" style="padding:1rem">Aucun nœud. Ajoute des équipements (PC, routeur, switch, serveur), relie-les, puis clique sur un nœud pour configurer IP / type.</p>
          )}
          <svg
            ref={svgRef}
            class="network-sim-canvas"
            width="100%"
            height="520"
            viewBox={`${pan.x} ${pan.y} ${canvasWidth / zoom} ${canvasHeight / zoom}`}
            preserveAspectRatio="xMidYMid meet"
            onClick={handleSvgClick}
            style={{ display: (nodes.length || placeMode) ? 'block' : 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
          >
            {snapToGrid && (
              <defs>
                <pattern id="network-sim-grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                  <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                </pattern>
              </defs>
            )}
            {snapToGrid && <rect width={canvasWidth} height={canvasHeight} fill="url(#network-sim-grid)" />}
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
              const sel = selectedEdgeId === ed.id;
              return (
                <g key={ed.id} onClick={(e) => { e.stopPropagation(); setSelectedId(null); setSelectedEdgeId(ed.id); }}>
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
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="transparent"
                    strokeWidth="16"
                    style="cursor:pointer"
                  />
                  {sel && (
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="#fff"
                      strokeWidth="4"
                      strokeDasharray="4,3"
                      opacity="0.8"
                    />
                  )}
                  <text x={mx} y={my} textAnchor="middle" fill={lt.stroke} fontSize="9" fontWeight="600" pointerEvents="none">
                    {ed.fromPort != null && ed.toPort != null ? `Fa0/${ed.fromPort}→Fa0/${ed.toPort}` : lt.short}
                  </text>
                </g>
              );
            })}
            {packetCoords && (
              <g class="network-sim-packet">
                <circle cx={packetCoords.x} cy={packetCoords.y} r="6" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" opacity="0.95" />
              </g>
            )}
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
                  style="cursor:pointer; user-select:none; -webkit-user-select:none"
                >
                  {renderNodeShape(n, def, color, sel, conn)}
                </g>
              );
            })}
          </svg>
          <div class="network-sim-zoom-overlay" aria-label="Zoom carte">
            <button type="button" class="btn btn-secondary" onClick={() => setZoom((z) => Math.max(0.25, Math.min(3, z - 0.25)))} title="Dézoomer">−</button>
            <span style="font-size:0.9rem;min-width:3rem;text-align:center">{Math.round(zoom * 100)}%</span>
            <button type="button" class="btn btn-secondary" onClick={() => setZoom((z) => Math.max(0.25, Math.min(3, z + 0.25)))} title="Zoomer">+</button>
            <button type="button" class="btn btn-secondary" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} title="Réinitialiser">100%</button>
          </div>
        </div>
        </div>

        {(selectedNode || selectedEdgeId) && (
          <div class="network-sim-panel-resizer" onMouseDown={handlePanelResizeStart} title="Redimensionner le panneau" role="separator" />
        )}
        {selectedNode && (
          <aside class="network-sim-config-panel" style={{ width: panelWidth }}>
            <div class="network-sim-panel-header">
              <h4>Appareil : {escapeHtml(selectedNode.label || selectedNode.id)}</h4>
              <p class="network-sim-panel-model" style="margin:0.2rem 0 0.5rem; font-size:0.85rem; color:var(--text-muted)">
                Modèle : {(DEVICE_MODELS[selectedNode.type]?.find((m) => m.value === (selectedNode.deviceModel || ''))?.label) || selectedNode.deviceModel || '—'}
              </p>
              <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap">
                <button type="button" class="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.2rem 0.4rem' }} onClick={() => setSelectedId(null)} title="Fermer le panneau">✕</button>
                <button type="button" class="btn danger" style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }} onClick={() => { if (confirm('Supprimer cet appareil de la carte ?')) deleteSelected(); }} title="Supprimer l'appareil de la carte">
                  Supprimer cet appareil
                </button>
              </div>
            </div>

            <section class="network-sim-panel-section">
              <h5 class="network-sim-panel-section-title">Informations</h5>
              <dl class="network-sim-info-list">
                <dt>Type</dt>
                <dd>{NODE_TYPES.find((t) => t.type === selectedNode.type)?.label || selectedNode.type}</dd>
                <dt>Modèle</dt>
                <dd>{(DEVICE_MODELS[selectedNode.type]?.find((m) => m.value === (selectedNode.deviceModel || ''))?.label) || selectedNode.deviceModel || '—'}</dd>
                <dt>Couche</dt>
                <dd><span class="network-sim-layer-badge">{getNodeLayer(selectedNode) || '—'}</span></dd>
                {selectedNode.buildingId && (
                  <>
                    <dt>Bâtiment / Zone</dt>
                    <dd>{escapeHtml(buildings.find((b) => b.id === selectedNode.buildingId)?.name || selectedNode.buildingId)}</dd>
                    {selectedNode.buildingFloorId && (() => {
                      const b = buildings.find((x) => x.id === selectedNode.buildingId);
                      const f = b?.floors?.find((x) => x.id === selectedNode.buildingFloorId);
                      return f ? (<><dt>Étage / Salle</dt><dd>{escapeHtml(f.name)}</dd></>) : null;
                    })()}
                  </>
                )}
                {(() => {
                  const nodeEdges = edges.filter((e) => e.from === selectedNode.id || e.to === selectedNode.id);
                  return nodeEdges.length > 0 ? (
                    <>
                      <dt>Ports / Liaisons</dt>
                      <dd>
                        <ul class="network-sim-ports-list" style={{ marginTop: 0 }}>
                          {nodeEdges.map((e) => {
                            const isFrom = e.from === selectedNode.id;
                            const port = isFrom ? e.fromPort : e.toPort;
                            const otherId = isFrom ? e.to : e.from;
                            const other = nodes.find((n) => n.id === otherId);
                            const lt = LINK_TYPES.find((l) => l.id === (e.linkType || 'ethernet-straight'));
                            return (
                              <li key={e.id}>Fa0/{port != null ? port : '?'} → {escapeHtml(other?.label || otherId)} ({lt?.short || e.linkType})</li>
                            );
                          })}
                        </ul>
                      </dd>
                    </>
                  ) : null;
                })()}
              </dl>
            </section>

            <section class="network-sim-panel-section">
              <h5 class="network-sim-panel-section-title">Configuration</h5>
              <div class="network-sim-config-form">
              <label>Type d'appareil</label>
              <select
                value={selectedNode.type}
                onInput={(e) => changeNodeType(selectedNode.id, e.target.value)}
                title="Changer le type de l'appareil (comme Packet Tracer)"
              >
                {NODE_TYPES_BASE.map((t) => (
                  <option key={t.type} value={t.type}>{t.label}</option>
                ))}
              </select>
              <label>Nom (comme Packet Tracer)</label>
              <input
                type="text"
                value={selectedNode.label || ''}
                onInput={(e) => updateNodeConfig(selectedNode.id, { label: e.target.value })}
                placeholder="ex. PC-1, Routeur-Core, Switch-DMZ"
                title="Nom affiché sur la carte"
              />
              <label>Bâtiment / Zone (assigner cet appareil)</label>
              <select
                value={selectedNode.buildingId || ''}
                onInput={(e) => {
                  const newId = e.target.value || undefined;
                  const b = newId ? buildings.find((x) => x.id === newId) : null;
                  const floors = b?.floors || [];
                  const validFloor = floors.some((f) => f.id === selectedNode.buildingFloorId);
                  updateNodeConfig(selectedNode.id, { buildingId: newId, buildingFloorId: validFloor ? selectedNode.buildingFloorId : (floors[0]?.id || undefined) });
                }}
                title="Placer cet appareil dans un bâtiment ou zone"
              >
                <option value="">Aucun (carte)</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>{escapeHtml(b.name)}</option>
                ))}
              </select>
              {selectedNode.buildingId && (() => {
                const b = buildings.find((x) => x.id === selectedNode.buildingId);
                const floors = b?.floors || [];
                if (floors.length === 0) return null;
                return (
                  <>
                    <label>Étage / Salle</label>
                    <select
                      value={selectedNode.buildingFloorId || floors[0]?.id || ''}
                      onInput={(e) => updateNodeConfig(selectedNode.id, { buildingFloorId: e.target.value || undefined })}
                      title="Étage ou salle dans ce bâtiment"
                    >
                      {floors.map((f) => (
                        <option key={f.id} value={f.id}>{escapeHtml(f.name)}</option>
                      ))}
                    </select>
                  </>
                );
              })()}
              {(DEVICE_MODELS[selectedNode.type]?.length > 1) && (
                <>
                  <label>Modèle / constructeur</label>
                  <select
                    value={selectedNode.deviceModel || (DEVICE_MODELS[selectedNode.type]?.[0]?.value)}
                    onInput={(e) => updateNodeConfig(selectedNode.id, { deviceModel: e.target.value })}
                  >
                    {DEVICE_MODELS[selectedNode.type].map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </>
              )}
              {selectedNode.type === 'router' && (
                <>
                  <label>Niveau (couche) — L2 ou L3</label>
                  <select
                    value={selectedNode.routerLayer || 'L3'}
                    onInput={(e) => updateNodeConfig(selectedNode.id, { routerLayer: e.target.value })}
                  >
                    {ROUTER_LAYERS.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                  {(DEVICE_MODELS.router || []).find((m) => m.value === (selectedNode.deviceModel || ''))?.hasWifi && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!selectedNode.routerWifi}
                        onChange={(e) => updateNodeConfig(selectedNode.id, { routerWifi: e.target.checked })}
                      />
                      WiFi intégré (ce modèle le supporte)
                    </label>
                  )}
                </>
              )}
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
                  <label>Serveur DNS (IP) — utilisé par nslookup/dig</label>
                  <input
                    type="text"
                    value={selectedNode.dnsServer || ''}
                    onInput={(e) => updateNodeConfig(selectedNode.id, { dnsServer: e.target.value })}
                    placeholder="ex. 8.8.8.8 ou laisser vide"
                  />
                </>
              )}
              {selectedNode.type === 'ap' && (
                <>
                  <label>SSID (réseau Wi‑Fi)</label>
                  <input
                    type="text"
                    value={selectedNode.ssid || ''}
                    onInput={(e) => updateNodeConfig(selectedNode.id, { ssid: e.target.value })}
                    placeholder="MonRéseau"
                  />
                </>
              )}
              {selectedNode.type === 'firewall' && (
                <p class="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Règles (liste / ACL) — à venir. Terminal du lab : show access-list, show config.</p>
              )}
              {selectedNode.type === 'switch' && (
                <>
                  <label>Niveau commutateur (L2 / L3)</label>
                  <select
                    value={selectedNode.switchType || 'layer2'}
                    onInput={(e) => updateNodeConfig(selectedNode.id, { switchType: e.target.value })}
                  >
                    {SWITCH_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <p class="text-muted" style="fontSize:0.75rem; margin:0.2rem 0 0">L2 = commutation par adresse MAC ; L3 = routage IP en plus.</p>
                </>
              )}
              {['backbone', 'cloud'].includes(selectedNode.type) && (
                <>
                  <label>Rôle</label>
                  <select
                    value={selectedNode.cloudRole || 'wan'}
                    onInput={(e) => updateNodeConfig(selectedNode.id, { cloudRole: e.target.value })}
                  >
                    {CLOUD_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <label>IP</label>
                  <input type="text" value={selectedNode.ip || ''} onInput={(e) => updateNodeConfig(selectedNode.id, { ip: e.target.value })} placeholder="ex. 10.0.0.1" />
                  <label>Masque</label>
                  <input type="text" value={selectedNode.subnetMask || '255.255.255.0'} onInput={(e) => updateNodeConfig(selectedNode.id, { subnetMask: e.target.value })} />
                  <label>Passerelle</label>
                  <input type="text" value={selectedNode.gateway || ''} onInput={(e) => updateNodeConfig(selectedNode.id, { gateway: e.target.value })} placeholder="optionnel" />
                </>
              )}
              {['phone', 'tablet', 'camera'].includes(selectedNode.type) && (
                <>
                  <label>IP</label>
                  <input type="text" value={selectedNode.ip || ''} onInput={(e) => updateNodeConfig(selectedNode.id, { ip: e.target.value })} placeholder="192.168.1.10" />
                  <label>Masque</label>
                  <input type="text" value={selectedNode.subnetMask || '255.255.255.0'} onInput={(e) => updateNodeConfig(selectedNode.id, { subnetMask: e.target.value })} />
                  <label>Passerelle</label>
                  <input type="text" value={selectedNode.gateway || ''} onInput={(e) => updateNodeConfig(selectedNode.id, { gateway: e.target.value })} placeholder="192.168.1.1" />
                </>
              )}
              {selectedNode.type === 'phone' && (
                <label style="display:flex;align-items:center;gap:0.5rem">
                  <span>SIP / Serveur VoIP (optionnel)</span>
                  <input type="text" value={selectedNode.sipServer || ''} onInput={(e) => updateNodeConfig(selectedNode.id, { sipServer: e.target.value })} placeholder="192.168.1.100" style="flex:1" />
                </label>
              )}
              {selectedNode.type === 'printer' && (
                <>
                  <label>Type d'imprimante</label>
                  <select
                    value={selectedNode.printerType || 'network'}
                    onInput={(e) => updateNodeConfig(selectedNode.id, { printerType: e.target.value })}
                  >
                    {PRINTER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <label>IP (si réseau)</label>
                  <input type="text" value={selectedNode.ip || ''} onInput={(e) => updateNodeConfig(selectedNode.id, { ip: e.target.value })} placeholder="192.168.1.20" />
                </>
              )}
              {selectedNode.type === 'modem' && (
                <>
                  <label>Type de connexion</label>
                  <select
                    value={selectedNode.modemType || 'dsl'}
                    onInput={(e) => updateNodeConfig(selectedNode.id, { modemType: e.target.value })}
                  >
                    {MODEM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </>
              )}
              {selectedNode.type === 'hub' && (
                <label style="display:flex;align-items:center;gap:0.5rem">
                  <span>Ports (affichage)</span>
                  <input type="number" min="4" max="24" value={selectedNode.hubPorts || 8} onInput={(e) => updateNodeConfig(selectedNode.id, { hubPorts: parseInt(e.target.value, 10) || 8 })} style="width:4rem" />
                </label>
              )}
              {selectedNode.type === 'bridge' && (
                <p class="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Pont L2 — commutation par MAC. Spanning-tree à venir. Commandes type : show mac address-table, show spanning-tree.</p>
              )}
              </div>
            </section>

            <section class="network-sim-panel-section">
              <h5 class="network-sim-panel-section-title">Terminal du lab (réel)</h5>
              <p class="section-desc text-muted" style="font-size:0.8rem; margin:0 0 0.5rem">
                Pour exécuter de <strong>vraies commandes</strong> (Cisco IOS, switch, routeur, Linux, etc.), utilise le terminal réel du lab — conteneur attaquant (Kali). Ci‑dessous : terminal intégré ou ouvre en plein écran.
              </p>
              <div class="network-sim-real-terminal-actions">
                <a href={getTerminalUrl()} target="_blank" rel="noopener" class="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  Ouvrir le terminal dans un nouvel onglet
                </a>
                <a href="#/terminal-full" class="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
                  Terminal plein écran
                </a>
              </div>
              <div class="network-sim-terminal-iframe-wrap">
                <iframe
                  title="Terminal du lab (réel)"
                  src={getTerminalUrl()}
                  class="network-sim-terminal-iframe"
                />
              </div>
              <details class="network-sim-commands-help">
                <summary>Commandes utiles pour cet appareil ({selectedNode.type})</summary>
                <pre class="network-sim-commands-help-pre">{getDeviceCommandsHelp(selectedNode.type)}</pre>
                <p class="text-muted" style={{ fontSize: '0.75rem', margin: '0.35rem 0 0' }}>Référence uniquement — exécute-les dans le terminal ci‑dessus ou dans un vrai équipement (GNS3, Packet Tracer, lab physique).</p>
              </details>
            </section>

            <section class="network-sim-panel-section">
              <h5 class="network-sim-panel-section-title">Trafic &amp; Capture</h5>
              <p class="section-desc text-muted" style="font-size:0.8rem; margin:0 0 0.5rem">
                À venir : lier cet appareil au lab, activer/désactiver la capture pcap, play/pause du trafic réel.
              </p>
              <div class="network-sim-config-form">
                <label style="display:flex;align-items:center;gap:0.5rem;cursor:not-allowed;opacity:0.8">
                  <input type="checkbox" disabled />
                  Activer capture pcap (lab)
                </label>
                <label style="display:flex;align-items:center;gap:0.5rem;cursor:not-allowed;opacity:0.8">
                  <input type="checkbox" disabled />
                  Play / Pause trafic réel
                </label>
                <span class="network-sim-toolbar-hint" style="fontSize:0.75rem">Utilise la vue Capture et le Terminal du lab en attendant.</span>
              </div>
            </section>
          </aside>
        )}

        {selectedEdgeId && !selectedId && (() => {
          const ed = edges.find((e) => e.id === selectedEdgeId);
          if (!ed) return null;
          const fromNode = nodes.find((n) => n.id === ed.from);
          const toNode = nodes.find((n) => n.id === ed.to);
          const lt = LINK_TYPES.find((l) => l.id === (ed.linkType || 'ethernet-straight')) || LINK_TYPES[0];
          return (
            <aside class="network-sim-config-panel" style={{ width: panelWidth }}>
              <div class="network-sim-panel-header">
                <h4>Liaison</h4>
                <button type="button" class="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.2rem 0.4rem' }} onClick={() => setSelectedEdgeId(null)} title="Fermer">✕</button>
              </div>
              <section class="network-sim-panel-section">
                <h5 class="network-sim-panel-section-title">Connexion</h5>
                <dl class="network-sim-info-list">
                  <dt>De</dt>
                  <dd>{escapeHtml(fromNode?.label || ed.from)}</dd>
                  <dt>Vers</dt>
                  <dd>{escapeHtml(toNode?.label || ed.to)}</dd>
                  <dt>Type de câble</dt>
                  <dd>
                    <select
                      value={ed.linkType || 'ethernet-straight'}
                      onInput={(e) => setEdges((es) => es.map((x) => (x.id === ed.id ? { ...x, linkType: e.target.value || 'ethernet-straight' } : x)))}
                      class="api-client-select"
                      style={{ width: '100%', marginTop: '0.25rem' }}
                      title="Changer le type de câble"
                    >
                      {LINK_TYPES.map((lt) => (
                        <option key={lt.id} value={lt.id}>{lt.label}</option>
                      ))}
                    </select>
                  </dd>
                  {(ed.fromPort != null && ed.toPort != null) && (
                    <>
                      <dt>Ports</dt>
                      <dd>Fa0/{ed.fromPort} → Fa0/{ed.toPort}</dd>
                    </>
                  )}
                </dl>
                <div style="marginTop:0.5rem">
                  <label>Port machine source (Fa0/)</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={ed.fromPort ?? ''}
                    onInput={(e) => {
                      const v = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                      setEdges((es) => es.map((x) => (x.id === ed.id ? { ...x, fromPort: Number.isNaN(v) ? undefined : v } : x)));
                    }}
                    placeholder="auto"
                    style="width:4rem"
                  />
                  <label style="marginLeft:0.5rem">Port machine cible (Fa0/)</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={ed.toPort ?? ''}
                    onInput={(e) => {
                      const v = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                      setEdges((es) => es.map((x) => (x.id === ed.id ? { ...x, toPort: Number.isNaN(v) ? undefined : v } : x)));
                    }}
                    placeholder="auto"
                    style="width:4rem"
                  />
                </div>
                <button type="button" class="topbar-btn danger" style="marginTop:0.5rem" onClick={deleteSelectedEdge}>
                  Supprimer la liaison
                </button>
              </section>
            </aside>
          );
        })()}
      </div>

      <p class="section-desc" style="margin-top:0.75rem">
        <strong>Mode lab (type EVE-NG)</strong> : PC et serveur = conteneurs <strong>Docker</strong>, routeurs = <strong>Dynamips</strong> (ISO Cisco), switchs = <strong>IOL</strong> (Cisco IOS on Linux). La topologie peut être exportée pour un futur backend qui lancera les vrais conteneurs/émulateurs.
      </p>
      <div class="network-sim-eve-export" style={{ marginTop: '0.5rem' }}>
        <button
          type="button"
          class="btn btn-secondary"
          onClick={() => {
            const json = JSON.stringify(getTopologyExportForBackend(), null, 2);
            if (navigator.clipboard?.writeText) {
              navigator.clipboard.writeText(json);
              alert('Topologie copiée dans le presse-papier (format backend lab).');
            } else {
              const a = document.createElement('a');
              a.href = 'data:application/json,' + encodeURIComponent(json);
              a.download = (currentSim?.name || 'topology') + '-eve-ng-lab.json';
              a.click();
            }
          }}
          title="Format : nœuds (backend docker/dynamips/iol) + liens"
        >
          Exporter la topologie (backend lab)
        </button>
        <a href="#/eve-ng-sim" class="btn btn-secondary" style={{ marginLeft: '0.5rem' }} title="Catalogue d’images et images mises de côté">
          Gérer les images EVE-NG
        </a>
        <span class="network-sim-toolbar-hint" style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>PC/serveur → Docker, routeur → Dynamips, switch → IOL. Les images mises de côté (page EVE-NG) sont utilisées à l’export si présentes.</span>
      </div>
      <p class="section-desc" style="margin-top:0.75rem">
        Pour du trafic réel (tcpdump, capture pcap) : utilise le <a href="#/terminal-full" style="color:var(--accent)">Terminal</a> et la vue <a href="#/capture" style="color:var(--accent)">Capture pcap</a>. Les cartes sont sauvegardées automatiquement pour le lab.
      </p>
    </div>
  );
}
