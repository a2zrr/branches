import { expect, test, type Page } from '@playwright/test';

// Correctif 3, étapes 2 et 3 : chapitre, chemin, titres à côté des pastilles, vignettes.

const TERMINEES = {
  'c1-m1': { etoiles: 3, commandes: 2, reussie: true },
  'c1-m2': { etoiles: 2, commandes: 4, reussie: true },
  'c1-m3': { etoiles: 3, commandes: 3, reussie: true },
};

async function partie(page: Page, progression: Record<string, unknown> = TERMINEES) {
  await page.addInitScript(
    ([etat]) => {
      if (localStorage.getItem('branches:v1') === null) {
        localStorage.setItem(
          'branches:v1',
          JSON.stringify({ state: { theme: 'clair', progression: etat, xp: 60, chapitresDecouverts: [1] }, version: 2 }),
        );
      }
    },
    [progression] as const,
  );
}

async function largeurColonne(page: Page) {
  return page.locator('main').first().evaluate((el) => {
    const b = el.getBoundingClientRect();
    return { gauche: b.left, droite: b.right };
  });
}

test('étape 2 : capture 1440, état de la maquette Carte.png', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await partie(page);
  await page.goto('/carte');
  await expect(page.getByRole('heading', { name: 'Chapitre 1' }).first()).toBeVisible();
  await page.screenshot({ path: 'verifications/correctif-3/etape-2-carte-1440.png', fullPage: true });
});

for (const largeur of [1280, 1440, 1920]) {
  test(`étape 2 : à ${largeur} px, les titres et le popover restent dans la colonne`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: 900 });
    await partie(page);
    await page.goto('/carte');
    const colonne = await largeurColonne(page);
    const debords = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main === null) return ['pas de main'];
      const b = main.getBoundingClientRect();
      const trouves: string[] = [];
      main.querySelectorAll('button, h3, span, strong').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.left < b.left - 1 || r.right > b.right + 1)) {
          trouves.push(`${el.tagName}:${el.textContent.slice(0, 30)}`);
        }
      });
      return trouves;
    });
    expect(debords).toEqual([]);
    expect(colonne.droite - colonne.gauche).toBeGreaterThan(400);
  });
}

test('étape 3 : les vignettes sont décoratives (aria-hidden)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await partie(page);
  await page.goto('/carte');
  const vignettes = page.locator('[data-vignette]');
  await expect(vignettes).toHaveCount(1);
  await expect(vignettes.first()).toHaveAttribute('aria-hidden', 'true');
});
