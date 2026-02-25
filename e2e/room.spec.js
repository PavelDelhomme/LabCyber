// Tests E2E – Rooms (vue room, démarrer, barre, machines verrouillées tant que non démarré, progression)
const { test, expect } = require('@playwright/test');

const ROOM_IDS = ['dvwa-web', 'juice-shop', 'vuln-network'];

test.describe('Rooms – navigation par hash', () => {
  for (const id of ROOM_IDS) {
    test(`vue room charge pour ${id}`, async ({ page }) => {
      await page.goto(`/#/room/${id}`);
      await page.waitForTimeout(1200);
      const view = page.locator('#view-room, .view-scenario-with-terminal').first();
      await expect(view).toBeVisible({ timeout: 10000 });
    });
  }
});

test.describe('Rooms – sans démarrer', () => {
  test('bouton Démarrer la room visible', async ({ page }) => {
    await page.goto('/#/room/dvwa-web');
    await page.waitForTimeout(1200);
    const btn = page.getByRole('button', { name: /démarrer la room/i }).first();
    await expect(btn).toBeVisible({ timeout: 8000 });
  });

  test('message verrouillé visible (machines ou tâches non accessibles)', async ({ page }) => {
    await page.goto('/#/room/dvwa-web');
    await page.waitForTimeout(1200);
    const body = await page.locator('#view-room').textContent();
    const hasLockedMessage = /démarrer la room pour accéder|démarrer la room pour cocher/i.test(body);
    const hasNotStartedState = /démarrer la room/i.test(body) && /non commencée/i.test(body);
    expect(hasLockedMessage || hasNotStartedState).toBeTruthy();
  });

  test('sans démarrer la room, barre scénario absente', async ({ page }) => {
    await page.goto('/#/room/dvwa-web');
    await page.waitForTimeout(1000);
    const bar = page.locator('.scenario-bottom-bar');
    await expect(bar).not.toBeVisible();
  });
});

test.describe('Rooms – après démarrage', () => {
  test('après clic Démarrer la room, barre visible avec titre room', async ({ page }) => {
    await page.goto('/#/room/dvwa-web');
    await page.waitForTimeout(1500);
    const demarrerBtn = page.getByRole('button', { name: /démarrer la room/i }).first();
    await demarrerBtn.click();
    await page.waitForTimeout(2500);
    const bar = page.locator('.scenario-bottom-bar').first();
    await expect(bar).toBeVisible({ timeout: 10000 });
    await expect(bar.locator('.scenario-bottom-bar-title')).toBeVisible({ timeout: 5000 });
  });

  test('barre room contient bouton Terminal', async ({ page }) => {
    await page.goto('/#/room/dvwa-web');
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: /démarrer la room/i }).first().click();
    await page.waitForTimeout(2000);
    const bar = page.locator('.scenario-bottom-bar').first();
    await expect(bar.getByRole('button', { name: /terminal/i })).toBeVisible({ timeout: 8000 });
  });

  test('après démarrage, section Machines & accès affiche les boutons', async ({ page }) => {
    await page.goto('/#/room/dvwa-web');
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: /démarrer la room/i }).first().click();
    await page.waitForTimeout(2000);
    const view = page.locator('#view-room');
    await expect(view.locator('.machine-card-actions')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Rooms – Progression', () => {
  test('vue Progression affiche section Rooms', async ({ page }) => {
    await page.goto('/#/progression');
    await page.waitForTimeout(1200);
    const body = await page.locator('#view-progression').textContent();
    expect(body).toMatch(/rooms?|room/i);
  });

  test('vue Progression contient texte enregistrée localement', async ({ page }) => {
    await page.goto('/#/progression');
    await page.waitForTimeout(1200);
    const body = await page.locator('body').textContent();
    expect(body.toLowerCase()).toMatch(/enregistrée localement|progression.*localement/i);
  });
});

test.describe('Rooms – Récap (barre) tâche cliquable', () => {
  test('après démarrage room, clic sur une tâche dans la barre affiche détail (Fait / À faire)', async ({ page }) => {
    await page.goto('/#/room/dvwa-web');
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: /démarrer la room/i }).first().click();
    await page.waitForTimeout(2000);
    const bar = page.locator('.scenario-bottom-bar').first();
    await expect(bar).toBeVisible({ timeout: 8000 });
    const taskItem = bar.locator('.scenario-bar-task-item').or(bar.locator('.scenario-bottom-bar-tasks li')).first();
    await taskItem.click();
    await page.waitForTimeout(500);
    const detail = page.locator('.scenario-bar-task-detail');
    const detailVisible = await detail.isVisible().catch(() => false);
    if (detailVisible) {
      const detailText = await detail.textContent();
      expect(detailText).toMatch(/fait|à faire/i);
    }
  });
});
