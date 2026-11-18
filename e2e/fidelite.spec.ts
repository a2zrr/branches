import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { test, type Page } from '@playwright/test';

// Captures de fidélité : même état que la maquette (c1-m1 à c1-m3 réussies, c1-m4 en cours).
const DOSSIER = resolve(import.meta.dirname, '../verifications/fidelite');
mkdirSync(DOSSIER, { recursive: true });

const ETAT_MAQUETTE = {
  state: {
    theme: 'clair',
    progression: {
      'c1-m1': { etoiles: 3, commandes: 2, reussie: true },
      'c1-m2': { etoiles: 2, commandes: 3, reussie: true },
      'c1-m3': { etoiles: 3, commandes: 3, reussie: true },
    },
    xp: 80,
  },
  version: 1,
};

async function injecter(page: Page, theme: 'clair' | 'sombre' = 'clair') {
  const etat = { ...ETAT_MAQUETTE, state: { ...ETAT_MAQUETTE.state, theme } };
  await page.addInitScript((json: string) => {
    if (localStorage.getItem('branches:v1') === null) localStorage.setItem('branches:v1', json);
  }, JSON.stringify(etat));
}

test('capture accueil', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await injecter(page);
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.screenshot({ path: resolve(DOSSIER, 'Accueil-app.png'), fullPage: true });
});

test('capture carte', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await injecter(page);
  await page.goto('/carte');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.screenshot({ path: resolve(DOSSIER, 'Carte-app.png'), fullPage: true });
});

test('capture jeu terminal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await injecter(page);
  await page.goto('/mission/c1-m4');
  const champ = page.getByLabel('Commande Git');
  await champ.fill('git log --oneline');
  await champ.press('Enter');
  await champ.fill('git revert a3f9c2e');
  await champ.press('Enter');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.screenshot({ path: resolve(DOSSIER, 'JeuTerminal-app.png'), fullPage: false });
});

test('capture jeu erreur', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await injecter(page);
  await page.goto('/mission/c1-m4');
  const champ = page.getByLabel('Commande Git');
  await champ.fill('git log --oneline');
  await champ.press('Enter');
  await champ.fill('git rever a3f9c2e');
  await champ.press('Enter');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.screenshot({ path: resolve(DOSSIER, 'JeuTerminalErreur-app.png'), fullPage: false });
});

test('capture jeu indice', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await injecter(page);
  await page.goto('/mission/c1-m4');
  const champ = page.getByLabel('Commande Git');
  await champ.fill('git log --oneline');
  await champ.press('Enter');
  await champ.fill('git re');
  await page.getByRole('button', { name: /^Indice \d/ }).click();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.screenshot({ path: resolve(DOSSIER, 'JeuTerminalIndice-app.png'), fullPage: false });
});

test('capture conflit', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await injecter(page);
  await page.goto('/mission/c2-m2?debug=1');
  await page.keyboard.press('1');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.screenshot({ path: resolve(DOSSIER, 'Conflit-app.png'), fullPage: false });
});
