const { test, expect } = require('@playwright/test');
const { LocationsPage } = require('../../pages/locations.page');
const { SearchPage } = require('../../pages/search.page');

test.describe('E2E Negative Path Scenarios', () => {
  test('Scenario 1 - Unknown country is not listed in the locations directory', async ({ page }) => {
    const locationsPage = new LocationsPage(page);
    await locationsPage.navigate();

    await expect(locationsPage.heading).toBeVisible();
    await expect(page.locator('h4', { hasText: /^Atlantis$/i })).toHaveCount(0);
  });

  test('Scenario 2 - Unknown auction site is not listed in the directory', async ({ page }) => {
    const locationsPage = new LocationsPage(page);
    await locationsPage.navigate();

    const unknownSiteLink = await locationsPage.getSiteLink('Atlantis Test Yard');
    await expect(unknownSiteLink).toHaveCount(0);
  });

  test('Scenario 3 - Invalid yard slug does not show Edmonton yard details', async ({ page }) => {
    await page.goto('/lp/this-yard-does-not-exist');

    await expect(page.locator('body')).not.toContainText('1500 Sparrow Drive');
    await expect(page.locator('body')).not.toContainText('T9E 8H6');
  });

  test('Scenario 4 - Search with no matching inventory returns no results', async ({ page }) => {
    const searchPage = new SearchPage(page);
    const query = 'commercial space launch equipment';
    await searchPage.navigate(query);

    await expect(page.getByRole('heading', { name: new RegExp(`No exact matches found for "${query}"`, 'i') })).toBeVisible();
  });
});