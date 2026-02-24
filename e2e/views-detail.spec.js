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
    const t = page.getByRole('button', { name: /terminal/i }).or(page.locator('a[href*="terminal"]')).first();
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
});

test.describe('Proxy config – éléments', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/#/proxy-config'); });

  test('champ URL proxy ou config visible', async ({ page }) => {
    const input = page.locator('input[type="url"], input[name*="proxy"], input[placeholder*="proxy"]').first();
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
    expect(body).toMatch(/doc|bibliothèque|source|offline/i);
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
    await expect(page.getByRole('button', { name: /journal/i }).first()).toBeVisible({ timeout: 6000 });
  });
});
