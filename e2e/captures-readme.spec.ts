import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { test, expect, type Browser, type Page } from '@playwright/test';

// Captures du README (sautées sauf si CAPTURES=1). Chaque état part d'une partie connue.

const SORTIE = resolve(import.meta.dirname, '../docs/captures');

const C1_TERMINE = ['c1-m1', 'c1-m2', 'c1-m3', 'c1-m4', 'c1-m5', 'c1-m6'];
const TROIS_PREMIERES = ['c1-m1', 'c1-m2', 'c1-m3'];

function progression(ids: string[]) {
  return Object.fromEntries(
    ids.map((id) => [id, { etoiles: 3, commandes: 2, reussie: true }]),
  );
}

async function partie(page: Page, ids: string[], chapitres: number[] = [1]) {
  await page.addInitScript(
    ([etat]) => {
      localStorage.setItem('branches:v1', JSON.stringify({ state: etat, version: 3 }));
    },
    [{ theme: 'clair', progression: progression(ids), xp: ids.length * 30, chapitresDecouverts: chapitres }] as const,
  );
}

async function taper(page: Page, commande: string) {
  const champ = page.getByLabel('Commande Git');
  await champ.fill(commande);
  await champ.press('Enter');
}

test.describe('captures du README', () => {
  test.skip(process.env.CAPTURES !== '1', 'captures du README : lancer avec CAPTURES=1');
  test.use({ reducedMotion: 'reduce', colorScheme: 'light' });

  test.beforeAll(() => {
    mkdirSync(SORTIE, { recursive: true });
  });

  test('accueil, carte, jeu, conflit, téléphone', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await partie(page, TROIS_PREMIERES);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.screenshot({ path: `${SORTIE}/accueil.png` });

    await page.goto('/carte');
    await expect(page.getByRole('button', { name: /Mission 4, La clé qui fuit, en cours/ })).toBeVisible();
    await page.screenshot({ path: `${SORTIE}/carte.png` });

    await page.goto('/mission/c1-m4');
    await taper(page, 'git status');
    await taper(page, 'git log --oneline');
    await expect(page.getByLabel('Commande Git')).toBeVisible();
    await page.screenshot({ path: `${SORTIE}/jeu.png` });

    await partie(page, C1_TERMINE, [1, 2]);
    await page.goto('/mission/c2-m2');
    await expect(page.getByText('Conflit sur le bouton Payer').first()).toBeVisible();
    await page.screenshot({ path: `${SORTIE}/conflit.png` });

    await page.setViewportSize({ width: 390, height: 844 });
    await partie(page, TROIS_PREMIERES);
    await page.goto('/carte');
    await expect(page.getByRole('button', { name: /Mission 4, La clé qui fuit, en cours/ })).toBeVisible();
    await page.screenshot({ path: `${SORTIE}/telephone.png` });
  });

  test('nuages : images successives de l’ouverture, assemblées en GIF', async ({ browser }: { browser: Browser }) => {
    const images = resolve(import.meta.dirname, '../test-results/captures-nuages');
    mkdirSync(images, { recursive: true });
    const contexte = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'no-preference',
      colorScheme: 'light',
    });
    const page = await contexte.newPage();
    await page.addInitScript(() => {
      localStorage.setItem(
        'branches:v1',
        JSON.stringify({
          state: {
            theme: 'clair',
            progression: Object.fromEntries(
              ['c1-m1', 'c1-m2', 'c1-m3', 'c1-m4', 'c1-m5', 'c1-m6'].map((id) => [
                id,
                { etoiles: 3, commandes: 2, reussie: true },
              ]),
            ),
            xp: 180,
            chapitresDecouverts: [1],
          },
          version: 3,
        }),
      );
    });
    await page.goto('/carte');
    const images10 = 30;
    for (let i = 0; i < images10; i++) {
      await page.screenshot({ path: resolve(images, `f${String(i).padStart(2, '0')}.png`) });
      await page.waitForTimeout(60);
    }
    await contexte.close();
    const gif = `${SORTIE}/nuages.gif`;
    execFileSync('ffmpeg', [
      '-y',
      '-framerate',
      '12',
      '-i',
      resolve(images, 'f%02d.png'),
      '-vf',
      'scale=380:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse',
      gif,
    ]);
    expect(statSync(gif).size).toBeLessThan(3 * 1024 * 1024);
  });
});
