// Tests E2E – Scénarios (barre, démarrage, pause, reprise, abandon, recap, terminal depuis barre)
const { test, expect } = require('@playwright/test');

const SCENARIO_IDS = [
  'scenario-01-scan-reseau',
  'scenario-02-sqli-dvwa',
  'scenario-03-acces-ssh-redis',
  'scenario-04-api-idor-sqli',
  'scenario-05-xss-dvwa',
  'scenario-06-stego-flag',
  'scenario-07-crypto-base64-aes',
  'scenario-08-red-team-1h',
  'scenario-09-phishing-analyse',
  'scenario-10-forensics-tshark',
];

test.describe('Scénarios – navigation par hash', () => {
  for (const id of SCENARIO_IDS) {
    test(`vue scénario charge pour ${id}`, async ({ page }) => {
      await page.goto(`/#/scenario/${id}`);
      await page.waitForTimeout(1200);
      const view = page.locator('#view-scenario, .view-scenario-with-terminal').first();
      await expect(view).toBeVisible({ timeout: 10000 });
    });
  }
});

test.describe('Scénarios – bouton Démarrer / Préparer', () => {
  for (const id of SCENARIO_IDS) {
    test(`${id} : bouton Démarrer ou Ouvrir terminal visible`, async ({ page }) => {
      await page.goto(`/#/scenario/${id}`);
      await page.waitForTimeout(1200);
      const btn = page.getByRole('button', { name: /démarrer|ouvrir le terminal|préparer/i }).first();
      await expect(btn).toBeVisible({ timeout: 8000 });
    });
  }
});

// Helper : démarrer le scénario (clic "Démarrer le scénario") pour afficher la barre (status in_progress)
async function startScenarioBar(page) {
  const demarrerBtn = page.getByRole('button', { name: /démarrer le scénario/i }).first();
  await demarrerBtn.click();
  await page.waitForTimeout(2000);
  const bar = page.locator('.scenario-bottom-bar').first();
  await expect(bar).toBeVisible({ timeout: 15000 });
}

test.describe('Scénarios – barre inférieure après démarrage', () => {
  test('barre scénario visible après clic Démarrer (scenario-02)', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1500);
    await startScenarioBar(page);
  });

  test('barre contient le titre du scénario', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1200);
    await startScenarioBar(page);
    const bar = page.locator('.scenario-bottom-bar').first();
    await expect(bar.locator('.scenario-bottom-bar-title')).toBeVisible({ timeout: 5000 });
  });

  test('barre contient section Pause ou Reprendre', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1200);
    await startScenarioBar(page);
    const pauseOrResume = page.locator('.scenario-bar-section-pause, .scenario-bar-section-resume').first();
    await expect(pauseOrResume).toBeVisible({ timeout: 5000 });
  });

  test('barre contient bouton Récap', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1200);
    await startScenarioBar(page);
    const recap = page.getByRole('button', { name: /récap/i }).first();
    await expect(recap).toBeVisible({ timeout: 5000 });
  });

  test('barre contient bouton Terminal', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1200);
    await startScenarioBar(page);
    const term = page.locator('button.scenario-bar-section-terminal').first();
    await expect(term).toBeVisible({ timeout: 5000 });
  });

  test('barre contient liste de tâches ou zone tâches', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1200);
    await startScenarioBar(page);
    const tasks = page.locator('.scenario-bottom-bar-tasks, .scenario-bar-section-tasks').first();
    await expect(tasks).toBeVisible({ timeout: 8000 });
  });

  test('barre contient Voir tout (expand)', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1200);
    await startScenarioBar(page);
    const expand = page.getByRole('button', { name: /voir tout|expand/i }).first();
    await expect(expand).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Scénarios – contenu vue scénario', () => {
  test('vue scénario affiche titre ou howto', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1200);
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 8000 });
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.length).toBeGreaterThan(200);
    expect(bodyText).toMatch(/Scénario|Comment faire|SQL|DVWA|terminal/i);
  });

  test('vue scénario affiche machines ou cibles', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1200);
    const machines = page.locator('.machine-card, .scenario-machines, [class*="cible"]').first();
    await expect(machines).toBeVisible({ timeout: 10000 });
  });

  test('vue scénario affiche packs outils recommandés', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1200);
    const packs = page.locator('.scenario-tool-packs-desc, .tool-packs, [class*="tool"]').first();
    await expect(packs).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Scénarios – clic Récap ouvre popup', () => {
  test('clic Récap affiche panneau ou modal récap', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1200);
    await startScenarioBar(page);
    await page.getByRole('button', { name: /récap/i }).first().click();
    await page.waitForTimeout(800);
    const popup = page.locator('.pip-panel, [class*="recap"], [role="dialog"]').first();
    await expect(popup).toBeVisible({ timeout: 6000 });
  });
});

test.describe('Scénarios – abandon (retour lab)', () => {
  test('bouton Abandon visible après démarrage du scénario', async ({ page }) => {
    await page.goto('/#/scenario/scenario-02-sqli-dvwa');
    await page.waitForTimeout(1200);
    await startScenarioBar(page);
    const abandon = page.getByRole('button', { name: /abandon|quitter/i }).first();
    await expect(abandon).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Scénarios – plusieurs scénarios (navigation)', () => {
  test('depuis scénario 01 aller à scénario 03 par hash', async ({ page }) => {
    await page.goto('/#/scenario/scenario-01-scan-reseau');
    await page.waitForTimeout(800);
    await page.goto('/#/scenario/scenario-03-acces-ssh-redis');
    await page.waitForTimeout(1200);
    const view = page.locator('#view-scenario').first();
    await expect(view).toBeVisible({ timeout: 8000 });
  });

  test('hash invalide scénario redirige ou affiche erreur gracieuse', async ({ page }) => {
    await page.goto('/#/scenario/scenario-inexistant-xyz');
    await page.waitForTimeout(1500);
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 5000 });
  });
});
