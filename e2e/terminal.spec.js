// Tests E2E – Terminal (panneau, onglets, PiP, reload, lab défaut/actif)
const { test, expect } = require('@playwright/test');

function openTerminalPanel(page) {
  return page.getByRole('button', { name: /ouvrir/i }).first().click()
    .then(() => page.waitForTimeout(600))
    .then(() => page.locator('button.open-in-page-item').filter({ hasText: /terminal.*panneau|panneau/i }).first().click())
    .then(() => page.waitForTimeout(1500));
}

test.describe('Terminal – panneau', () => {
  test('ouvrir panneau terminal via menu Ouvrir', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    await expect(page.locator('.terminal-side-panel-header h3, .terminal-side-panel-header, .terminal-side-panel-resize-handle').first()).toBeVisible({ timeout: 18000 });
  });

  test('panneau affiche header Terminal web', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    await expect(page.locator('.terminal-side-panel-header h3, .terminal-side-panel-header').first()).toBeVisible({ timeout: 18000 });
  });

  test('panneau contient bouton Réduire', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    const minimize = page.locator('.terminal-side-panel-minimize').first();
    await expect(minimize).toBeVisible({ timeout: 15000 });
  });

  test('panneau contient bouton Fermer', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    const close = page.locator('.terminal-side-panel-close').first();
    await expect(close).toBeVisible({ timeout: 15000 });
  });

  test('panneau contient au moins un onglet session', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    const tab = page.locator('.terminal-tab-btn, .terminal-tab-pane').first();
    await expect(tab).toBeVisible({ timeout: 15000 });
  });

  test('panneau contient bouton Nouvel onglet (+)', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    const add = page.locator('.terminal-tab-add, button[title*="Nouvel onglet"]').first();
    await expect(add).toBeVisible({ timeout: 15000 });
  });

  test('fermer panneau masque le contenu', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    await page.locator('.terminal-side-panel-close').first().click();
    await page.waitForTimeout(800);
    const hidden = page.locator('.terminal-side-panel-hidden');
    await expect(hidden).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Terminal – iframe', () => {
  test('panneau contient iframe terminal', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    const iframe = page.locator('.terminal-side-panel-iframe, iframe[title]').first();
    await expect(iframe).toBeVisible({ timeout: 18000 });
  });
});

test.describe('Terminal – choix Lab défaut / Lab actif', () => {
  test('sans scénario actif, panneau peut afficher Lab défaut', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    const labChoice = page.locator('.terminal-lab-choice, .terminal-lab-choice-btn').first();
    await expect(labChoice).toBeVisible({ timeout: 18000 });
  });
});

test.describe('Terminal – menu Ouvrir contient Terminal (panneau) et PiP', () => {
  test('menu Ouvrir contient option Terminal (panneau)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /ouvrir/i }).first().click();
    await page.waitForTimeout(400);
    await expect(page.locator('button.open-in-page-item').filter({ hasText: /terminal.*panneau/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('menu Ouvrir contient option Terminal (PiP) ou Capture', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /ouvrir/i }).first().click();
    await page.waitForTimeout(400);
    const menu = await page.locator('.open-in-page-menu').textContent();
    expect(menu).toMatch(/terminal|panneau|pip|capture/i);
  });
});

test.describe('Terminal – lien nouvel onglet', () => {
  test('bouton ⌨ ouvre terminal en nouvel onglet (présent)', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('button[title*="Terminal"]').first();
    await expect(btn).toBeVisible({ timeout: 6000 });
  });
});

test.describe('Terminal – depuis vue Labs', () => {
  test('vue Labs contient lien Ouvrir le terminal', async ({ page }) => {
    await page.goto('/#/labs');
    await page.waitForTimeout(600);
    const link = page.locator('a[href*="terminal"]').first();
    await expect(link).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Terminal – depuis barre scénario', () => {
  test('après démarrage scénario, barre a bouton Terminal', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /démarrer le scénario/i }).first().click();
    await page.waitForTimeout(2000);
    const term = page.locator('button.scenario-bar-section-terminal').first();
    await expect(term).toBeVisible({ timeout: 10000 });
  });
});
