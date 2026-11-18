import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { test, type Page } from '@playwright/test';

const DOSSIER = resolve(import.meta.dirname, '../../verifications/fidelite');
mkdirSync(DOSSIER, { recursive: true });

async function injecter(page: Page) {
  const etat = {
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
  await page.addInitScript((json: string) => {
    if (localStorage.getItem('branches:v1') === null) localStorage.setItem('branches:v1', json);
  }, JSON.stringify(etat));
}

test('capture design system', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await injecter(page);
  await page.goto('/dev/design-system');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.screenshot({ path: resolve(DOSSIER, 'Composants-app.png'), fullPage: true });
});
