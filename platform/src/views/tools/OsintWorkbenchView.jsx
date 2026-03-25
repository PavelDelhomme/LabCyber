import { useEffect, useState } from 'preact/hooks';
import { escapeHtml, useStorageReady } from '../../lib/store';

function defaultOsint() {
  return {
    organizations: [],
    contacts: [],
    assets: [],
    leads: [],
    notes: '',
  };
}

function defaultEngagement() {
  return {
    targets: [],
    proxies: [],
    proxyNotes: '',
    notes: '',
    dataCollected: '',
    sessions: [],
    todos: [],
    history: [],
    osintWorkspace: defaultOsint(),
  };
}

const OSINT_TOOLS = [
  { name: 'OSINT Framework', url: 'https://osintframework.com/', desc: 'Arbre de méthodologies et d’outils OSINT' },
  { name: 'SpiderFoot (OSS)', url: 'https://github.com/smicallef/spiderfoot', desc: 'Recon automatique domaine/entreprise' },
  { name: 'theHarvester', url: 'https://github.com/laramies/theHarvester', desc: 'Emails, sous-domaines, employés, empreintes publiques' },
  { name: 'Amass', url: 'https://github.com/owasp-amass/amass', desc: 'Cartographie DNS et actifs externes' },
  { name: 'PhoneInfoga', url: 'https://github.com/sundowndev/phoneinfoga', desc: 'Analyse de numéros de téléphone (sources publiques)' },
  { name: 'Sherlock', url: 'https://github.com/sherlock-project/sherlock', desc: 'Recherche de pseudos sur réseaux sociaux' },
  { name: 'GHunt', url: 'https://github.com/mxrch/GHunt', desc: 'Investigation de comptes Google (usage légal uniquement)' },
  { name: 'Maigret', url: 'https://github.com/soxoj/maigret', desc: 'Recherche identités numériques multi-plateformes' },
  { name: 'Holehe', url: 'https://github.com/megadose/holehe', desc: 'Vérification présence d’email sur services publics' },
  { name: 'Maltego CE', url: 'https://www.maltego.com/', desc: 'Graphe de liens entités/sources' },
];

const AI_OSINT_PROJECTS = [
  { name: 'OpenWebUI', url: 'https://github.com/open-webui/open-webui', desc: 'Interface IA open source locale (LLM)' },
  { name: 'Langflow', url: 'https://github.com/langflow-ai/langflow', desc: 'Pipelines IA no-code pour enrichissements' },
  { name: 'Flowise', url: 'https://github.com/FlowiseAI/Flowise', desc: 'Orchestration d’agents IA et workflows' },
  { name: 'Haystack', url: 'https://github.com/deepset-ai/haystack', desc: 'RAG pour indexer et interroger ton dossier OSINT' },
];

function norm(v) {
  return String(v || '').trim().toLowerCase();
}

function asCsv(items, columns) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = columns.map((c) => esc(c.label)).join(',');
  const rows = items.map((row) => columns.map((c) => esc(row[c.key])).join(','));
  return [header, ...rows].join('\n');
}

