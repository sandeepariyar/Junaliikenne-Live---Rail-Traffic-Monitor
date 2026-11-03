import { test } from '@playwright/test';

// Generates README screenshots: `npx playwright test tests/screenshots.spec.ts`
test('screenshots', async ({ page }) => {
  await page.route('**/rata.digitraffic.fi/**', (r) => r.abort());
  await page.goto('./');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'docs/screenshot.png' });
  await page.locator('section[aria-labelledby="map-heading"], main section').first().screenshot({ path: 'docs/map-2d.png' });
  await page.getByRole('radio', { name: /3D/ }).or(page.getByRole('button', { name: /3D/ })).first().click();
  await page.waitForTimeout(4000);
  await page.locator('main section').first().screenshot({ path: 'docs/map-3d.png' });
});
