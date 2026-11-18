import { expect, test, type Page } from '@playwright/test';

// Correctif 2, sections 3 et 4 : le jeu ne bouge pas, l'indice bascule.

async function neuf(page: Page) {
  await page.addInitScript(() => {
    if (localStorage.getItem('branches:v1') === null) {
      localStorage.setItem(
        'branches:v1',
        JSON.stringify({ state: { theme: 'clair', progression: {}, xp: 0 }, version: 1 }),
      );
    }
    (window as unknown as { __decalages: number }).__decalages = 0;
    new PerformanceObserver((liste) => {
      for (const e of liste.getEntries() as (PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
      })[]) {
        if (!e.hadRecentInput) (window as unknown as { __decalages: number }).__decalages += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
}

async function taper(page: Page, commande: string) {
  const champ = page.getByLabel('Commande Git');
  await champ.fill(commande);
  await champ.press('Enter');
}

async function rectangles(page: Page) {
  return page.evaluate(() => {
    const r = (el: Element | null) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return [b.x, b.y + window.scrollY, b.width, b.height].map((v) => Math.round(v));
    };
    return {
      entete: r(document.querySelector('header')),
      terminal: r(document.querySelector('[role="log"]')),
      graphe: r(document.querySelector('[data-theme-graphe]')),
      pied: r(document.querySelector('footer')),
    };
  });
}

async function decalages(page: Page) {
  return page.evaluate(() => (window as unknown as { __decalages: number }).__decalages);
}

test.describe('correctif 2 : le jeu', () => {
  test('échec : VÉRIFIER ne déplace aucun élément et ne produit aucun layout-shift', async ({ page }) => {
    await neuf(page);
    await page.goto('/mission/c1-m4?debug=1');
    await taper(page, 'git log --oneline');
    const avant = await rectangles(page);
    // Mesure à partir d'ici : le chargement et la saisie ne comptent pas.
    const base = await decalages(page);
    await page.getByRole('button', { name: 'Vérifier' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await page.waitForTimeout(100);
    expect(await rectangles(page)).toEqual(avant);
    await page.waitForTimeout(200);
    expect(await rectangles(page)).toEqual(avant);
    await page.waitForTimeout(400);
    expect(await decalages(page)).toBe(base);
  });

  test('réussite : VÉRIFIER ne déplace aucun élément et ne produit aucun layout-shift', async ({ page }) => {
    await neuf(page);
    await page.goto('/mission/c1-m4?debug=1');
    await taper(page, 'git log --oneline');
    await taper(page, 'git revert a3f9c2e');
    const avant = await rectangles(page);
    const base = await decalages(page);
    await page.getByRole('button', { name: 'Vérifier' }).click();
    await expect(page.getByRole('status')).toBeVisible();
    await page.waitForTimeout(100);
    expect(await rectangles(page)).toEqual(avant);
    await page.waitForTimeout(400);
    expect(await decalages(page)).toBe(base);
  });

  test('indice : ouvrir et fermer ne produit aucun layout-shift', async ({ page }) => {
    await neuf(page);
    await page.goto('/mission/c1-m4?debug=1');
    await page.waitForTimeout(300);
    const base = await decalages(page);
    await page.getByRole('button', { name: /^Indice \d/ }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /^Indice \d/ }).click();
    await page.waitForTimeout(300);
    expect(await decalages(page)).toBe(base);
  });

  test('indice : bascule, suivant, compteur, Échap et clic extérieur', async ({ page }) => {
    await neuf(page);
    await page.goto('/mission/c1-m4?debug=1');
    const bouton = page.getByRole('button', { name: /^Indice \d/ });
    await expect(bouton).toHaveAttribute('aria-expanded', 'false');
    await bouton.click();
    await expect(page.getByRole('dialog', { name: 'Indice' })).toBeVisible();
    await expect(bouton).toHaveAttribute('aria-expanded', 'true');
    await expect(bouton).toContainText('1');
    await page.getByRole('button', { name: 'Indice suivant' }).click();
    await expect(bouton).toContainText('0');
    await expect(page.getByRole('button', { name: 'Indice suivant' })).toHaveCount(0);
    await bouton.click();
    await expect(page.getByRole('dialog', { name: 'Indice' })).toHaveCount(0);
    await expect(bouton).toHaveAttribute('aria-expanded', 'false');
    await bouton.click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Indice' })).toHaveCount(0);
    await bouton.click();
    await page.mouse.click(700, 500);
    await expect(page.getByRole('dialog', { name: 'Indice' })).toHaveCount(0);
  });
});
