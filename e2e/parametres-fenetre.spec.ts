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

// Section 2 : le contenu, le thème « Auto », les flèches du clavier.

async function ouvrirParametres(page: Page) {
  await page.goto('/carte');
  await page.getByRole('button', { name: 'Paramètres' }).click();
  await expect(page.getByRole('dialog', { name: 'Paramètres' })).toBeVisible();
  await page.waitForTimeout(450);
}

test('section 2 : Sombre applique data-theme immédiatement et survit à un rechargement', async ({ page }) => {
  await neuf(page);
  await page.goto('/carte');
  await page.getByRole('button', { name: 'Paramètres' }).click();
  await page.getByRole('radio', { name: 'Sombre' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sombre');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sombre');
});

test('section 2 : Auto suit le système (sombre puis clair)', async ({ page }) => {
  await neuf(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/carte');
  await page.getByRole('button', { name: 'Paramètres' }).click();
  await page.getByRole('radio', { name: 'Auto' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sombre');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'clair');
});

test('section 2 : les flèches du clavier changent de thème dans le groupe radio', async ({ page }) => {
  await neuf(page);
  await page.goto('/carte');
  await page.getByRole('button', { name: 'Paramètres' }).click();
  await page.getByRole('radio', { name: 'Clair' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Sombre' })).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Auto' })).toHaveAttribute('aria-checked', 'true');
});

test('section 2 : captures clair et sombre en 1440 × 900', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await neuf(page);
  await ouvrirParametres(page);
  await page.screenshot({ path: 'verifications/correctif-4/parametres-clair-1440.png' });
  await page.getByRole('radio', { name: 'Sombre' }).click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'verifications/correctif-4/parametres-sombre-1440.png' });
});

// Section 3 : la confirmation « Tout effacer ? ».

test('section 3 : Recommencer ouvre la confirmation sans fermer la fenêtre ; le focus va sur Annuler', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await neuf(page);
  await ouvrirParametres(page);
  await page.getByRole('button', { name: 'Recommencer' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Tout effacer ?' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Paramètres' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Annuler' })).toBeFocused();
  await page.screenshot({ path: 'verifications/correctif-4/parametres-confirmation-1440.png' });
});

test('section 3 : Échap ne ferme que la confirmation, et le focus revient sur Recommencer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await neuf(page);
  await ouvrirParametres(page);
  await page.getByRole('button', { name: 'Recommencer' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Paramètres' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Recommencer' })).toBeFocused();
});

test('section 3 : Annuler ne change rien ; Oui efface, ferme et revient à l’accueil', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    if (localStorage.getItem('branches:v1') === null) {
      localStorage.setItem(
        'branches:v1',
        JSON.stringify({
          state: {
            theme: 'sombre',
            progression: { 'c1-m1': { etoiles: 3, commandes: 2, reussie: true } },
            xp: 30,
            chapitresDecouverts: [1, 2],
          },
          version: 3,
        }),
      );
    }
  });
  await page.goto('/carte');
  await page.getByRole('button', { name: 'Paramètres' }).click();
  await page.getByRole('button', { name: 'Recommencer' }).click();
  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  const apresAnnuler = await page.evaluate(() => JSON.parse(localStorage.getItem('branches:v1') ?? '{}') as { state: { progression: object } });
  expect(Object.keys(apresAnnuler.state.progression)).toEqual(['c1-m1']);

  await page.getByRole('button', { name: 'Recommencer' }).click();
  await page.getByRole('button', { name: 'Oui, tout effacer' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL('/');
  const apres = await page.evaluate(() => JSON.parse(localStorage.getItem('branches:v1') ?? '{}') as { state: { progression: object; theme: string; chapitresDecouverts: number[] } });
  expect(apres.state.progression).toEqual({});
  expect(apres.state.theme).toBe('sombre');
  expect(apres.state.chapitresDecouverts).toEqual([1]);
});

// Section 4 : sur téléphone.

for (const [largeur, hauteur] of [
  [360, 740],
  [390, 844],
] as const) {
  test(`section 4 : à ${largeur} × ${hauteur}, la fenêtre reste dans l’écran, sans défilement horizontal, boutons ≥ 44 px`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: hauteur });
    await neuf(page);
    await ouvrirParametres(page);
    const cadre = await page.getByRole('dialog', { name: 'Paramètres' }).evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { gauche: b.left, haut: b.top, droite: b.right, bas: b.bottom };
    });
    expect(cadre.gauche).toBeGreaterThanOrEqual(0);
    expect(cadre.haut).toBeGreaterThanOrEqual(0);
    expect(cadre.droite).toBeLessThanOrEqual(largeur);
    expect(cadre.bas).toBeLessThanOrEqual(hauteur);
    const debord = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(debord).toBeLessThanOrEqual(0);
    const petits = await page.getByRole('dialog', { name: 'Paramètres' }).evaluate((el) =>
      Array.from(el.querySelectorAll('button, label'))
        .map((b) => ({ nom: b.textContent, h: b.getBoundingClientRect().height }))
        .filter((b) => b.h < 44),
    );
    expect(petits).toEqual([]);
  });
}

test('section 4 : capture 390 × 844', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await neuf(page);
  await ouvrirParametres(page);
  await page.screenshot({ path: 'verifications/correctif-4/parametres-mobile-390.png' });
});
