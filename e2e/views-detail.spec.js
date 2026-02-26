// Tests E2E – Détail de chaque vue (éléments, boutons, liens)
const { test, expect } = require('@playwright/test');

const VIEWS = [
  { hash: '/#/', name: 'Accueil', selectors: ['#view-dashboard', '.main'], texts: ['Bienvenue', 'Scénario', 'Lab'] },
  { hash: '/#/learning', name: 'Learning', selectors: ['#view-learning', '.view'], texts: ['cours', 'topic', 'thème', 'Learning'] },
  { hash: '/#/docs', name: 'Docs', selectors: ['#view-docs'], texts: ['Documentation', 'doc'] },
  { hash: '/#/engagements', name: 'Engagements', selectors: ['#view-engagements'], texts: ['Cible', 'Proxy', 'engagement'] },
  { hash: '/#/progression', name: 'Progression', selectors: ['#view-progression'], texts: ['progression', 'scénario', 'tâche'] },
  { hash: '/#/labs', name: 'Labs', selectors: ['#view-labs'], texts: ['Lab', 'gérer'] },
  { hash: '/#/capture', name: 'Capture', selectors: ['#view-capture'], texts: ['pcap', 'capture', 'fichier'] },
  { hash: '/#/network-sim', name: 'Simulateur', selectors: ['#view-network-sim'], texts: ['réseau', 'carte', 'topolog'] },
  { hash: '/#/proxy-config', name: 'Proxy', selectors: ['.view'], texts: ['proxy', 'squid', 'config'] },
  { hash: '/#/api-client', name: 'API client', selectors: ['.view'], texts: ['api', 'requête', 'GET', 'POST'] },
  { hash: '/#/options', name: 'Options', selectors: ['.view'], texts: ['option', 'paramètre'] },
];

test.describe('Vues – chargement et contenu principal', () => {
  for (const view of VIEWS) {
    test(`${view.name} : page charge (hash ${view.hash})`, async ({ page }) => {
      await page.goto(view.hash);
      await page.waitForTimeout(800);
      const main = page.locator('main').first();
      await expect(main).toBeVisible({ timeout: 10000 });
    });

    test(`${view.name} : contenu texte attendu présent`, async ({ page }) => {
      await page.goto(view.hash);
      await page.waitForTimeout(800);
      const bodyText = await page.locator('body').textContent();
      const found = view.texts.some(t => bodyText.toLowerCase().includes(t.toLowerCase()));
      expect(found).toBeTruthy();
    });

    test(`${view.name} : au moins un sélecteur de vue visible`, async ({ page }) => {
      await page.goto(view.hash);
      await page.waitForTimeout(800);
      let visible = false;
      for (const sel of view.selectors) {
        if (await page.locator(sel).first().isVisible().catch(() => false)) { visible = true; break; }
      }
      expect(visible).toBeTruthy();
    });
  }
});

test.describe('Dashboard – éléments spécifiques', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('cartes scénarios ou rooms visibles', async ({ page }) => {
    const cards = page.locator('.card, .scenario-card, .room-card').first();
    await expect(cards).toBeVisible({ timeout: 8000 });
  });

  test('lien ou bouton Terminal visible', async ({ page }) => {
    const t = page.locator('button[title*="Terminal"]').or(page.getByRole('button', { name: /terminal/i })).or(page.locator('a[href*="terminal"]')).first();
    await expect(t).toBeVisible({ timeout: 8000 });
  });

  test('lien bureau noVNC visible', async ({ page }) => {
    const d = page.locator('a[href*="desktop"]').first();
    await expect(d).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Learning – éléments', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/learning'); });

  test('liste thèmes ou catégories visible', async ({ page }) => {
    await page.waitForTimeout(600);
    const list = page.locator('.learning-topic, .topic-list, [class*="learning"]').first();
    await expect(list).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Engagements (Cibles & Proxy) – éléments', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/engagements'); });

  test('lien cible DVWA ou liste cibles', async ({ page }) => {
    const link = page.locator('a[href*="cible"], a[href*="dvwa"], .target-card').first();
    await expect(link).toBeVisible({ timeout: 8000 });
  });

  test('section proxy ou config visible', async ({ page }) => {
    const body = await page.locator('main').textContent();
    expect(body.toLowerCase()).toMatch(/proxy|cible|engagement/);
  });
});

