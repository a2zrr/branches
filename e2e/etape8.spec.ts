import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const DOSSIER = resolve(import.meta.dirname, '../verifications/etape-8');
mkdirSync(DOSSIER, { recursive: true });

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

test.describe('étape 8 : exercice conflit', () => {
  test('affichage : marqueurs annotés, sortie de la fusion, cartes de choix', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await avecTheme(page);
    await page.goto('/mission/c2-m2?debug=1');
    const fichier = page.getByRole('region', { name: /Fichier en conflit/ });
    await expect(fichier.getByText('<<<<<<< HEAD', { exact: true })).toBeVisible();
    await expect(fichier.getByText('début de TA version')).toBeVisible();
    await expect(fichier.getByText('séparation')).toBeVisible();
    await expect(fichier.getByText('fin de LEUR version')).toBeVisible();
    await expect(page.getByText('CONFLICT (content): Merge conflict in src/BoutonPayer.jsx')).toBeVisible();
    await page.screenshot({ path: resolve(DOSSIER, 'c2-m2-1-etat-initial.png') });
  });

  test('clavier : 1, 2 et 3 choisissent ; l’aperçu suit ; réaction propre à chaque choix', async ({
    page,
  }) => {
    const reactions: Record<string, string> = {
      '1': 'Propre et lisible. Hédi approuve.',
      '2': 'Un bouton qui clignote en pleine démo… courageux.',
      '3': "Deux boutons Payer ? Vérifie que c'est voulu.",
    };
    for (const touche of ['1', '2', '3'] as const) {
      await avecTheme(page);
      await page.goto('/mission/c2-m2?debug=1');
      await page.locator('body').click({ position: { x: 5, y: 5 } });
      await page.keyboard.press(touche);
      const apercu = page.getByRole('region', { name: 'Aperçu du fichier résultant' });
      if (touche === '2') await expect(apercu).toContainText('PAYER VITE');
      if (touche === '1') await expect(apercu).toContainText('Payer {total} €');
      if (touche === '3') {
        await expect(apercu).toContainText('Payer {total} €');
        await expect(apercu).toContainText('PAYER VITE');
      }
      await page.getByRole('button', { name: 'Vérifier' }).click();
      await expect(page.getByRole('status')).toContainText(reactions[touche] ?? '');
      await page.screenshot({ path: resolve(DOSSIER, `c2-m2-choix-${touche}.png`) });
      await page.getByRole('button', { name: 'Continuer' }).click();
      await expect(page).toHaveURL(/\/mission\/c2-m2\/fin$/);
    }
  });

  test('sombre : capture de l’écran de conflit', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await avecTheme(page, 'sombre');
    await page.goto('/mission/c2-m2?debug=1');
    await page.screenshot({ path: resolve(DOSSIER, 'c2-m2-sombre.png') });
  });

  test('axe : 0 violation serious ou critical sur l’écran de conflit', async ({ page }) => {
    await avecTheme(page);
    await page.goto('/mission/c2-m2?debug=1');
    const resultats = await new AxeBuilder({ page }).analyze();
    const graves = resultats.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(graves.map((v) => `${v.id} : ${v.help}`)).toEqual([]);
  });

  test('la solution choix:mienne se termine dans l’interface', async ({ page }) => {
    await avecTheme(page);
    await page.goto('/mission/c2-m2?debug=1');
    await page.keyboard.press('1');
    await page.getByRole('button', { name: 'Vérifier' }).click();
    await expect(page.getByRole('status')).toContainText('Propre et lisible');
    await page.getByRole('button', { name: 'Continuer' }).click();
    await expect(page).toHaveURL(/\/mission\/c2-m2\/fin$/);
  });
});
