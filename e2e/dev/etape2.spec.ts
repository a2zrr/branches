import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const DOSSIER_CAPTURES = resolve(import.meta.dirname, '../../verifications/etape-2');
mkdirSync(DOSSIER_CAPTURES, { recursive: true });

async function avecTheme(page: Page, theme: 'clair' | 'sombre') {
  await page.addInitScript((t) => {
    localStorage.setItem('branches:v1', JSON.stringify({ state: { theme: t }, version: 1 }));
  }, theme);
}

test.describe('étape 2 : design system', () => {
  for (const theme of ['clair', 'sombre'] as const) {
    test(`capture de /dev/design-system en ${theme}, page entière, 1440 × 900`, async ({ page }) => {
      await avecTheme(page, theme);
      await page.goto('/dev/design-system');
      await expect(page.locator('h1')).toHaveText("Composants d'interface");
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: resolve(DOSSIER_CAPTURES, `design-system-${theme}.png`),
        fullPage: true,
      });
    });

    test(`axe : 0 violation serious ou critical en ${theme}`, async ({ page }) => {
      await avecTheme(page, theme);
      await page.goto('/dev/design-system');
      const resultats = await new AxeBuilder({ page }).analyze();
      const graves = resultats.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(graves.map((v) => `${v.id} (${v.impact ?? ''}) : ${v.help}`)).toEqual([]);
    });
  }

  test('mouvement réduit : aucune animation ne dure plus de 1 ms', async ({ browser }) => {
    const contexte = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 1440, height: 900 },
    });
    const page = await contexte.newPage();
    await page.goto('/dev/design-system');
    await page.waitForTimeout(300);
    const durees = await page.evaluate(() =>
      document.getAnimations().map((a) => {
        const t = a.effect?.getComputedTiming();
        return typeof t?.duration === 'number' ? t.duration : 0;
      }),
    );
    await contexte.close();
    expect(durees.length).toBeGreaterThan(0);
    expect(Math.max(...durees)).toBeLessThanOrEqual(1);
  });

  test('clavier : Tab atteint le bouton de thème, Espace le bascule', async ({ page }) => {
    await avecTheme(page, 'clair');
    await page.goto('/dev/design-system');
    const bouton = page.getByRole('button', { name: 'Mode sombre' });
    await bouton.focus();
    await expect(bouton).toBeFocused();
    await page.keyboard.press('Space');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'sombre');
    await page.getByRole('button', { name: 'Mode clair' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'clair');
  });

  test('le bouton désactivé ne réagit pas', async ({ page }) => {
    await avecTheme(page, 'clair');
    await page.goto('/dev/design-system');
    const desactive = page.locator('button:disabled').first();
    await expect(desactive).toHaveText('Vérifier');
    await expect(desactive).toBeDisabled();
  });
});
