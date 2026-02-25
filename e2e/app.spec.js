// Tests E2E – Lab Cyber
// Lancés uniquement via : make test-e2e (conteneur Docker, lab doit être up)
const { test, expect } = require('@playwright/test');

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page charge et affiche la plateforme', async ({ page }) => {
    await expect(page).toHaveTitle(/Lab|Cyber/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('accueil ou dashboard visible', async ({ page }) => {
    const mainOrDashboard = page.locator('main').or(page.locator('#view-dashboard, .view-dashboard, [class*="dashboard"]')).first();
    await expect(mainOrDashboard).toBeVisible({ timeout: 15000 });
  });

  test('sidebar ou navigation présente', async ({ page }) => {
    const nav = page.locator('nav, .sidebar, [class*="sidebar"], aside').first();
    await expect(nav).toBeVisible({ timeout: 10000 });
  });

  test('lien ou bouton Scénarios présent', async ({ page }) => {
    const scenarioLink = page.getByRole('link', { name: /scénario/i }).or(
      page.getByText(/scénario/i).first()
    );
    await expect(scenarioLink.first()).toBeVisible({ timeout: 10000 });
  });

  test('navigation vers un scénario (hash)', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1500);
    const viewScenario = page.locator('#view-scenario, .view-scenario-with-terminal').first();
    await expect(viewScenario).toBeVisible({ timeout: 10000 });
  });

  test('bouton Démarrer ou Ouvrir le terminal en vue scénario', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1500);
    const startBtn = page.getByRole('button', { name: /démarrer|ouvrir le terminal|préparer/i }).first();
    await expect(startBtn).toBeVisible({ timeout: 10000 });
  });

  test('données chargées (rooms ou scénarios)', async ({ page }) => {
    await page.waitForTimeout(2000);
    const hasContent = await page.evaluate(() => {
      const text = (document.body && document.body.innerText) ? document.body.innerText : '';
      const lower = text.toLowerCase();
      return lower.includes('scénario') || lower.includes('room') || text.length > 400;
    });
    expect(hasContent).toBeTruthy();
  });
});

test.describe('Terminal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('bouton ou lien terminal présent', async ({ page }) => {
    // Topbar : bouton ⌨ title="Terminal (nouvel onglet)" ; ou lien "Ouvrir le terminal" dans la vue Lab
    const terminalBtn = page.getByRole('button', { name: /terminal/i }).or(
      page.locator('button[title*="Terminal"], a[href*="terminal"]')
    ).first();
    await expect(terminalBtn).toBeVisible({ timeout: 10000 });
  });

  test('ouvrir le panneau terminal', async ({ page }) => {
    // Ouvrir le menu "Ouvrir" puis cliquer "Terminal (panneau)"
    await page.getByRole('button', { name: /ouvrir/i }).first().click();
    await page.waitForTimeout(400);
    const terminalPanneau = page.locator('button.open-in-page-item', { hasText: /terminal.*panneau|panneau/i }).or(
      page.getByRole('button', { name: /terminal.*panneau/i })
    ).first();
    await terminalPanneau.click();
    // Le panneau n'est rendu qu'après terminalPanelEverOpened ; vérifier le header ou la poignée de redimensionnement
    const panelHeader = page.locator('.terminal-side-panel-header h3, .terminal-side-panel-resize-handle').first();
    await expect(panelHeader).toBeVisible({ timeout: 10000 });
  });
});

