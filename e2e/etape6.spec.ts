import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Attend la fin des animations finies (apparitions, transitions) : axe ne mesure pas les contrastes en cours de fondu. */
async function attendreAnimations(page: Page) {
  await page.evaluate(async () => {
    const finies = document
      .getAnimations()
      .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
      .map((a) => a.finished.catch(() => undefined));
    await Promise.all(finies);
  });
}

const DOSSIER = resolve(import.meta.dirname, '../verifications/etape-6');
mkdirSync(DOSSIER, { recursive: true });

const PARTIE_INJECTEE = {
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

async function preparer(page: Page, theme: 'clair' | 'sombre', partie: 'vide' | 'injectee') {
  const etat =
    partie === 'vide'
      ? { state: { theme, progression: {}, xp: 0 }, version: 1 }
      : { state: { ...PARTIE_INJECTEE.state, theme }, version: 1 };
  await page.addInitScript((json: string) => {
    // Ne réécrit la partie qu'au premier chargement : la suite du parcours garde ses propres changements.
    if (localStorage.getItem('branches:v1') === null) localStorage.setItem('branches:v1', json);
  }, JSON.stringify(etat));
}

test.describe('étape 6 : accueil, carte, paramètres', () => {
  for (const [largeur, hauteur] of [
    [1440, 900],
    [1280, 800],
  ] as const) {
    for (const theme of ['clair', 'sombre'] as const) {
      for (const partie of ['vide', 'injectee'] as const) {
        test(`captures ${largeur} × ${hauteur}, ${theme}, partie ${partie}`, async ({ page }) => {
          await page.setViewportSize({ width: largeur, height: hauteur });
          await preparer(page, theme, partie);
          for (const [route, nom] of [
            ['/', 'accueil'],
            ['/carte', 'carte'],
          ] as const) {
            await page.goto(route);
            await page.evaluate(() => document.fonts.ready);
            await page.screenshot({
              path: resolve(DOSSIER, `${nom}-${largeur}-${theme}-${partie}.png`),
              fullPage: true,
            });
          }
        });
      }
    }
  }

  test('pas de défilement horizontal en 1280 px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await preparer(page, 'clair', 'vide');
    for (const route of ['/', '/carte']) {
      await page.goto(route);
      const { largeur, fenetre } = await page.evaluate(() => ({
        largeur: document.documentElement.scrollWidth,
        fenetre: window.innerWidth,
      }));
      expect(largeur, route).toBeLessThanOrEqual(fenetre);
    }
  });

  test('axe : 0 violation serious ou critical sur / et /carte', async ({ page }) => {
    await preparer(page, 'clair', 'injectee');
    for (const route of ['/', '/carte']) {
      await page.goto(route);
      const resultats = await (await attendreAnimations(page), new AxeBuilder({ page }).analyze());
      const graves = resultats.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(
        graves.map((v) => `${v.id} : ${v.help}`),
        route,
      ).toEqual([]);
    }
  });

  test('clavier : sur la carte, Tab atteint COMMENCER et Entrée ouvre la mission en cours', async ({
    page,
  }) => {
    await preparer(page, 'clair', 'vide');
    await page.goto('/carte');
    await page.getByRole('button', { name: 'Commencer' }).focus();
    await expect(page.getByRole('button', { name: 'Commencer' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/mission\/c1-m1$/);
  });

  test('accueil : COMMENCER mène à la mission en cours', async ({ page }) => {
    await preparer(page, 'clair', 'injectee');
    await page.goto('/');
    await page.getByRole('link', { name: 'Commencer' }).click();
    await expect(page).toHaveURL(/\/mission\/c1-m4$/);
  });

  test('paramètres : thème sombre appliqué et export produit un fichier', async ({ page }) => {
    await preparer(page, 'clair', 'vide');
    await page.goto('/');
    await page.locator('#bouton-parametres').click();
    await page.getByRole('radio', { name: 'Sombre' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'sombre');
    const [telechargement] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exporter' }).click(),
    ]);
    expect(telechargement.suggestedFilename()).toBe('branches-progression.json');
  });
});
