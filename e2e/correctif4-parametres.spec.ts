import { expect, test, type Page } from '@playwright/test';

// Correctif 4, section 1 : la fenêtre Paramètres est centrée, 640 px de large, et s'ouvre en pop.

async function neuf(page: Page) {
  await page.addInitScript(() => {
    if (localStorage.getItem('branches:v1') === null) {
      localStorage.setItem(
        'branches:v1',
        JSON.stringify({ state: { theme: 'clair', progression: {}, xp: 0, chapitresDecouverts: [1] }, version: 2 }),
      );
    }
  });
}

test('section 1 : la fenêtre est centrée (écart gauche/droite < 2 px) et fait 640 px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await neuf(page);
  await page.goto('/carte');
  await page.getByRole('button', { name: 'Paramètres' }).click();
  const fenetre = page.getByRole('dialog', { name: 'Paramètres' });
  await expect(fenetre).toBeVisible();
  await page.waitForTimeout(450);
  const r = await fenetre.evaluate((el) => {
    const b = el.getBoundingClientRect();
    return { gauche: b.left, droite: window.innerWidth - b.right, largeur: b.width };
  });
  expect(Math.abs(r.gauche - r.droite)).toBeLessThan(2);
  expect(Math.round(r.largeur)).toBe(640);
});

test('section 1 : en 1440 × 900, le corps ne défile pas', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await neuf(page);
  await page.goto('/carte');
  await page.getByRole('button', { name: 'Paramètres' }).click();
  await expect(page.getByRole('dialog', { name: 'Paramètres' })).toBeVisible();
  const ok = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    const c = d?.querySelector('[class*="corps"]');
    return c === null || c === undefined ? true : c.scrollHeight <= c.clientHeight;
  });
  expect(ok).toBe(true);
});