// Vues listées dans STATUS.md « à tester à la main » : Learning, Docs, Capture, Simulateur, Proxy, API, Progression, Cibles, etc.
test.describe('Vues et parcours', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('vue Doc & Cours (Learning) charge', async ({ page }) => {
    await page.goto('/#/learning');
    await page.waitForTimeout(800);
    const view = page.locator('#view-learning, .view').filter({ hasText: /cours|learning|topic|thème/i }).first();
    await expect(view).toBeVisible({ timeout: 10000 });
  });

  test('vue Documentation projet (Docs) charge', async ({ page }) => {
    await page.goto('/#/docs');
    await page.waitForTimeout(800);
    const view = page.locator('#view-docs, [class*="docs"]').first();
    await expect(view).toBeVisible({ timeout: 10000 });
  });

  test('vue Cibles & Proxy (Engagements) charge', async ({ page }) => {
    await page.goto('/#/engagements');
    await page.waitForTimeout(800);
    const view = page.locator('#view-engagements, .view').filter({ hasText: /cible|proxy|engagement/i }).first();
    await expect(view).toBeVisible({ timeout: 10000 });
  });

  test('vue Progression charge', async ({ page }) => {
    await page.goto('/#/progression');
    await page.waitForTimeout(800);
    const view = page.locator('#view-progression, .view').filter({ hasText: /progression|scénario|tâche/i }).first();
    await expect(view).toBeVisible({ timeout: 10000 });
  });

  test('vue Labs charge', async ({ page }) => {
    await page.goto('/#/labs');
    await page.waitForTimeout(800);
    const view = page.locator('#view-labs, .view').filter({ hasText: /lab|gérer/i }).first();
    await expect(view).toBeVisible({ timeout: 10000 });
  });

  test('vue Capture pcap charge', async ({ page }) => {
    await page.goto('/#/capture');
    await page.waitForTimeout(800);
    const view = page.locator('#view-capture, .view').filter({ hasText: /pcap|capture|fichier/i }).first();
    await expect(view).toBeVisible({ timeout: 10000 });
  });

  test('vue Simulateur réseau charge', async ({ page }) => {
    await page.goto('/#/network-sim');
    await page.waitForTimeout(800);
    const view = page.locator('#view-network-sim, .network-sim-canvas-wrap, .network-sim-toolbar').first();
    await expect(view).toBeVisible({ timeout: 10000 });
  });

  test('vue Proxy (config) charge', async ({ page }) => {
    await page.goto('/#/proxy-config');
    await page.waitForTimeout(800);
    const view = page.locator('.view').filter({ hasText: /proxy|squid|config/i }).first();
    await expect(view).toBeVisible({ timeout: 10000 });
  });

  test('vue Requêtes API (Postman) charge', async ({ page }) => {
    await page.goto('/#/api-client');
    await page.waitForTimeout(800);
    const view = page.locator('.view').filter({ hasText: /api|requête|get|post/i }).first();
    await expect(view).toBeVisible({ timeout: 10000 });
  });

  test('vue Options charge', async ({ page }) => {
    await page.goto('/#/options');
    await page.waitForTimeout(800);
    const view = page.locator('.view').filter({ hasText: /option|paramètre|préférence/i }).first();
    await expect(view).toBeVisible({ timeout: 10000 });
  });

  test('bouton CVE présent (recherche CVE)', async ({ page }) => {
    const cveBtn = page.getByRole('button', { name: /cve|rechercher un cve/i }).first();
    await expect(cveBtn).toBeVisible({ timeout: 8000 });
  });
});

// Barre scénario, cibles navigateur, bureau VNC (STATUS.md)
test.describe('Barre scénario et cibles', () => {
  test('barre scénario visible après démarrage scénario', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1500);
    const startBtn = page.getByRole('button', { name: /démarrer|ouvrir le terminal|préparer/i }).first();
    await startBtn.click();
    await page.waitForTimeout(1500);
    const bar = page.locator('.scenario-bottom-bar, .scenario-bar').first();
    await expect(bar).toBeVisible({ timeout: 8000 });
  });

  test('lien cible DVWA présent ou page cible charge', async ({ page }) => {
    await page.goto('/#/engagements');
    await page.waitForTimeout(1000);
    const link = page.locator('a[href*="cible"], a[href*="dvwa"]').first();
    await expect(link).toBeVisible({ timeout: 8000 });
  });

  test('page cible DVWA via gateway (HTTP)', async ({ request }) => {
    const res = await request.get('/cible/dvwa/');
    expect([200, 302]).toContain(res.status());
  });

  test('lien ou bouton bureau VNC (desktop) présent', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const desktopLink = page.locator('a[href*="desktop"], button').filter({ hasText: /bureau|desktop|vnc/i }).first();
    await expect(desktopLink).toBeVisible({ timeout: 8000 });
  });
});

// Navigation par hash : chaque vue doit s'afficher
test.describe('Navigation – hash routes', () => {
  const hashRoutes = [
    ['/#/', 'main ou dashboard'],
    ['/#/learning', 'Learning'],
    ['/#/docs', 'Docs'],
    ['/#/doc-offline', 'Bibliothèque doc'],
    ['/#/engagements', 'Engagements'],
    ['/#/progression', 'Progression'],
    ['/#/labs', 'Labs'],
    ['/#/network-sim', 'Simulateur'],
    ['/#/proxy-config', 'Proxy'],
    ['/#/api-client', 'API client'],
    ['/#/capture', 'Capture'],
    ['/#/options', 'Options'],
  ];

  for (const [hash, name] of hashRoutes) {
    test(`hash ${hash} affiche ${name}`, async ({ page }) => {
      await page.goto(hash);
      await page.waitForTimeout(800);
      const main = page.locator('main').first();
      await expect(main).toBeVisible({ timeout: 10000 });
    });
  }
});

// Rapport : ce qui doit marcher (résumé)
test.describe('Rapport – vérifications globales', () => {
  test('titres de page contiennent Lab ou Cyber', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Lab|Cyber/i);
  });

  test('données JSON chargées (body contient Scénario ou Room)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const text = await page.locator('body').textContent();
    expect(text).toMatch(/Scénario|Room|Lab/i);
  });

  test('aucun élément vide critique (main non vide)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
    const len = await main.textContent().then(t => (t || '').length);
    expect(len).toBeGreaterThan(100);
  });
});
