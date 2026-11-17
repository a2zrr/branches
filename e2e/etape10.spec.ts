import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const ROUTES = [
  '/',
  '/carte',
  '/parametres',
  '/mission/c1-m1?debug=1',
  '/mission/c1-m4?debug=1',
  '/mission/c2-m2?debug=1',
  '/inexistante',
];

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

test.describe('étape 10 : finitions', () => {
  for (const theme of ['clair', 'sombre'] as const) {
    test(`axe : 0 violation serious ou critical sur toutes les routes, ${theme}`, async ({ page }) => {
      await neuf(page, theme);
      for (const route of ROUTES) {
        await page.goto(route);
        await page.waitForTimeout(200);
        const resultats = await new AxeBuilder({ page }).analyze();
        const graves = resultats.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        expect(
          graves.map((v) => `${v.id} : ${v.help}`),
          `${route} (${theme})`,
        ).toEqual([]);
      }
    });
  }

  test('une mission entière (c1-m1) se joue au clavier seul, de la saisie à /fin', async ({ page }) => {
    await neuf(page);
    await page.goto('/mission/c1-m1');
    const champ = page.getByLabel('Commande Git');
    await expect(champ).toBeFocused();
    await page.keyboard.type('git add src/Accueil.jsx');
    await page.keyboard.press('Enter');
    await page.keyboard.type('git commit -m "fix: corrige le nom sur l\'accueil"');
    await page.keyboard.press('Enter');
    // Tab jusqu'au bouton VÉRIFIER, puis Entrée.
    let trouve = false;
    for (let i = 0; i < 40 && !trouve; i += 1) {
      await page.keyboard.press('Tab');
      trouve = await page.evaluate(
        () => (document.activeElement?.textContent ?? '').trim().toLowerCase() === 'vérifier',
      );
    }
    expect(trouve).toBe(true);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toContainText('Bien joué');
    await expect(page.getByRole('button', { name: 'Continuer' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/mission\/c1-m1\/fin$/);
    await page.screenshot({ path: 'verifications/etape-10/c1-m1-fin-clavier.png' });
  });
});
