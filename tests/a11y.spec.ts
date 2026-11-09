import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function audit(page: Page, label: string) {
  const res = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  for (const v of res.violations) {
    console.log(`[${label}] ${v.impact} ${v.id}: ${v.help} (${v.nodes.length})`);
    v.nodes.slice(0, 3).forEach((n) => console.log('   ', n.target.join(' '), n.failureSummary?.split('\n')[1] ?? ''));
  }
  expect(bad.map((v) => v.id), `${label}: serious/critical axe violations`).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  // Deterministic: run against the bundled example scenario, not the live API.
  await page.route('**/rata.digitraffic.fi/**', (r) => r.abort());
  await page.goto('./');
  await page.waitForTimeout(800);
});

test('dashboard (2D) has no serious/critical violations', async ({ page }) => {
  await audit(page, '2D');
});

test('English UI and 3D view', async ({ page }) => {
  await page.getByRole('button', { name: /^EN$|English/i }).first().click().catch(() => {});
  await audit(page, 'en');
});

test('quick search dialog: focus trap, Escape, focus return', async ({ page }) => {
  const trigger = page.getByRole('button', { name: /Hae|Search/ }).first();
  await trigger.focus();
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await audit(page, 'search');
  for (let i = 0; i < 15; i++) await page.keyboard.press('Tab');
  expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('tabs support arrow-key navigation', async ({ page }) => {
  const tabs = page.getByRole('tab');
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(1)).toBeFocused();
  await audit(page, 'tab2');
});

test('reduced motion toggle is a switch', async ({ page }) => {
  const sw = page.getByRole('switch', { name: /Vähennä liikettä|Reduce motion/i });
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
});

test('skip link and lang attribute', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: /Siirry pääsisältöön|Skip to main content/ })).toBeFocused();
  expect(await page.getAttribute('html', 'lang')).toBe('fi');
});

test('train detail and design-system dialogs', async ({ page }) => {
  await page.getByRole('button', { name: /^IC 27/ }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await audit(page, 'train-detail');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('button', { name: /Design System/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await audit(page, 'design-system');
});

test('3D view', async ({ page }) => {
  await page.getByRole('radio', { name: /3D/ }).click();
  await page.waitForTimeout(1500);
  await audit(page, '3D');
});

// ---- Data provenance states -------------------------------------------------

const LIVE_FIXTURE = [
  { trainNumber: 27, departureDate: '2026-11-09', speed: 118, timestamp: new Date().toISOString(), location: { type: 'Point', coordinates: [24.94, 60.17] } },
  { trainNumber: 9131, departureDate: '2026-11-09', speed: 0, timestamp: new Date().toISOString(), location: { type: 'Point', coordinates: [23.76, 61.5] } },
];

test('live mode shows only real API fields, no scenario data', async ({ page }) => {
  await page.unroute('**/rata.digitraffic.fi/**');
  await page.route('**/rata.digitraffic.fi/**', (r) => r.fulfill({ json: LIVE_FIXTURE }));
  await page.getByRole('button', { name: /Digitraffic live/ }).click();
  const badge = page.getByTestId('data-source-badge');
  await expect(badge).toHaveAttribute('data-state', 'live');
  // Only the two fixture trains; scenario trains (IC 27 scenario, IC 35 …) are gone.
  await expect(page.getByRole('row', { name: /IC 35/ })).toHaveCount(0);
  await expect(page.getByText('Viive ei saatavilla').first()).toBeVisible();
  // No simulated alert cards or actions in live mode.
  await expect(page.getByText(/Koulutusskenaario — ei todellisia toimenpiteitä/)).toHaveCount(0);
  await audit(page, 'live');
});

test('offline live mode: no silent fallback, banner offers scenario', async ({ page }) => {
  await page.getByRole('button', { name: /Digitraffic live/ }).click();
  const banner = page.getByTestId('data-state-banner');
  await expect(banner).toBeVisible();
  await expect(page.getByTestId('data-source-badge')).toHaveAttribute('data-state', 'offline');
  await expect(page.getByRole('row', { name: /IC 27/ })).toHaveCount(0);
  await audit(page, 'offline');
  await banner.getByRole('button', { name: /koulutusskenaarioon|training scenario/i }).click();
  await expect(page.getByTestId('data-source-badge')).toHaveAttribute('data-state', 'scenario');
  await expect(page.getByText(/Koulutusskenaario — ei todellisia toimenpiteitä/)).toBeVisible();
});

test('stale state after 60 s without a successful update', async ({ page }) => {
  await page.clock.install();
  await page.goto('./');
  await page.unroute('**/rata.digitraffic.fi/**');
  let ok = true;
  await page.route('**/rata.digitraffic.fi/**', (r) => (ok ? r.fulfill({ json: LIVE_FIXTURE }) : r.abort()));
  await page.getByRole('button', { name: /Digitraffic live/ }).click();
  await expect(page.getByTestId('data-source-badge')).toHaveAttribute('data-state', 'live');
  ok = false;
  await page.clock.runFor(75_000);
  await expect(page.getByTestId('data-source-badge')).toHaveAttribute('data-state', 'stale');
  await expect(page.getByTestId('data-state-banner')).toContainText(/vanhentunutta|stale/i);
});

test('components.html: Lit elements work without React', async ({ page }) => {
  await page.goto('./components.html');
  const tabs = page.getByRole('tab');
  await expect(tabs).toHaveCount(3);
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('Panel: stations')).toBeVisible();
  const sw = page.getByRole('switch', { name: 'Reduce motion' });
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#toggle-out')).toHaveText('checked: true');
  await audit(page, 'components.html');
});
