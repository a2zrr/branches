import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const DOSSIER = resolve(import.meta.dirname, '../verifications/etape-7');
mkdirSync(DOSSIER, { recursive: true });

// Solutions lues dans les fiches : la boucle les joue dans l'interface.
const fiche = (id: string): { solution: string[]; titre: string } =>
  JSON.parse(readFileSync(resolve(import.meta.dirname, `../src/data/missions/${id}.json`), 'utf8')) as {
    solution: string[];
    titre: string;
  };

async function avecTheme(page: Page, theme: 'clair' | 'sombre' = 'clair') {
  await page.addInitScript((t) => {
    if (localStorage.getItem('branches:v1') === null) {
      localStorage.setItem(
        'branches:v1',
        JSON.stringify({ state: { theme: t, progression: {}, xp: 0 }, version: 1 }),
      );
    }
  }, theme);
}

async function taper(page: Page, commande: string) {
  const champ = page.getByLabel('Commande Git');
  await champ.fill(commande);
  await champ.press('Enter');
}

test.describe('étape 7 : coque de jeu et terminal + graphe', () => {
  test('parcours complet de c1-m4 avec captures à chaque état', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await avecTheme(page);
    await page.goto('/mission/c1-m4?debug=1');
    await expect(page.getByRole('heading', { level: 1, name: 'La clé qui fuit' })).toBeVisible();
    const etat = (nom: string) => page.screenshot({ path: resolve(DOSSIER, `c1-m4-${nom}.png`) });

    await taper(page, 'git log --oneline');
    await expect(page.getByRole('log')).toContainText(
      'e4d5f6a (HEAD -> main) style: bouton de démo plus gros',
    );
    await etat('1-log');

    await taper(page, 'git rever a3f9c2e');
    await expect(page.getByRole('alert')).toContainText('Presque !');
    await expect(page.getByRole('log')).toContainText("git: 'rever' is not a git command.");
    await etat('2-erreur');
    await page.getByRole('button', { name: 'Compris' }).click();

    await page.getByRole('button', { name: /^Indice \d/ }).click();
    await expect(page.getByRole('dialog', { name: 'Indice' })).toBeVisible();
    await page.getByRole('button', { name: 'Indice suivant' }).click();
    await etat('3-indice');
    await page.getByRole('button', { name: 'Masquer l’indice' }).click();

    await taper(page, 'git revert a3f9c2e');
    await expect(page.locator('[data-noeud="f0e1d2c"]')).toHaveAttribute('data-etat', 'nouveau');
    await expect(page.locator('[data-noeud="a3f9c2e"]')).toHaveAttribute('data-etat', 'normal');
    await etat('4-revert');

    await page.getByRole('button', { name: 'Vérifier' }).click();
    await expect(page.getByRole('status')).toContainText('Bien joué !');
    await etat('5-reussi');
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page).toHaveURL(/\/mission\/c1-m4\/fin$/);
  });

  test('git reset --hard 9b8c7d6 puis VÉRIFIER : bandeau rouge avec le message de historiqueIntact', async ({
    page,
  }) => {
    await avecTheme(page);
    await page.goto('/mission/c1-m4?debug=1');
    await taper(page, 'git reset --hard 9b8c7d6');
    await page.getByRole('button', { name: 'Vérifier' }).click();
    await expect(page.getByRole('alert')).toContainText(
      'Tu as réécrit l’historique de main'.replace('’', "'"),
    );
  });

  test('mode sombre : capture de l’écran de jeu', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await avecTheme(page, 'sombre');
    await page.goto('/mission/c1-m4?debug=1');
    await taper(page, 'git log --oneline');
    await page.screenshot({ path: resolve(DOSSIER, 'c1-m4-sombre.png') });
  });

  test('clavier : Tab complète les branches, ↑ rappelle la commande précédente', async ({ page }) => {
    await avecTheme(page);
    await page.goto('/mission/c1-m4?debug=1');
    const champ = page.getByLabel('Commande Git');
    await expect(champ).toBeFocused();
    await page.keyboard.type('git checkout fea');
    await page.keyboard.press('Tab');
    await expect(champ).toHaveValue('git checkout feature/paiement');
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('git log --oneline');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowUp');
    await expect(champ).toHaveValue('git log --oneline');
  });

  test('axe : 0 violation serious ou critical sur l’écran de jeu', async ({ page }) => {
    await avecTheme(page);
    await page.goto('/mission/c1-m4?debug=1');
    const resultats = await new AxeBuilder({ page }).analyze();
    const graves = resultats.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(graves.map((v) => `${v.id} : ${v.help}`)).toEqual([]);
  });

  test('chaque mission terminal-graphe se termine en tapant sa solution (?debug=1)', async ({ page }) => {
    test.setTimeout(240_000);
    const missions = ['c1-m1', 'c1-m2', 'c1-m3', 'c1-m4', 'c1-m5', 'c1-m6'];
    await avecTheme(page);
    for (const id of missions) {
      const { solution } = fiche(id);
      await page.goto(`/mission/${id}?debug=1`);
      for (const commande of solution) {
        await taper(page, commande);
      }
      await page.getByRole('button', { name: 'Vérifier' }).click();
      await expect(page.getByRole('status'), id).toContainText('Bien joué !');
      await page.getByRole('button', { name: 'Continuer' }).click();
      await expect(page, id).toHaveURL(new RegExp(`/mission/${id}/fin$`));
    }
  });
});
