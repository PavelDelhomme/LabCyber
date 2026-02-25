// Tests E2E – Terminal (panneau, onglets, PiP, reload, lab défaut/actif)
const { test, expect } = require('@playwright/test');

function openTerminalPanel(page) {
  return page.getByRole('button', { name: /ouvrir/i }).first().click()
    .then(() => page.waitForTimeout(600))
    .then(() => page.locator('button.open-in-page-item').filter({ hasText: /terminal.*panneau|panneau/i }).first().click())
    .then(() => page.waitForTimeout(2000));
}

// Le panneau terminal peut être considéré "hidden" par Playwright (position fixed à droite, viewport). On vérifie la présence en DOM.
function expectTerminalPanelInDom(page) {
  const panel = page.locator('.terminal-side-panel').first();
  return expect(panel).toBeAttached();
}

test.describe('Terminal – panneau', () => {
  test('ouvrir panneau terminal via menu Ouvrir', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    await expectTerminalPanelInDom(page);
    const header = page.locator('.terminal-side-panel-header, .terminal-side-panel-resize-handle').first();
    await expect(header).toBeAttached();
  });

  test('panneau affiche header Terminal web', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    await expect(page.locator('.terminal-side-panel-header').first()).toBeAttached();
  });

  test('panneau contient bouton Réduire', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    await expect(page.locator('.terminal-side-panel-minimize').first()).toBeAttached();
  });

  test('panneau contient bouton Fermer', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    await expect(page.locator('.terminal-side-panel-close').first()).toBeAttached();
  });

  test('panneau contient au moins un onglet session', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    await expect(page.locator('.terminal-tab-btn, .terminal-tab-pane').first()).toBeAttached();
  });

  test('panneau contient bouton Nouvel onglet (+)', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    await expect(page.locator('.terminal-tab-add, button[title*="Nouvel onglet"]').first()).toBeAttached();
  });

  test('fermer panneau masque le contenu', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    const closeBtn = page.locator('.terminal-side-panel-close').first();
    await closeBtn.click({ force: true });
    await page.waitForTimeout(800);
    await expect(page.locator('.terminal-side-panel-hidden').first()).toBeAttached();
  });
});

test.describe('Terminal – iframe', () => {
  test('panneau contient iframe terminal', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    await expect(page.locator('.terminal-side-panel-iframe, iframe[title]').first()).toBeAttached();
  });
});

test.describe('Terminal – choix Lab défaut / Lab actif', () => {
  test('sans scénario actif, panneau ouvert (header ou choix lab)', async ({ page }) => {
    await page.goto('/');
    await openTerminalPanel(page);
    // Lab défaut : .terminal-lab-choice peut être absent ; le header est toujours là
    const header = page.locator('.terminal-side-panel-header').first();
    await expect(header).toBeAttached();
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
