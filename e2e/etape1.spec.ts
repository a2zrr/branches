import { expect, test } from '@playwright/test';

// En production (npm run preview), les routes /dev/* n'existent pas : elles tombent sur « Introuvable ».
const ROUTES: { route: string; h1: string }[] = [
  { route: '/', h1: 'Git, version jeu vidéo' },
  { route: '/carte', h1: 'Carte des missions' },
  { route: '/mission/c1-m1', h1: 'Ton premier commit' },
  { route: '/mission/c1-m1/fin', h1: 'Carte des missions' },
  { route: '/parametres', h1: 'Paramètres' },
  { route: '/dev/design-system', h1: 'Introuvable' },
  { route: '/dev/graphe', h1: 'Introuvable' },
  { route: '/inexistante', h1: 'Introuvable' },
];

test.describe('étape 1 : socle', () => {
  test('chaque route affiche son <h1>, sans erreur de console', async ({ page }) => {
    const erreurs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') erreurs.push(msg.text());
    });
    page.on('pageerror', (err) => erreurs.push(err.message));

    for (const { route, h1 } of ROUTES) {
      await page.goto(route);
      await expect(page.locator('h1').first()).toHaveText(h1);
    }
    expect(erreurs).toEqual([]);
  });

  test('le mode sombre met data-theme="sombre" et survit à un rechargement', async ({ page }) => {
    await page.goto('/parametres');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'clair');
    await page.getByRole('button', { name: 'Sombre' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'sombre');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'sombre');
  });

  test('aucune requête réseau hors de localhost pendant le parcours', async ({ page }) => {
    const horsLocal: string[] = [];
    page.on('request', (req) => {
      const hote = new URL(req.url()).hostname;
      if (hote !== '127.0.0.1' && hote !== 'localhost') horsLocal.push(req.url());
    });
    for (const { route } of ROUTES) {
      await page.goto(route);
    }
    expect(horsLocal).toEqual([]);
  });
});
