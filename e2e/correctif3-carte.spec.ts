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

for (const largeur of [1280, 1440, 1920]) {
  test(`étape 3 : à ${largeur} px, la vignette ne touche aucune pastille, aucun titre, aucun popover`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: 900 });
    await partie(page);
    await page.goto('/carte');
    const conflits = await page.evaluate(() => {
      const vignette = document.querySelector('[data-vignette]');
      if (vignette === null) return ['pas de vignette'];
      const v = vignette.getBoundingClientRect();
      const cibles = document.querySelectorAll('main button, main [class*="legende"], main [role="group"]');
      const trouves: string[] = [];
      cibles.forEach((el) => {
        const r = el.getBoundingClientRect();
        const chevauche = r.left < v.right && r.right > v.left && r.top < v.bottom && r.bottom > v.top;
        if (chevauche) trouves.push(el.tagName + ':' + el.textContent.slice(0, 20));
      });
      return trouves;
    });
    expect(conflits).toEqual([]);
  });
}

test('étape 3 : capture avec le chapitre 2 visible (chapitre 1 terminé)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const tout = Object.fromEntries(
    ['c1-m1', 'c1-m2', 'c1-m3', 'c1-m4', 'c1-m5', 'c1-m6'].map((id) => [id, { etoiles: 3, commandes: 2, reussie: true }]),
  );
  await partie(page, tout);
  await page.goto('/carte');
  await expect(page.locator('[data-vignette]')).toHaveCount(2);
  await page.screenshot({ path: 'verifications/correctif-3/etape-3-carte-chapitre-2-1440.png', fullPage: true });
});

// Correctif 3, étape 4 : le mur de nuages.

test('étape 4 : dans une partie neuve, aucun titre de chapitre ni de mission caché dans le DOM', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await partie(page, {});
  await page.goto('/carte');
  await expect(page.locator('[data-mur="cache"]')).toHaveCount(1);
  await expect(page.getByText('Le stagiaire a poussé sur main')).toHaveCount(0);
  await expect(page.getByText('Mais qui est Kévin')).toHaveCount(0);
  await expect(page.getByText('Bientôt disponible')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: "Qu'y a-t-il derrière les nuages ?" })).toBeVisible();
  await expect(page.getByText('Termine les 6 missions du chapitre 1 pour les dissiper.')).toBeVisible();
});

test('étape 4 : chapitre 2 fini, le mur devient « bientôt » n° 3, sans barre', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const tout = Object.fromEntries(
    ['c1-m1', 'c1-m2', 'c1-m3', 'c1-m4', 'c1-m5', 'c1-m6', 'c2-m2'].map((id) => [
      id,
      { etoiles: 3, commandes: 2, reussie: true },
    ]),
  );
  await partie(page, tout);
  await page.goto('/carte');
  await expect(page.locator('[data-mur="bientot"]')).toHaveCount(1);
  await expect(page.getByText('La suite se prépare')).toBeVisible();
  await expect(page.getByText('De nouvelles galères arrivent. Hédi prépare déjà ses excuses.')).toBeVisible();
  await expect(page.locator('[data-mur="bientot"] [role="progressbar"]')).toHaveCount(0);
});

test('étape 4 : capture de la carte dans l’état de Carte.png (chapitre 1, mission 4 en cours)', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await partie(page);
  await page.goto('/carte');
  await page.screenshot({ path: 'verifications/correctif-3/etape-4-carte-mur-1440.png', fullPage: true });
});
