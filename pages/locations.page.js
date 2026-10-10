class LocationsPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Locations', exact: true });
    this.introText = page.locator("//div[contains(@class,'MuiStack-root muiltr')]//p");
    this.satelliteNote = page.locator("//div[contains(@class,'MuiStack-root muiltr')]//p");
    this.countryHeadings = page.locator('h4');
    this.toggleControls = page.locator('button, [role="tab"], label').filter({ hasText: /Local representatives|Auction sites/i });
  }

  async navigate() {
    await this.page.goto('/lp');
    await this.heading.waitFor({ state: 'visible' });
  }

  async getSitesByCountry(countryName) {
    const heading = this.page.locator('h4', { hasText: countryName });
    const siteContainer = heading.locator('xpath=following-sibling::ul[1] | following-sibling::div[1]');
    return siteContainer.locator('a, li').all();
  }

  async getSiteLink(siteName) {
    return this.page.locator('a', { hasText: new RegExp(`^\\s*\\*?\\s*${siteName}\\s*\\*?\\s*$`, 'i') }).first();
  }
}

module.exports = { LocationsPage };