function downloadText(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function computeContactConfidence(contact, sourceCount) {
  let score = 0;
  if (contact.email) score += 25;
  if (contact.phone) score += 20;
  if (contact.linkedin) score += 20;
  if (contact.organization) score += 10;
  if (contact.role) score += 10;
  if ((sourceCount || 0) >= 2) score += 15;
  if (norm(contact.confidence) === 'high') score += 10;
  if (norm(contact.confidence) === 'low') score -= 10;
  if (score < 35) return { score: Math.max(0, score), level: 'low' };
  if (score < 70) return { score, level: 'medium' };
  return { score: Math.min(100, score), level: 'high' };
}

export default function OsintWorkbenchView({ storage }) {
  const storageReady = useStorageReady();
  const [workspace, setWorkspace] = useState(defaultOsint());
  const [query, setQuery] = useState('');
  const [reportPreview, setReportPreview] = useState('');
  const [importStatus, setImportStatus] = useState('');

  useEffect(() => {
    if (!storageReady || !storage) return;
    const engagement = storage.getEngagement?.() || defaultEngagement();
    const osintWorkspace = engagement.osintWorkspace || defaultOsint();
    setWorkspace({ ...defaultOsint(), ...osintWorkspace });
  }, [storageReady, storage]);

  const persist = (next) => {
    const engagement = storage?.getEngagement?.() || defaultEngagement();
    const full = { ...defaultOsint(), ...workspace, ...(typeof next === 'function' ? next(workspace) : next) };
    setWorkspace(full);
    storage?.setEngagement?.({ ...defaultEngagement(), ...engagement, osintWorkspace: full });
  };

  const addOrganization = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.querySelector('[name="orgName"]')?.value?.trim();
    if (!name) return;
    const org = {
      id: String(Date.now()),
      name,
      website: form.querySelector('[name="orgWebsite"]')?.value?.trim() || '',
      linkedin: form.querySelector('[name="orgLinkedin"]')?.value?.trim() || '',
      sector: form.querySelector('[name="orgSector"]')?.value?.trim() || '',
      hq: form.querySelector('[name="orgHq"]')?.value?.trim() || '',
      departments: form.querySelector('[name="orgDepartments"]')?.value?.trim() || '',
      notes: form.querySelector('[name="orgNotes"]')?.value?.trim() || '',
      createdAt: new Date().toISOString(),
    };
    persist((w) => ({ ...w, organizations: [...(w.organizations || []), org] }));
    form.reset();
  };

  const addContact = (e) => {
    e.preventDefault();
    const form = e.target;
    const fullName = form.querySelector('[name="contactName"]')?.value?.trim();
    if (!fullName) return;
    const contact = {
      id: String(Date.now()),
      fullName,
      role: form.querySelector('[name="contactRole"]')?.value?.trim() || '',
      organization: form.querySelector('[name="contactOrg"]')?.value?.trim() || '',
      email: form.querySelector('[name="contactEmail"]')?.value?.trim() || '',
      phone: form.querySelector('[name="contactPhone"]')?.value?.trim() || '',
      linkedin: form.querySelector('[name="contactLinkedin"]')?.value?.trim() || '',
      source: form.querySelector('[name="contactSource"]')?.value?.trim() || '',
      confidence: form.querySelector('[name="contactConfidence"]')?.value || 'medium',
      notes: form.querySelector('[name="contactNotes"]')?.value?.trim() || '',
      createdAt: new Date().toISOString(),
    };
    persist((w) => ({ ...w, contacts: [...(w.contacts || []), contact] }));
    form.reset();
  };

  const addAsset = (e) => {
    e.preventDefault();
    const form = e.target;
    const value = form.querySelector('[name="assetValue"]')?.value?.trim();
    if (!value) return;
    const asset = {
      id: String(Date.now()),
      type: form.querySelector('[name="assetType"]')?.value || 'domain',
      value,
      organization: form.querySelector('[name="assetOrg"]')?.value?.trim() || '',
      source: form.querySelector('[name="assetSource"]')?.value?.trim() || '',
      notes: form.querySelector('[name="assetNotes"]')?.value?.trim() || '',
      createdAt: new Date().toISOString(),
    };
    persist((w) => ({ ...w, assets: [...(w.assets || []), asset] }));
    form.reset();
  };

  const addLead = (e) => {
    e.preventDefault();
    const form = e.target;
    const title = form.querySelector('[name="leadTitle"]')?.value?.trim();
    if (!title) return;
    const lead = {
      id: String(Date.now()),
      title,
      priority: form.querySelector('[name="leadPriority"]')?.value || 'medium',
      status: form.querySelector('[name="leadStatus"]')?.value || 'todo',
      owner: form.querySelector('[name="leadOwner"]')?.value?.trim() || '',
      notes: form.querySelector('[name="leadNotes"]')?.value?.trim() || '',
      createdAt: new Date().toISOString(),
    };
    persist((w) => ({ ...w, leads: [...(w.leads || []), lead] }));
    form.reset();
  };

  const removeItem = (key, id) => {
    persist((w) => ({ ...w, [key]: (w[key] || []).filter((x) => x.id !== id) }));
  };

  const sourceCountByContact = (contact) => {
    const keys = [contact.email, contact.phone, contact.linkedin, contact.fullName]
      .map(norm)
      .filter(Boolean);
    const sourceHits = (workspace.assets || []).filter((a) => {
      const hay = `${a.value || ''} ${a.notes || ''} ${a.source || ''}`.toLowerCase();
      return keys.some((k) => hay.includes(k));
    }).length;
    return sourceHits;
  };

  const deduplicateAll = () => {
    persist((w) => {
      const orgSeen = new Set();
      const organizations = (w.organizations || []).filter((o) => {
        const k = norm(o.name) || norm(o.website);
        if (!k || orgSeen.has(k)) return false;
        orgSeen.add(k);
        return true;
      });
      const contactSeen = new Set();
      const contacts = (w.contacts || []).filter((c) => {
        const k = norm(c.email) || `${norm(c.fullName)}|${norm(c.organization)}`;
        if (!k || contactSeen.has(k)) return false;
        contactSeen.add(k);
        return true;
      });
      const assetSeen = new Set();
      const assets = (w.assets || []).filter((a) => {
        const k = `${norm(a.type)}|${norm(a.value)}`;
        if (!k || assetSeen.has(k)) return false;
        assetSeen.add(k);
        return true;
      });
      const leadSeen = new Set();
      const leads = (w.leads || []).filter((l) => {
        const k = `${norm(l.title)}|${norm(l.owner)}`;
        if (!k || leadSeen.has(k)) return false;
        leadSeen.add(k);
        return true;
      });
      return { ...w, organizations, contacts, assets, leads };
    });
  };

  const exportJson = () => {
    downloadText(`osint-workspace-${Date.now()}.json`, JSON.stringify(workspace, null, 2), 'application/json;charset=utf-8');
  };

  const exportCsvBundle = () => {
    const organizationsCsv = asCsv(workspace.organizations || [], [
      { key: 'name', label: 'name' }, { key: 'website', label: 'website' }, { key: 'linkedin', label: 'linkedin' }, { key: 'sector', label: 'sector' },
      { key: 'hq', label: 'hq' }, { key: 'departments', label: 'departments' }, { key: 'notes', label: 'notes' },
    ]);
    const contactsCsv = asCsv((workspace.contacts || []).map((c) => {
      const conf = computeContactConfidence(c, sourceCountByContact(c));
      return { ...c, confidenceScore: conf.score, confidenceLevel: conf.level };
    }), [
      { key: 'fullName', label: 'fullName' }, { key: 'role', label: 'role' }, { key: 'organization', label: 'organization' }, { key: 'email', label: 'email' },
      { key: 'phone', label: 'phone' }, { key: 'linkedin', label: 'linkedin' }, { key: 'source', label: 'source' }, { key: 'confidence', label: 'confidence' },
      { key: 'confidenceScore', label: 'confidenceScore' }, { key: 'confidenceLevel', label: 'confidenceLevel' }, { key: 'notes', label: 'notes' },
    ]);
    const assetsCsv = asCsv(workspace.assets || [], [
      { key: 'type', label: 'type' }, { key: 'value', label: 'value' }, { key: 'organization', label: 'organization' }, { key: 'source', label: 'source' }, { key: 'notes', label: 'notes' },
    ]);
    const leadsCsv = asCsv(workspace.leads || [], [
      { key: 'title', label: 'title' }, { key: 'priority', label: 'priority' }, { key: 'status', label: 'status' }, { key: 'owner', label: 'owner' }, { key: 'notes', label: 'notes' },
    ]);
    const bundle = [
      '# organizations.csv', organizationsCsv,
      '', '# contacts.csv', contactsCsv,
      '', '# assets.csv', assetsCsv,
      '', '# leads.csv', leadsCsv,
    ].join('\n');
    downloadText(`osint-export-${Date.now()}.txt`, bundle, 'text/plain;charset=utf-8');
  };

  const onImportJson = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const raw = await f.text();
      const parsed = JSON.parse(raw);
      const next = { ...defaultOsint(), ...parsed };
      persist(next);
      setImportStatus('Import JSON réussi.');
    } catch (err) {
      setImportStatus('Import JSON échoué (format invalide).');
    } finally {
      e.target.value = '';
    }
  };

  const filtered = {
    organizations: (workspace.organizations || []).filter((o) => `${o.name} ${o.website} ${o.linkedin} ${o.notes}`.toLowerCase().includes(norm(query))),
    contacts: (workspace.contacts || []).filter((c) => `${c.fullName} ${c.role} ${c.organization} ${c.email} ${c.phone} ${c.linkedin} ${c.notes}`.toLowerCase().includes(norm(query))),
    assets: (workspace.assets || []).filter((a) => `${a.type} ${a.value} ${a.organization} ${a.notes}`.toLowerCase().includes(norm(query))),
    leads: (workspace.leads || []).filter((l) => `${l.title} ${l.owner} ${l.notes}`.toLowerCase().includes(norm(query))),
  };

  const generateReport = () => {
    const lines = [];
    lines.push('# Rapport OSINT');
    lines.push(`Date: ${new Date().toLocaleString('fr-FR')}`);
    lines.push('');
    lines.push('## Entreprises');
    (workspace.organizations || []).forEach((o) => {
      lines.push(`- ${o.name} | ${o.website || '-'} | secteur: ${o.sector || '-'} | hq: ${o.hq || '-'}`);
    });
    lines.push('');
    lines.push('## Contacts (avec score)');
    (workspace.contacts || []).forEach((c) => {
      const conf = computeContactConfidence(c, sourceCountByContact(c));
      lines.push(`- ${c.fullName} (${c.role || '-'}) @ ${c.organization || '-'} | email: ${c.email || '-'} | score: ${conf.score}/100 (${conf.level})`);
    });
    lines.push('');
    lines.push('## Actifs');
    (workspace.assets || []).forEach((a) => lines.push(`- [${a.type}] ${a.value} (${a.organization || '-'})`));
    lines.push('');
    lines.push('## Pistes');
    (workspace.leads || []).forEach((l) => lines.push(`- ${l.title} | priorité: ${l.priority} | statut: ${l.status} | owner: ${l.owner || '-'}`));
    lines.push('');
    lines.push('## Notes');
    lines.push(workspace.notes || '-');
    const md = lines.join('\n');
    setReportPreview(md);
  };

  return (
    <div id="view-osint-workbench" class="view">
      <header class="page-header">
        <h2>OSINT Workbench (Labs &amp; Outils)</h2>
        <p class="section-desc">
          Espace complet pour cartographier des entreprises, structurer les contacts (RH, métiers, direction), tracer les actifs et conserver les preuves.
          Sauvegarde persistante locale via le stockage du lab.
        </p>
        <p class="section-desc">
          Utilisation légale uniquement : données publiques, consentement et conformité RGPD / politique interne.
        </p>
        <div class="engagement-form" style="margin-top:0.75rem">
          <input type="search" value={query} onInput={(e) => setQuery(e.target.value)} placeholder="Rechercher dans entreprises, contacts, actifs, pistes..." />
          <button type="button" class="topbar-btn" onClick={deduplicateAll}>Dédupliquer</button>
          <button type="button" class="topbar-btn" onClick={exportJson}>Exporter JSON</button>
          <button type="button" class="topbar-btn" onClick={exportCsvBundle}>Exporter CSV (bundle texte)</button>
          <label class="topbar-btn" style="cursor:pointer">Importer JSON
            <input type="file" accept="application/json,.json" onChange={onImportJson} style="display:none" />
          </label>
          <button type="button" class="btn btn-primary" onClick={generateReport}>Générer rapport</button>
        </div>
        {importStatus && <p class="section-desc">{escapeHtml(importStatus)}</p>}
      </header>

      <section class="room-section">
        <h3>Boîte à outils OSINT open source</h3>
        <div class="engagement-list">
          {OSINT_TOOLS.map((t) => (
            <div key={t.name} class="engagement-target-item">
              <a href={t.url} target="_blank" rel="noopener nofollow" class="engagement-target-url">{escapeHtml(t.name)}</a>
              <span class="engagement-target-notes">{escapeHtml(t.desc)}</span>
            </div>
          ))}
        </div>
      </section>

      <section class="room-section">
        <h3>Projets IA open source utiles en OSINT</h3>
        <div class="engagement-list">
          {AI_OSINT_PROJECTS.map((t) => (
            <div key={t.name} class="engagement-target-item">
              <a href={t.url} target="_blank" rel="noopener nofollow" class="engagement-target-url">{escapeHtml(t.name)}</a>
              <span class="engagement-target-notes">{escapeHtml(t.desc)}</span>
            </div>
          ))}
        </div>
      </section>

      <section class="room-section">
        <h3>Entreprises / structures</h3>
        <form class="engagement-form osint-form-grid" onSubmit={addOrganization}>
          <input name="orgName" placeholder="Entreprise (obligatoire)" required />
          <input name="orgWebsite" placeholder="Site web" />
          <input name="orgLinkedin" placeholder="Page LinkedIn entreprise" />
          <input name="orgSector" placeholder="Secteur" />
          <input name="orgHq" placeholder="Siège / localisation" />
          <input name="orgDepartments" placeholder="Structure (ex: RH, IT, Finance)" />
          <input name="orgNotes" placeholder="Notes (taille, signaux, recrutements...)" />
          <button type="submit" class="topbar-btn">Ajouter entreprise</button>
        </form>
        <ul class="engagement-list">
          {filtered.organizations.map((o) => (
            <li key={o.id} class="engagement-target-item">
              <span class="engagement-target-name">{escapeHtml(o.name)}</span>
              {o.website && <a href={o.website} target="_blank" rel="noopener nofollow" class="engagement-target-url">{escapeHtml(o.website)}</a>}
              {o.linkedin && <a href={o.linkedin} target="_blank" rel="noopener nofollow" class="engagement-target-url">LinkedIn</a>}
              {o.sector && <span class="engagement-target-notes">Secteur: {escapeHtml(o.sector)}</span>}
              {o.hq && <span class="engagement-target-notes">HQ: {escapeHtml(o.hq)}</span>}
              {o.departments && <span class="engagement-target-notes">Structure: {escapeHtml(o.departments)}</span>}
              {o.notes && <span class="engagement-target-notes">{escapeHtml(o.notes)}</span>}
              <button type="button" class="topbar-btn danger" onClick={() => removeItem('organizations', o.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      </section>

      <section class="room-section">
        <h3>Contacts (RH / métiers / direction)</h3>
        <form class="engagement-form osint-form-grid" onSubmit={addContact}>
          <input name="contactName" placeholder="Nom complet (obligatoire)" required />
          <input name="contactRole" placeholder="Poste / rôle" />
          <input name="contactOrg" placeholder="Entreprise" />
          <input name="contactEmail" placeholder="Email (si public)" />
          <input name="contactPhone" placeholder="Téléphone (si public)" />
          <input name="contactLinkedin" placeholder="URL profil LinkedIn/public" />
          <input name="contactSource" placeholder="Source principale" />
          <select name="contactConfidence" defaultValue="medium">
            <option value="low">Confiance faible</option>
            <option value="medium">Confiance moyenne</option>
            <option value="high">Confiance élevée</option>
          </select>
          <input name="contactNotes" placeholder="Recoupements / commentaires" />
          <button type="submit" class="topbar-btn">Ajouter contact</button>
        </form>
        <ul class="engagement-list">
          {filtered.contacts.map((c) => {
            const conf = computeContactConfidence(c, sourceCountByContact(c));
            return (
            <li key={c.id} class="engagement-target-item">
              <span class="engagement-target-name">{escapeHtml(c.fullName)}</span>
              {c.role && <span class="engagement-target-notes">{escapeHtml(c.role)}</span>}
              {c.organization && <span class="engagement-target-notes">{escapeHtml(c.organization)}</span>}
              {c.email && <span class="engagement-target-notes">Email: {escapeHtml(c.email)}</span>}
              {c.phone && <span class="engagement-target-notes">Tel: {escapeHtml(c.phone)}</span>}
              {c.linkedin && <a href={c.linkedin} target="_blank" rel="noopener nofollow" class="engagement-target-url">Profil</a>}
              {c.source && <span class="engagement-target-notes">Source: {escapeHtml(c.source)}</span>}
              <span class="engagement-target-notes">Fiabilité déclarée: {escapeHtml(c.confidence)}</span>
              <span class="engagement-target-notes">Score auto: {conf.score}/100 ({escapeHtml(conf.level)})</span>
              {c.notes && <span class="engagement-target-notes">{escapeHtml(c.notes)}</span>}
              <button type="button" class="topbar-btn danger" onClick={() => removeItem('contacts', c.id)}>Supprimer</button>
            </li>
            );
          })}
        </ul>
      </section>

      <section class="room-section">
        <h3>Actifs externes (domaines, sous-domaines, réseaux, repos)</h3>
        <form class="engagement-form osint-form-grid" onSubmit={addAsset}>
          <select name="assetType" defaultValue="domain">
            <option value="domain">Domaine</option>
            <option value="subdomain">Sous-domaine</option>
            <option value="ip">IP publique</option>
            <option value="social">Réseau social</option>
            <option value="repo">Repository</option>
            <option value="job">Offre d’emploi</option>
            <option value="other">Autre</option>
          </select>
          <input name="assetValue" placeholder="Valeur (ex: acme.com)" required />
          <input name="assetOrg" placeholder="Entreprise associée" />
          <input name="assetSource" placeholder="Source de découverte" />
          <input name="assetNotes" placeholder="Notes techniques / risques" />
          <button type="submit" class="topbar-btn">Ajouter actif</button>
        </form>
        <ul class="engagement-list">
          {filtered.assets.map((a) => (
            <li key={a.id} class="engagement-target-item">
              <span class="engagement-target-notes">[{escapeHtml(a.type)}]</span>
              <span class="engagement-target-name">{escapeHtml(a.value)}</span>
              {a.organization && <span class="engagement-target-notes">{escapeHtml(a.organization)}</span>}
              {a.source && <span class="engagement-target-notes">Source: {escapeHtml(a.source)}</span>}
              {a.notes && <span class="engagement-target-notes">{escapeHtml(a.notes)}</span>}
              <button type="button" class="topbar-btn danger" onClick={() => removeItem('assets', a.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      </section>

      <section class="room-section">
        <h3>Pistes d’investigation (pipeline)</h3>
        <form class="engagement-form osint-form-grid" onSubmit={addLead}>
          <input name="leadTitle" placeholder="Piste (obligatoire)" required />
          <select name="leadPriority" defaultValue="medium">
            <option value="low">Priorité basse</option>
            <option value="medium">Priorité moyenne</option>
            <option value="high">Priorité haute</option>
          </select>
          <select name="leadStatus" defaultValue="todo">
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="validated">Validée</option>
            <option value="discarded">Écartée</option>
          </select>
          <input name="leadOwner" placeholder="Responsable" />
          <input name="leadNotes" placeholder="Commentaire / prochaine étape" />
          <button type="submit" class="topbar-btn">Ajouter piste</button>
        </form>
        <ul class="engagement-list">
          {filtered.leads.map((l) => (
            <li key={l.id} class="engagement-target-item">
              <span class="engagement-target-name">{escapeHtml(l.title)}</span>
              <span class="engagement-target-notes">Priorité: {escapeHtml(l.priority)}</span>
              <span class="engagement-target-notes">Statut: {escapeHtml(l.status)}</span>
              {l.owner && <span class="engagement-target-notes">Owner: {escapeHtml(l.owner)}</span>}
              {l.notes && <span class="engagement-target-notes">{escapeHtml(l.notes)}</span>}
              <button type="button" class="topbar-btn danger" onClick={() => removeItem('leads', l.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      </section>

      <section class="room-section">
        <h3>Notes analytiques OSINT</h3>
        <textarea
          class="engagement-notes"
          rows={10}
          value={workspace.notes || ''}
          onInput={(e) => persist({ ...workspace, notes: e.target.value })}
          placeholder="Synthèse: éléments confirmés, signaux faibles, hypothèses, contre-vérifications à lancer..."
        />
      </section>
      {reportPreview && (
        <section class="room-section">
          <h3>Aperçu rapport OSINT (Markdown)</h3>
          <textarea class="engagement-notes" rows={14} value={reportPreview} onInput={(e) => setReportPreview(e.target.value)} />
          <div class="engagement-form" style="margin-top:0.5rem">
            <button type="button" class="topbar-btn" onClick={() => navigator.clipboard?.writeText(reportPreview)}>Copier rapport</button>
            <button type="button" class="btn btn-primary" onClick={() => downloadText(`rapport-osint-${Date.now()}.md`, reportPreview, 'text/markdown;charset=utf-8')}>Télécharger .md</button>
          </div>
        </section>
      )}
    </div>
  );
}
