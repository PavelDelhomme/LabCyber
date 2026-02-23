// Tests E2E – Interconnexion lab / scénario / terminal / cibles / simulateur / proxy / capture / API
const { test, expect } = require('@playwright/test');

test.describe('Interconnexion – Lab et Terminal', () => {
  test('depuis Accueil ouvrir terminal puis vérifier panneau', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /ouvrir/i }).first().click();
    await page.waitForTimeout(400);
    await page.locator('button.open-in-page-item').filter({ hasText: /terminal.*panneau/i }).first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.terminal-side-panel-header').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Interconnexion – Scénario et Terminal', () => {
  test('démarrer scénario puis ouvrir terminal depuis barre', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: /préparer|démarrer|ouvrir/i }).first().click();
    await page.waitForTimeout(1500);
    await page.locator('.scenario-bar-section-terminal button').first().click();
    await page.waitForTimeout(1500);
    await expect(page.locator('.terminal-side-panel-header').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Interconnexion – Scénario et Cibles', () => {
  test('vue scénario affiche lien vers cible (DVWA)', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1200);
    const link = page.locator('a[href*="cible"], a[href*="dvwa"]').first();
    await expect(link).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Interconnexion – Labs et Simulateur', () => {
  test('depuis Labs cliquer sur carte Simulateur ouvre vue simulateur', async ({ page }) => {
    await page.goto('/#/labs');
    await page.waitForTimeout(800);
    await page.locator('.card').filter({ hasText: /simulateur/i }).first().click();
    await page.waitForTimeout(1200);
    const view = page.locator('#view-network-sim, .network-sim-canvas').first();
    await expect(view).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Interconnexion – Labs et Capture', () => {
  test('depuis Labs lien vers Capture présent', async ({ page }) => {
    await page.goto('/#/labs');
    await page.waitForTimeout(600);
    const card = page.locator('.card, a').filter({ hasText: /capture|pcap/i }).first();
    await expect(card).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Interconnexion – Labs et Proxy', () => {
  test('depuis Labs lien vers Proxy config présent', async ({ page }) => {
    await page.goto('/#/labs');
    await page.waitForTimeout(600);
    const card = page.locator('.card, a').filter({ hasText: /proxy/i }).first();
    await expect(card).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Interconnexion – Labs et API client', () => {
  test('depuis Labs lien vers Requêtes API présent', async ({ page }) => {
    await page.goto('/#/labs');
    await page.waitForTimeout(600);
    const card = page.locator('.card, a').filter({ hasText: /api|requête|postman/i }).first();
    await expect(card).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Interconnexion – Sidebar vers chaque vue', () => {
  const routes = [
    { click: /accueil/i, hash: '#/', selector: '#view-dashboard' },
    { click: /doc\.|documentation/i, hash: '#/docs', selector: '#view-docs' },
    { click: /cours|learning/i, hash: '#/learning', selector: '#view-learning' },
    { click: /cible|engagement/i, hash: '#/engagements', selector: '#view-engagements' },
    { click: /progression/i, hash: '#/progression', selector: '#view-progression' },
    { click: /lab|gérer/i, hash: '#/labs', selector: '#view-labs' },
    { click: /simulateur/i, hash: '#/network-sim', selector: '#view-network-sim' },
    { click: /proxy/i, hash: '#/proxy-config', selector: '.view' },
    { click: /requête|api/i, hash: '#/api-client', selector: '.view' },
    { click: /capture/i, hash: '#/capture', selector: '#view-capture' },
    { click: /option/i, hash: '#/options', selector: '.view' },
  ];

  for (const r of routes) {
    test(`sidebar clic ${r.click.source} mène à la vue`, async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(500);
      await page.getByRole('button', { name: r.click }).or(page.getByRole('link', { name: r.click })).first().click();
      await page.waitForTimeout(1000);
      const view = page.locator(r.selector).first();
      await expect(view).toBeVisible({ timeout: 8000 });
    });
  }
});

test.describe('Interconnexion – Topbar Ouvrir vers outils', () => {
  test('menu Ouvrir contient Capture pcap', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /ouvrir/i }).first().click();
    await page.waitForTimeout(400);
    await expect(page.locator('.open-in-page-item').filter({ hasText: /capture|pcap/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('menu Ouvrir contient Simulateur réseau', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /ouvrir/i }).first().click();
    await page.waitForTimeout(400);
    await expect(page.locator('.open-in-page-item').filter({ hasText: /simulateur/i }).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Interconnexion – Progression et scénarios', () => {
  test('vue Progression affiche scénarios ou statuts', async ({ page }) => {
    await page.goto('/#/progression');
    await page.waitForTimeout(800);
    const content = await page.locator('main').textContent();
    expect(content).toMatch(/progression|scénario|tâche|statut/i);
  });
});

test.describe('Interconnexion – Docs et Learning', () => {
  test('vue Learning lien vers doc ou thème', async ({ page }) => {
    await page.goto('/#/learning');
    await page.waitForTimeout(800);
    const link = page.locator('a, button').filter({ hasText: /ouvrir|thème|topic/i }).first();
    await expect(link).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Interconnexion – Cibles et bureau', () => {
  test('Engagements ou Dashboard lien bureau visible', async ({ page }) => {
    await page.goto('/#/engagements');
    await page.waitForTimeout(600);
    const desk = page.locator('a[href*="desktop"]').first();
    await expect(desk).toBeVisible({ timeout: 8000 });
  });
});
