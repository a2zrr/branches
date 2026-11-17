import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const DOSSIER = resolve(import.meta.dirname, '../../verifications/etape-4');
mkdirSync(DOSSIER, { recursive: true });

const JEUX = [
  { id: 'c1-m4', titre: 'c1-m4 : avant et après le revert' },
  { id: 'c2-m2', titre: 'c2-m2 : conflit puis fusion résolue' },
  { id: 'c1-m6', titre: 'c1-m6 : git bisect en cours' },
  { id: 'genere-30', titre: 'Jeu généré : 30 commits sur 8 branches' },
];

async function avecTheme(page: Page, theme: 'clair' | 'sombre') {
  await page.addInitScript((t) => {
    localStorage.setItem('branches:v1', JSON.stringify({ state: { theme: t }, version: 1 }));
  }, theme);
}

test.describe('étape 4 : graphe des commits', () => {
  for (const theme of ['clair', 'sombre'] as const) {
    test(`captures des 4 jeux en ${theme}`, async ({ page }) => {
      await avecTheme(page, theme);
      await page.goto('/dev/graphe');
      await expect(page.locator('h1')).toHaveText('Graphe des commits');
      await page.evaluate(() => document.fonts.ready);
      for (const jeu of JEUX) {
        const section = page.locator('section', { has: page.locator(`#titre-${jeu.id}`) });
        await section.screenshot({ path: resolve(DOSSIER, `${jeu.id}-${theme}.png`) });
      }
    });
  }

  test('axe : 0 violation serious ou critical en clair et en sombre', async ({ page }) => {
    for (const theme of ['clair', 'sombre'] as const) {
      await avecTheme(page, theme);
      await page.goto('/dev/graphe');
      await page.waitForTimeout(300);
      const resultats = await new AxeBuilder({ page }).analyze();
      const graves = resultats.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(
        graves.map((v) => `${v.id} : ${v.help}`),
        theme,
      ).toEqual([]);
    }
  });

  test('clavier : Tab puis Entrée sélectionne une rangée (aria-pressed)', async ({ page }) => {
    await avecTheme(page, 'clair');
    await page.goto('/dev/graphe');
    const premierBouton = page.locator('li[data-ligne] button').first();
    await premierBouton.focus();
    await page.keyboard.press('Enter');
    await expect(premierBouton).toHaveAttribute('aria-pressed', 'true');
  });

  test('rejouer : la séquence d’étapes se termine sur l’état final', async ({ page }) => {
    await avecTheme(page, 'clair');
    await page.goto('/dev/graphe');
    const section = page.locator('section', { has: page.locator('#titre-c1-m4') });
    await expect(section.locator('li[data-ligne="f0e1d2c"]')).toHaveCount(1);
    await section.getByRole('button', { name: 'Rejouer l’animation' }).click();
    await expect(section.locator('li[data-ligne="f0e1d2c"]')).toHaveCount(1, { timeout: 5000 });
    await expect(section.locator('[data-noeud="f0e1d2c"]')).toHaveAttribute('data-etat', 'nouveau');
  });

  test('mouvement réduit : aucune animation CSS ne dure plus de 1 ms', async ({ browser }) => {
    const contexte = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 1440, height: 900 },
    });
    const page = await contexte.newPage();
    await page.goto('/dev/graphe');
    await page.waitForTimeout(300);
    const durees = await page.evaluate(() =>
      document.getAnimations().map((a) => a.effect?.getComputedTiming().duration ?? 0),
    );
    await contexte.close();
    expect(Math.max(0, ...durees.map((d) => Number(d)))).toBeLessThanOrEqual(1);
  });
});