test.describe('Progression – éléments', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/progression'); });

  test('contenu progression ou scénarios visible', async ({ page }) => {
    await page.waitForTimeout(800);
    const content = await page.locator('main').textContent();
    expect(content).toMatch(/progression|scénario|tâche|statut/i);
  });

  test('liste scénarios ou cartes ou section visible', async ({ page }) => {
    await page.waitForTimeout(800);
    const list = page.locator('.card, .scenario-card, .room-section, [class*="progression"]').first();
    await expect(list).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Labs – éléments', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/labs'); });

  test('lab par défaut ou liste labs visible', async ({ page }) => {
    const lab = page.locator('.labs-grid, .lab-card, [class*="lab"]').first();
    await expect(lab).toBeVisible({ timeout: 8000 });
  });

  test('lien Ouvrir le terminal présent', async ({ page }) => {
    const t = page.locator('a[href*="terminal"]').first();
    await expect(t).toBeVisible({ timeout: 8000 });
  });

  test('lien Ouvrir le bureau présent', async ({ page }) => {
    const d = page.locator('a[href*="desktop"]').first();
    await expect(d).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Capture pcap – éléments', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/capture'); });

  test('zone upload ou fichier pcap', async ({ page }) => {
    const zone = page.locator('input[type="file"], .capture-upload, [class*="pcap"]').first();
    await expect(zone).toBeVisible({ timeout: 8000 });
  });

  test('champ filtre ou texte Wireshark-like présent', async ({ page }) => {
    const body = await page.locator('main').textContent();
    expect(body).toMatch(/filtre|paquet|pcap|wireshark|charger/i);
  });

  test('section liste paquets ou détail visible après chargement (ou message explicatif)', async ({ page }) => {
    const section = page.locator('.capture-upload, .room-section, [class*="capture"]').first();
    await expect(section).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Simulateur réseau – éléments', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/network-sim'); });

  test('canvas ou zone dessin visible', async ({ page }) => {
    const canvas = page.locator('.network-sim-canvas, .network-sim-canvas-wrap, svg').first();
    await expect(canvas).toBeVisible({ timeout: 8000 });
  });

  test('bouton Ajouter ou toolbar visible', async ({ page }) => {
    const toolbar = page.locator('.network-sim-toolbar, [class*="toolbar"]').first();
    await expect(toolbar).toBeVisible({ timeout: 8000 });
  });

  test('UI Bâtiments / Zones présente', async ({ page }) => {
    await page.locator('#view-network-sim').waitFor({ state: 'visible', timeout: 8000 });
    const buildingsSection = page.getByTestId('sim-buildings');
    await buildingsSection.scrollIntoViewIfNeeded().catch(() => {});
    await expect(buildingsSection).toBeVisible({ timeout: 8000 });
  });

  test('boutons types appareils étendus (Pare-feu, Point d’accès, Cloud) présents', async ({ page }) => {
    await page.locator('#view-network-sim').waitFor({ state: 'visible', timeout: 8000 });
    const toolbar = page.getByTestId('sim-toolbar-devices');
    await toolbar.scrollIntoViewIfNeeded().catch(() => {});
    const deviceRow = page.getByTestId('sim-toolbar-device-buttons');
    await deviceRow.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(400);
    const firewall = page.getByTestId('sim-btn-firewall').or(page.getByRole('button', { name: /Pare-feu|Firewall/i }));
    const ap = page.getByTestId('sim-btn-ap').or(page.getByRole('button', { name: /Point d'accès|AP|WiFi/i }));
    const cloud = page.getByTestId('sim-btn-cloud').or(page.getByRole('button', { name: /Cloud/i }));
    await expect(firewall.first()).toBeVisible({ timeout: 8000 });
    await expect(ap.first()).toBeVisible({ timeout: 8000 });
    await expect(cloud.first()).toBeVisible({ timeout: 8000 });
  });

  test('boutons Routeur et Switch (commutateur) présents pour config L2/L3', async ({ page }) => {
    const routerBtn = page.getByRole('button', { name: /Routeur/i }).first();
    const switchBtn = page.getByRole('button', { name: /Switch|Commutateur/i }).first();
    await expect(routerBtn).toBeVisible({ timeout: 8000 });
    await expect(switchBtn).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Proxy config – éléments', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/proxy-config'); });

  test('champ proxy ou config visible', async ({ page }) => {
    const input = page.locator('.proxy-config-form input').first();
    await expect(input).toBeVisible({ timeout: 8000 });
  });
});

