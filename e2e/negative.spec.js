// Tests E2E – Comportements qui ne doivent PAS se produire (régression, sécurité)
const { test, expect } = require('@playwright/test');

test.describe('Negative – routes et hash invalides', () => {
  test('hash vide ou / affiche accueil (pas erreur)', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForTimeout(1000);
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 5000 });
    const title = await page.title();
    expect(title).toMatch(/Lab|Cyber/i);
  });

  test('hash inconnu /#/vue-inexistante affiche dashboard ou main', async ({ page }) => {
    await page.goto('/#/vue-inexistante-xyz');
    await page.waitForTimeout(1500);
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 5000 });
  });

  test('hash scénario inexistant ne fait pas crasher la page', async ({ page }) => {
    await page.goto('/#/scenario/id-qui-nexiste-pas');
    await page.waitForTimeout(1500);
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 5000 });
  });

  test('double slash hash ne casse pas la navigation', async ({ page }) => {
    await page.goto('/#//learning');
    await page.waitForTimeout(1000);
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Negative – HTTP (réponses attendues)', () => {
  test('GET / renvoie 200 (pas 500)', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
  });

  test('GET /data/rooms.json renvoie 200', async ({ request }) => {
    const res = await request.get('/data/rooms.json');
    expect(res.status()).toBe(200);
  });

  test('GET /cible/dvwa/ renvoie 200 ou 302 (pas 500)', async ({ request }) => {
    const res = await request.get('/cible/dvwa/');
    expect([200, 302]).toContain(res.status());
  });

  test('GET /desktop renvoie 302 ou 200 (pas 500)', async ({ request }) => {
    const res = await request.get('/desktop');
    expect([200, 302]).toContain(res.status());
  });
});

test.describe('Negative – UI : éléments qui ne doivent pas être visibles sans action', () => {
  test('sans ouvrir le terminal, panneau terminal masqué ou pas dans le DOM', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const panelOpen = page.locator('.terminal-side-panel:not(.terminal-side-panel-hidden)');
    await expect(panelOpen).toHaveCount(0);
  });

  test('sans démarrer de scénario, barre scénario absente', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const bar = page.locator('.scenario-bottom-bar');
    await expect(bar).toHaveCount(0);
  });

  test('sur dashboard, vue scénario (view-scenario) pas active', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const scenarioView = page.locator('#view-scenario.view.active');
    await expect(scenarioView).toHaveCount(0);
  });
});

test.describe('Negative – pas de script error visible', () => {
  test('page accueil charge sans erreur console bloquante', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(errors.length).toBe(0);
  });

  test('navigation vers Learning sans erreur console', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/#/learning');
    await page.waitForTimeout(1500);
    expect(errors.length).toBe(0);
  });
});

test.describe('Negative – contenu sensible non exposé', () => {
  test('body ne contient pas de mot de passe en clair (alpine, root)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const text = await page.locator('body').textContent();
    expect(text).not.toMatch(/\b(alpine|root)\s*:\s*\S{3,}/i);
  });
});

test.describe('Negative – accessibilité basique', () => {
  test('main a un rôle ou contenu', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 5000 });
    const content = await main.textContent();
    expect(content.length).toBeGreaterThan(50);
  });

  test('au moins un lien ou bouton focusable', async ({ page }) => {
    await page.goto('/');
    const focusable = page.locator('a[href], button').first();
    await expect(focusable).toBeVisible({ timeout: 5000 });
  });
});
