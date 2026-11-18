import { expect, test, type Page } from '@playwright/test';

// Correctif 2, sections 1 et 2 : en-tête pleine largeur, conteneur 1440 px, popover à côté de la pastille.

const REUSSIES = ['c1-m1', 'c1-m2', 'c1-m3', 'c1-m4', 'c1-m5'];

async function partie(page: Page, reussies: string[]) {
  const progression = Object.fromEntries(
    reussies.map((id) => [id, { etoiles: 3, commandes: 2, reussie: true }]),
  );
  await page.addInitScript(
    ([etat]) => {
      if (localStorage.getItem('branches:v1') === null) {
        localStorage.setItem('branches:v1', JSON.stringify({ state: etat, version: 1 }));
      }
    },
    [{ theme: 'clair', progression, xp: 30 }] as const,
  );
}

async function rect(page: Page, selecteur: string) {
  return page
    .locator(selecteur)
    .first()
    .evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { x: b.x, y: b.y, w: b.width, h: b.height, droite: b.right, bas: b.bottom };
    });
}

test.describe('correctif 2 : en-tête et conteneur', () => {
  for (const route of ['/', '/carte']) {
    test(`1920 × 1080 sur ${route} : logo et roue à moins de 40 px des bords`, async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await partie(page, []);
      await page.goto(route);
      const logo = await rect(page, 'header a[aria-label="Branchés, accueil"]');
      const roue = await rect(page, '#bouton-parametres');
      expect(logo.x).toBeLessThan(40);
      expect(1920 - roue.droite).toBeLessThan(40);
    });

    test(`1920 × 1080 sur ${route} : le contenu fait 1440 px et est centré`, async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await partie(page, []);
      await page.goto(route);
      const principal = await rect(page, '.conteneur');
      expect(Math.round(principal.w)).toBe(1440);
      expect(Math.round(principal.x)).toBe(240);
    });
  }

  test('captures 1440 et 1920 : accueil et carte', async ({ page }) => {
    for (const largeur of [1440, 1920]) {
      await page.setViewportSize({ width: largeur, height: 1000 });
      await partie(page, []);
      await page.goto('/');
      await page.screenshot({ path: `verifications/correctif-2/accueil-${largeur}.png` });
      await page.goto('/carte');
      await page.screenshot({ path: `verifications/correctif-2/carte-${largeur}.png`, fullPage: true });
    }
  });
});

test.describe('correctif 2 : popover de la carte', () => {
  // Correctif 3 (prime sur le correctif 2) : le popover s'ouvre du côté des titres, c'est-à-dire
  // à droite quand la pastille est décalée à droite, et à gauche sinon.
  test('mission en cours décalée à droite (c1-m4) : le popover est à droite (côté des titres)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await partie(page, REUSSIES.slice(0, 3));
    await page.goto('/carte');
    const pastille = await rect(page, 'button[aria-label^="Mission 4,"]');
    const popover = await rect(page, '[role="group"][aria-label="Mission 4"]');
    expect(popover.x).toBeGreaterThanOrEqual(pastille.x + pastille.w / 2 + 60);
    expect(Math.round(popover.w)).toBe(280);
    expect(Math.round(popover.y - pastille.y)).toBe(-6);
  });

  test('mission en cours décalée à gauche (c1-m6) : le popover est à gauche (côté des titres)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await partie(page, REUSSIES);
    await page.goto('/carte');
    const pastille = await rect(page, 'button[aria-label^="Mission 6,"]');
    const popover = await rect(page, '[role="group"][aria-label="Mission 6"]');
    expect(popover.droite).toBeLessThanOrEqual(pastille.x + pastille.w / 2 - 60);
  });

  test('le popover ne chevauche aucune autre pastille ni aucun titre', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await partie(page, REUSSIES.slice(0, 3));
    await page.goto('/carte');
    const chevauchements = await page.evaluate(() => {
      const popover = document.querySelector('[role="group"][aria-label="Mission 4"]');
      if (popover === null) return ['popover absent'];
      const p = popover.getBoundingClientRect();
      const perdus: string[] = [];
      for (const li of Array.from(document.querySelectorAll('ol > li'))) {
        if (li.contains(popover)) continue;
        const b = li.getBoundingClientRect();
        const croise = p.left < b.right && p.right > b.left && p.top < b.bottom && p.bottom > b.top;
        if (croise) perdus.push(li.textContent);
      }
      return perdus;
    });
    expect(chevauchements).toEqual([]);
  });

  test('apparition : scale 0,85 → 1 et opacité, 450 ms, rebond', async ({ page }) => {
    await partie(page, REUSSIES.slice(0, 3));
    await page.goto('/carte');
    const anim = await page.locator('[role="group"][aria-label="Mission 4"]').evaluate((el) => {
      const s = getComputedStyle(el);
      return { nom: s.animationName, duree: s.animationDuration, fonction: s.animationTimingFunction };
    });
    expect(anim.nom).toContain('apparition');
    expect(anim.duree).toBe('0.45s');
    expect(anim.fonction).toContain('cubic-bezier(0.34, 1.56, 0.64, 1)');
  });
});

test.describe('correctif 2 : accords', () => {
  for (const route of ['/', '/carte']) {
    test(`aucun « 1 mot-au-pluriel » sur ${route}`, async ({ page }) => {
      await partie(page, ['c1-m1']);
      await page.goto(route);
      const texte = await page.evaluate(() => document.body.innerText);
      expect(texte).not.toMatch(/1 \w+s/);
      expect(texte).toMatch(/1 notion maîtrisée sur \d+/);
    });
  }
});