test.describe('API client (Postman) – éléments', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/api-client'); });

  test('champ URL ou méthode visible', async ({ page }) => {
    const methodOrUrl = page.locator('select, input[placeholder*="URL"], input[name*="url"]').first();
    await expect(methodOrUrl).toBeVisible({ timeout: 8000 });
  });

  test('bouton Envoyer visible', async ({ page }) => {
    const sendBtn = page.getByRole('button', { name: /envoyer|send/i }).first();
    await expect(sendBtn).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Bibliothèque doc (doc-offline) – éléments', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/doc-offline'); });

  test('vue Bibliothèque charge', async ({ page }) => {
    await page.waitForTimeout(800);
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 10000 });
  });

  test('contenu doc ou bibliothèque ou source présent', async ({ page }) => {
    await page.waitForTimeout(800);
    const body = await page.locator('body').textContent();
    expect(body).toMatch(/doc|bibliothèque|source|offline|OWASP|Cybersécurité/i);
  });

  test('catégories ou liste de sources visibles', async ({ page }) => {
    await page.waitForTimeout(1000);
    const catOrList = page.locator('.doc-offline-category, .doc-offline-item, .doc-offline-list').first();
    await expect(catOrList).toBeVisible({ timeout: 6000 });
  });
});

test.describe('Options – éléments', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/options'); });

  test('au moins une option ou case à cocher', async ({ page }) => {
    const opt = page.locator('input[type="checkbox"], .option-item, [class*="option"]').first();
    await expect(opt).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Sidebar – tous les liens de navigation', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  const navItems = [
    { name: /accueil|dashboard/i },
    { name: /scénario/i },
    { name: /lab|gérer/i },
    { name: /simulateur/i },
    { name: /proxy/i },
    { name: /requête|api/i },
    { name: /capture/i },
    { name: /doc\.|documentation/i },
    { name: /cours|learning/i },
    { name: /cible|engagement/i },
    { name: /progression/i },
    { name: /option/i },
  ];

  for (const item of navItems) {
    test(`sidebar contient lien ${item.name.source}`, async ({ page }) => {
      const link = page.getByRole('button', item).or(page.getByRole('link', item)).first();
      await expect(link).toBeVisible({ timeout: 8000 });
    });
  }
});

test.describe('Topbar – boutons', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('bouton Ouvrir (dropdown) visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /ouvrir/i }).first()).toBeVisible({ timeout: 6000 });
  });

  test('bouton Terminal (⌨) visible', async ({ page }) => {
    await expect(page.locator('button[title*="Terminal"]').first()).toBeVisible({ timeout: 6000 });
  });

  test('bouton Options (⚙️) visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /option/i }).first()).toBeVisible({ timeout: 6000 });
  });

  test('bouton CVE visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /cve/i }).first()).toBeVisible({ timeout: 6000 });
  });

  test('bouton Journal (📋) visible', async ({ page }) => {
    const journalBtn = page.locator('button[title*="Journal"]').or(page.getByRole('button', { name: /journal|stats/i })).first();
    await expect(journalBtn).toBeVisible({ timeout: 6000 });
  });
});

// --- Parcours fonctionnels : Doc/Cours, Capture, Simulateur, API, Proxy ---
test.describe('Parcours – Doc & Cours (Learning)', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/learning'); });

  test('liste thèmes ou catégories cliquable', async ({ page }) => {
    await page.waitForTimeout(1000);
    const link = page.locator('a, button').filter({ hasText: /thème|topic|OWASP|système/i }).first();
    await expect(link).toBeVisible({ timeout: 8000 });
  });

  test('contenu Doc ou Cours présent', async ({ page }) => {
    await page.waitForTimeout(800);
    const body = await page.locator('main').textContent();
    expect(body).toMatch(/cours|doc|learning|thème|topic/i);
  });
});

test.describe('Parcours – Documentation projet (Docs)', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/docs'); });

  test('contenu documentation ou liens présents', async ({ page }) => {
    await page.waitForTimeout(800);
    const body = await page.locator('main').textContent();
    expect(body).toMatch(/documentation|doc|projet|roadmap/i);
  });

  test('liste des entrées docs (index, usage, tests) cliquables', async ({ page }) => {
    await page.waitForTimeout(800);
    await page.locator('#view-docs').waitFor({ state: 'visible', timeout: 6000 });
    const entries = page.locator('#docs-list button.docs-list-btn, .docs-list button');
    await expect(entries.first()).toBeVisible({ timeout: 6000 });
  });
});

