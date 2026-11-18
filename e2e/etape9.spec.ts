import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const DOSSIER = resolve(import.meta.dirname, '../verifications/etape-9');
mkdirSync(DOSSIER, { recursive: true });

async function neuf(page: Page) {
  await page.addInitScript(() => {
    if (localStorage.getItem('branches:v1') === null) {
      localStorage.setItem(
        'branches:v1',
        JSON.stringify({ state: { theme: 'clair', progression: {}, xp: 0 }, version: 1 }),
      );
    }
  });
}

async function taper(page: Page, commande: string) {
  const champ = page.getByLabel('Commande Git');
  await champ.fill(commande);
  await champ.press('Enter');
}

test.describe('étape 9 : fin de mission et boucle de progression', () => {
  test('c1-m4 en 3 commandes : 2 étoiles, +20 XP, carte et Ton Git mis à jour', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      if (localStorage.getItem('branches:v1') === null) {
        localStorage.setItem(
          'branches:v1',
          JSON.stringify({
            state: {
              theme: 'clair',
              progression: {
                'c1-m1': { etoiles: 3, commandes: 2, reussie: true },
                'c1-m2': { etoiles: 2, commandes: 3, reussie: true },
                'c1-m3': { etoiles: 3, commandes: 3, reussie: true },
              },
              xp: 80,
            },
            version: 1,
          }),
        );
      }
    });
    await page.goto('/mission/c1-m4?debug=1');
    await taper(page, 'git log --oneline');
    await taper(page, 'git rever a3f9c2e');
    await page.getByRole('button', { name: 'Compris' }).click();
    await taper(page, 'git revert a3f9c2e');
    await page.getByRole('button', { name: 'Vérifier' }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page).toHaveURL(/\/mission\/c1-m4\/fin$/);
    await expect(page.getByRole('heading', { name: 'Mission accomplie !' })).toBeVisible();
    await expect(page.getByRole('img', { name: '2 étoiles sur 3' })).toBeVisible();
    await expect(page.getByText('3 commandes — optimal : 2')).toBeVisible();
    await expect(
      page.getByText('+20 XP · git revert rejoint ton Git : 4 commandes maîtrisées sur 15'),
    ).toBeVisible();
    await expect(page.getByText('4 / 15').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Mission suivante' })).toHaveAttribute(
      'href',
      '/mission/c1-m5',
    );
    await expect(page.getByRole('button', { name: 'Rejouer pour ★★★' })).toBeVisible();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: resolve(DOSSIER, 'fin-c1-m4-2-etoiles.png'), fullPage: true });

    await page.goto('/carte');
    await expect(
      page.getByRole('button', { name: /Mission 4, La clé qui fuit, terminée, 2 étoiles/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Mission 5, Fusionne avant 20 h, en cours/ }),
    ).toBeEnabled();
    await page.goto('/');
    await expect(page.getByRole('group', { name: 'Annuleur : débloqué' })).toBeVisible();
  });

  test('rejouer en 2 commandes donne 3 étoiles ; rejouer moins bien ne baisse jamais la note', async ({
    page,
  }) => {
    await neuf(page);
    await page.goto('/mission/c1-m4?debug=1');
    await taper(page, 'git log --oneline');
    await taper(page, 'git revert a3f9c2e');
    await page.getByRole('button', { name: 'Vérifier' }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByRole('img', { name: '3 étoiles sur 3' })).toBeVisible();

    await page.goto('/mission/c1-m4?debug=1');
    await taper(page, 'git rever a3f9c2e');
    await page.getByRole('button', { name: 'Compris' }).click();
    await taper(page, 'git log --oneline');
    await taper(page, 'git revert a3f9c2e');
    await taper(page, 'git log');
    await taper(page, 'git log');
    await page.getByRole('button', { name: 'Vérifier' }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByRole('img', { name: '1 étoile sur 3' })).toBeVisible();

    await page.goto('/carte');
    await expect(
      page.getByRole('button', { name: /Mission 4, La clé qui fuit, terminée, 3 étoiles/ }),
    ).toBeVisible();
  });

  test('rechargement : la progression reste ; export puis import redonnent la même partie', async ({
    page,
  }) => {
    await neuf(page);
    await page.goto('/mission/c1-m4?debug=1');
    await taper(page, 'git revert a3f9c2e');
    await page.getByRole('button', { name: 'Vérifier' }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.reload();
    await expect(page.getByRole('img', { name: '3 étoiles sur 3' })).toBeVisible();

    await page.goto('/parametres');
    const [telechargement] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exporter' }).click(),
    ]);
    const chemin = resolve(DOSSIER, 'branches-progression.json');
    await telechargement.saveAs(chemin);

    await page.getByRole('button', { name: 'Réinitialiser' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Réinitialiser' }).click();
    await page.goto('/carte');
    await expect(page.getByRole('button', { name: /Mission 1, Ton premier commit, en cours/ })).toBeVisible();

    await page.goto('/parametres');
    await page.locator('input[type="file"]').setInputFiles(chemin);
    await expect(page.getByRole('status')).toContainText('Progression importée');
    await page.goto('/carte');
    await expect(
      page.getByRole('button', { name: /Mission 4, La clé qui fuit, terminée, 3 étoiles/ }),
    ).toBeVisible();
    const sauvegarde = JSON.parse(readFileSync(chemin, 'utf8')) as { format: string };
    expect(sauvegarde.format).toBe('branches-progression');
  });

  test('accès direct à /fin sans résultat : retour à la carte', async ({ page }) => {
    await neuf(page);
    await page.goto('/mission/c1-m1/fin');
    await expect(page).toHaveURL(/\/carte$/);
  });

  test('mouvement réduit : pas de confettis, étoiles affichées sans animation', async ({ browser }) => {
    const contexte = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 1440, height: 900 },
    });
    const page = await contexte.newPage();
    await neuf(page);
    await page.goto('/mission/c1-m4?debug=1');
    await taper(page, 'git revert a3f9c2e');
    await page.getByRole('button', { name: 'Vérifier' }).click();
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page.getByRole('img', { name: '3 étoiles sur 3' })).toBeVisible();
    await expect(page.locator('[aria-hidden="true"] span[class*="confetti"]')).toHaveCount(0);
    await contexte.close();
  });
});
