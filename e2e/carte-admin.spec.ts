import { test } from '@playwright/test';

// Aperçu de design : /carte/admin montre tous les chapitres. Capture pour contrôle visuel.
test('capture de /carte/admin en 1440 px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/carte/admin');
  await page.screenshot({ path: 'verifications/correctif-3/carte-admin-1440.png', fullPage: true });
});
