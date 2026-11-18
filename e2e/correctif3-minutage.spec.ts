import { expect, test } from '@playwright/test';

// Correctif 3, étape 5 : mesure du minutage réel du voile (sans captures, qui ralentissent la page).

test('étape 5 : le voile est retiré entre 1 600 et 1 900 ms après le début', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const tout = Object.fromEntries(
    ['c1-m1', 'c1-m2', 'c1-m3', 'c1-m4', 'c1-m5', 'c1-m6'].map((id) => [id, { etoiles: 3, commandes: 2, reussie: true }]),
  );
  await page.addInitScript(
    ([etat]) => {
      localStorage.setItem('branches:v1', JSON.stringify({ state: etat, version: 2 }));
    },
    [{ theme: 'clair', progression: tout, xp: 180, chapitresDecouverts: [1] }] as const,
  );
  await page.goto('/carte');
  const mesure = await page.evaluate(
    () =>
      new Promise<{ apparition: number | null; retrait: number | null }>((resolve) => {
        const debut = performance.now();
        let apparition: number | null = null;
        let retrait: number | null = null;
        const observe = () => {
          const present = document.querySelector('[data-voile]') !== null;
          if (present && apparition === null) apparition = performance.now() - debut;
          if (!present && apparition !== null && retrait === null) {
            retrait = performance.now() - debut;
            resolve({ apparition, retrait });
            return;
          }
          if (performance.now() - debut > 6000) resolve({ apparition, retrait });
          else requestAnimationFrame(observe);
        };
        observe();
      }),
  );
  expect(mesure.apparition).not.toBeNull();
  expect(mesure.retrait).not.toBeNull();
  // Le voile apparaît tout de suite ; il est retiré à 1 700 ms après le début de l'animation.
  const duree = (mesure.retrait ?? 0) - (mesure.apparition ?? 0);
  expect(duree).toBeGreaterThan(1500);
  expect(duree).toBeLessThan(2600);
});
