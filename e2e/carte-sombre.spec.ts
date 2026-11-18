import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Correctif 3, étape 7 : mode sombre, accessibilité (axe) et captures.

const CHAPITRE_1_FINI = Object.fromEntries(
  ['c1-m1', 'c1-m2', 'c1-m3', 'c1-m4', 'c1-m5', 'c1-m6'].map((id) => [id, { etoiles: 3, commandes: 2, reussie: true }]),
);

async function partie(page: Page, theme: 'clair' | 'sombre', progression: Record<string, unknown>) {
  await page.addInitScript(
    ([etat]) => {
      if (localStorage.getItem('branches:v1') === null) {
        localStorage.setItem('branches:v1', JSON.stringify({ state: etat, version: 2 }));
      }
    },
    [{ theme, progression, xp: 60, chapitresDecouverts: [1, 2] }] as const,
  );
}

test('étape 7 : axe, aucune violation grave sur la carte, clair et sombre', async ({ page }) => {
  for (const theme of ['clair', 'sombre'] as const) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await partie(page, theme, {});
    await page.goto('/carte');
    const resultat = await new AxeBuilder({ page }).analyze();
    const graves = resultat.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(graves.map((v) => v.id), `thème ${theme}`).toEqual([]);
  }
});

test('étape 7 : axe sur téléphone 390 px, thème sombre', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await partie(page, 'sombre', CHAPITRE_1_FINI);
  await page.goto('/carte');
  const resultat = await new AxeBuilder({ page }).analyze();
  const graves = resultat.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(graves.map((v) => v.id)).toEqual([]);
});

test('étape 7 : captures sombre, PC et 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await partie(page, 'sombre', {
    'c1-m1': { etoiles: 3, commandes: 2, reussie: true },
    'c1-m2': { etoiles: 2, commandes: 4, reussie: true },
    'c1-m3': { etoiles: 3, commandes: 3, reussie: true },
  });
  await page.goto('/carte');
  await page.screenshot({ path: 'verifications/correctif-3/etape-7-sombre-1440.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await partie(page, 'sombre', CHAPITRE_1_FINI);
  await page.goto('/carte');
  await page.screenshot({ path: 'verifications/correctif-3/etape-7-sombre-390.png' });
});