test.describe('Parcours – Capture pcap (Wireshark-like)', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/capture'); });

  test('zone ou bouton choisir fichier .pcap présente', async ({ page }) => {
    const label = page.locator('label').filter({ hasText: /choisir.*fichier|pcap/i }).first();
    const input = page.locator('input[type="file"][accept*="pcap"], input[type="file"][accept*="cap"]').first();
    const hasLabel = await label.isVisible().catch(() => false);
    const inputCount = await input.count();
    expect(hasLabel || inputCount >= 1).toBeTruthy();
  });

  test('texte explicatif capture machine client présent', async ({ page }) => {
    const body = await page.locator('main').textContent();
    expect(body).toMatch(/wireshark|tcpdump|pcap|charger|machine/i);
  });
});

test.describe('Parcours – Simulateur réseau', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/network-sim'); });

  test('zone carte ou canvas visible', async ({ page }) => {
    const canvas = page.locator('.network-sim-canvas, .network-sim-canvas-wrap, canvas, svg').first();
    await expect(canvas).toBeVisible({ timeout: 8000 });
  });

  test('toolbar ou boutons (nouvelle carte, nœud) présents', async ({ page }) => {
    const toolbar = page.locator('.network-sim-toolbar, [class*="toolbar"], button').first();
    await expect(toolbar).toBeVisible({ timeout: 8000 });
  });

  test('sélecteur de carte et Nouvelle carte visibles', async ({ page }) => {
    const newCardBtn = page.getByRole('button', { name: /Nouvelle carte/i }).first();
    const mapSelect = page.locator('.network-sim-maps select').first();
    await expect(newCardBtn).toBeVisible({ timeout: 8000 });
    await expect(mapSelect).toBeVisible({ timeout: 8000 });
  });

  test('sélecteur Bâtiments ou Nouveau bâtiment permet de gérer les zones', async ({ page }) => {
    await page.locator('#view-network-sim').waitFor({ state: 'visible', timeout: 8000 });
    const buildingsSection = page.getByTestId('sim-buildings');
    await buildingsSection.scrollIntoViewIfNeeded().catch(() => {});
    await expect(buildingsSection).toBeVisible({ timeout: 8000 });
  });

  test('bouton Relier (liaison entre appareils) visible', async ({ page }) => {
    const linkBtn = page.getByRole('button', { name: /Relier|liaison/i }).first();
    await expect(linkBtn).toBeVisible({ timeout: 8000 });
  });

  test('après placement et sélection d’un appareil, panneau Configuration avec Type d’appareil et Nom', async ({ page }) => {
    await page.locator('#view-network-sim').waitFor({ state: 'visible', timeout: 8000 });
    const newCardBtn = page.getByRole('button', { name: /Nouvelle carte/i }).first();
    if (await newCardBtn.isVisible()) await newCardBtn.click();
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: /^PC$/i }).first().click();
    await page.waitForTimeout(500);
    const svg = page.locator('.network-sim-canvas').first();
    await expect(svg).toBeVisible({ timeout: 5000 });
    await svg.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await svg.click({ position: { x: 200, y: 260 } });
    const node = page.locator('[data-node-id]').first();
    await expect(node).toBeVisible({ timeout: 8000 });
    await node.click({ force: true });
    await page.waitForTimeout(400);
    await node.evaluate((el) => {
      if (typeof el.click === 'function') el.click();
      else el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await page.waitForTimeout(600);
    const panel = page.locator('.network-sim-config-panel');
    await expect(panel).toBeVisible({ timeout: 6000 });
    const panelText = await panel.textContent();
    expect(panelText).toMatch(/Type d'appareil|Nom|Configuration|Informations|Appareil/i);
  });
});

test.describe('Parcours – Requêtes API (Postman-like)', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/api-client'); });

  test('sélecteur méthode GET visible', async ({ page }) => {
    const method = page.locator('select').first();
    await expect(method).toBeVisible({ timeout: 6000 });
  });

  test('champ URL et bouton Envoyer permettent une requête', async ({ page }) => {
    const urlInput = page.locator('input.proxy-tools-url, input[type="url"]').first();
    const sendBtn = page.getByRole('button', { name: /envoyer/i }).first();
    await expect(urlInput).toBeVisible({ timeout: 6000 });
    await expect(sendBtn).toBeVisible({ timeout: 6000 });
  });
});

test.describe('Parcours – Config Proxy', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/proxy-config'); });

  test('champ proxy ou config visible', async ({ page }) => {
    const input = page.locator('.proxy-config-form input').first();
    await expect(input).toBeVisible({ timeout: 8000 });
  });

  test('contenu proxy ou squid présent', async ({ page }) => {
    await page.locator('#view-proxy-config').waitFor({ state: 'visible', timeout: 8000 });
    const body = await page.locator('#view-proxy-config').textContent();
    expect(body.toLowerCase()).toMatch(/proxy|squid|config/i);
  });
});
