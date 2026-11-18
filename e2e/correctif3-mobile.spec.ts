import { expect, test, type Page } from '@playwright/test';

// Correctif 3, étape 6 : la carte sur téléphone.

const CHAPITRE_1_FINI = Object.fromEntries(
  ['c1-m1', 'c1-m2', 'c1-m3', 'c1-m4', 'c1-m5', 'c1-m6'].map((id) => [id, { etoiles: 3, commandes: 2, reussie: true }]),
);

async function partie(page: Page, progression: Record<string, unknown>) {
  await page.addInitScript(
    ([etat]) => {
      if (localStorage.getItem('branches:v1') === null) {
        localStorage.setItem(
          'branches:v1',
          JSON.stringify({ state: { theme: 'clair', progression: etat, xp: 60, chapitresDecouverts: [1, 2] }, version: 2 }),
        );
      }
    },
    [progression] as const,
  );
}

for (const largeur of [360, 390, 414, 768, 1024]) {
  test(`étape 6 : à ${largeur} px, aucun défilement horizontal`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: 844 });
    await partie(page, {});
    await page.goto('/carte');
    const debord = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(debord).toBeLessThanOrEqual(0);
  });
}

for (const largeur of [360, 390, 414]) {
  test(`étape 6 : à ${largeur} px, la vignette ne touche aucune pastille ni aucun badge`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: 844 });
    await partie(page, CHAPITRE_1_FINI);
    await page.goto('/carte');
    const conflits = await page.evaluate(() => {
      const v = document.querySelector('[data-vignette]')?.getBoundingClientRect();
      if (v === undefined) return ['pas de vignette'];
      const trouves: string[] = [];
      document.querySelectorAll('main button, main [class*="badgeEtoiles"]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.left < v.right && r.right > v.left && r.top < v.bottom && r.bottom > v.top) {
          trouves.push(el.tagName);
        }
      });
      return trouves;
    });
    expect(conflits).toEqual([]);
  });
}

test('étape 6 : en bas de page, rien n’est caché sous la barre de mission', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await partie(page, CHAPITRE_1_FINI);
  await page.goto('/carte');
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  const cache = await page.evaluate(() => {
    const barre = document.querySelector('section[aria-label="Mission choisie"]')?.getBoundingClientRect();
    const mur = document.querySelector('[data-mur]')?.getBoundingClientRect();
    if (barre === undefined || mur === undefined) return true;
    return mur.bottom > barre.top + 1 && mur.top < barre.top;
  });
  expect(cache).toBe(false);
});

test('étape 6 : cibles tactiles d’au moins 44 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await partie(page, CHAPITRE_1_FINI);
  await page.goto('/carte');
  const petites = await page.evaluate(() =>
    Array.from(document.querySelectorAll('main button, section[aria-label="Mission choisie"] button, #bouton-parametres'))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { nom: el.getAttribute('aria-label') ?? el.textContent, l: r.width, h: r.height };
      })
      .filter((c) => c.l < 44 || c.h < 44),
  );
  expect(petites).toEqual([]);
});

test('étape 6 : la feuille Ton Git se ferme avec Échap et rend le focus au bouton', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await partie(page, CHAPITRE_1_FINI);
  await page.goto('/carte');
  const bouton = page.getByRole('button', { name: 'Ouvrir Ton Git' });
  await bouton.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(bouton).toBeFocused();
});

test('étape 6 : captures 390 × 844, haut et bas de la page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await partie(page, CHAPITRE_1_FINI);
  await page.goto('/carte');
  await page.screenshot({ path: 'verifications/correctif-3/etape-6-carte-390-haut.png' });
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await page.screenshot({ path: 'verifications/correctif-3/etape-6-carte-390-bas.png' });
});
