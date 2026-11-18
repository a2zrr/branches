import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Correctif 2, section 5 : Paramètres est un panneau latéral sur la page en cours.

async function neuf(page: Page, theme: 'clair' | 'sombre' = 'clair') {
  await page.addInitScript((t) => {
    if (localStorage.getItem('branches:v1') === null) {
      localStorage.setItem(
        'branches:v1',
        JSON.stringify({ state: { theme: t, progression: {}, xp: 0 }, version: 1 }),
      );
    }
  }, theme);
}

const roue = (page: Page) => page.locator('#bouton-parametres');
const panneau = (page: Page) => page.getByRole('dialog', { name: 'Paramètres' });

test.describe('correctif 2 : panneau Paramètres', () => {
  for (const route of ['/', '/carte']) {
    test(`depuis ${route} : la roue ouvre le panneau sans changer l’adresse, Échap rend le focus à la roue`, async ({
      page,
    }) => {
      await neuf(page);
      await page.goto(route);
      const adresse = page.url();
      await roue(page).click();
      await expect(panneau(page)).toBeVisible();
      await expect(panneau(page)).toHaveAttribute('aria-modal', 'true');
      expect(page.url()).toBe(adresse);
      await expect(page.getByRole('button', { name: 'Fermer les paramètres' })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(panneau(page)).toHaveCount(0);
      await expect(roue(page)).toBeFocused();
    });
  }

  test('le focus reste piégé dans le panneau', async ({ page }) => {
    await neuf(page);
    await page.goto('/');
    await roue(page).click();
    const boutons = await panneau(page).getByRole('button').count();
    for (let i = 0; i < boutons + 3; i++) await page.keyboard.press('Tab');
    const dedans = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return d !== null && d.contains(document.activeElement);
    });
    expect(dedans).toBe(true);
    await page.keyboard.press('Shift+Tab');
    const encore = await page.evaluate(
      () => document.querySelector('[role="dialog"]')?.contains(document.activeElement) ?? false,
    );
    expect(encore).toBe(true);
  });

  test('la croix et le voile ferment le panneau', async ({ page }) => {
    await neuf(page);
    await page.goto('/carte');
    await roue(page).click();
    await page.getByRole('button', { name: 'Fermer les paramètres' }).click();
    await expect(panneau(page)).toHaveCount(0);
    await roue(page).click();
    await page.mouse.click(40, 400);
    await expect(panneau(page)).toHaveCount(0);
  });

  test('la page derrière ne défile pas quand le panneau est ouvert', async ({ page }) => {
    await neuf(page);
    await page.goto('/carte');
    await roue(page).click();
    const bloque = await page.evaluate(() => document.body.style.overflow);
    expect(bloque).toBe('hidden');
  });

  test('Sombre s’applique tout de suite et survit à un rechargement', async ({ page }) => {
    await neuf(page);
    await page.goto('/');
    await roue(page).click();
    await page.getByRole('radio', { name: 'Sombre' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'sombre');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'sombre');
  });

  test('/parametres redirige vers l’accueil et ouvre le panneau', async ({ page }) => {
    await neuf(page);
    await page.goto('/parametres');
    await expect(page).toHaveURL(/\/$/);
    await expect(panneau(page)).toBeVisible();
  });

  test('le pied de page ouvre le panneau', async ({ page }) => {
    await neuf(page);
    await page.goto('/carte');
    await page.getByRole('button', { name: 'Paramètres', exact: true }).click();
    await expect(panneau(page)).toBeVisible();
  });

  test('la carte n’a plus de bouton thème dans son en-tête', async ({ page }) => {
    await neuf(page);
    await page.goto('/carte');
    await expect(page.getByRole('button', { name: /mode (clair|sombre)/ })).toHaveCount(0);
  });

  test('axe : 0 violation serious ou critical panneau ouvert', async ({ page }) => {
    await neuf(page);
    await page.goto('/');
    await roue(page).click();
    await expect(panneau(page)).toBeVisible();
    const resultats = await new AxeBuilder({ page }).analyze();
    const graves = resultats.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(graves.map((v) => `${v.id} : ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });

  test('capture du panneau ouvert (comparaison avec Parametres.png)', async ({ page }) => {
    await neuf(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await roue(page).click();
    await expect(panneau(page)).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'verifications/correctif-2/parametres-app.png' });
  });
});
