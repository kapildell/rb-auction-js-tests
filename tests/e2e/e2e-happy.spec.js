const { test, expect } = require('@playwright/test');
const { LocationsPage } = require('../../pages/locations.page');
const { YardPage } = require('../../pages/yard.page');
const { SearchPage } = require('../../pages/search.page');

test.describe('E2E Happy Path Scenarios', () => {

  test('Scenario 1 - Locations directory', async ({ page }) => {
    const locationsPage = new LocationsPage(page);
    await locationsPage.navigate();

    // 1.1 Heading & Intro
    await expect(locationsPage.heading).toBeVisible();
    const introText = await locationsPage.introText.first().textContent();
    expect(introText).toMatch(/Ritchie Bros\.?\s+.*offers\s+over\s+60\s+permanent\s+auction\s+sites\s+and\s+local\s+yards/i);

    // 1.2 Satellite note
    const satelliteNote = page.locator("//*[contains(normalize-space(string(.)), 'satellite') and contains(normalize-space(string(.)), 'asterisk')]");
    await expect(satelliteNote.first()).toBeVisible({ timeout: 10000 });

    // 1.3 Country Groups
    const countryHeadings = await locationsPage.countryHeadings.allInnerTexts({ timeout: 10000 });
    expect(countryHeadings.length).toBeGreaterThanOrEqual(6);
    expect(countryHeadings[0]).toMatch(/United States/i);
    expect(countryHeadings[1]).toMatch(/Canada/i);
    const requiredCountries = ['United States', 'Canada', 'Australia', 'United Kingdom', 'Netherlands', 'UAE'];
    for (const country of requiredCountries) {
      expect(countryHeadings.some(h => h.toLowerCase().includes(country.toLowerCase()))).toBeTruthy();
    }

    // 1.4 US Locations Count (> 20) & Specific Cities
    const usLinks = await locationsPage.getSitesByCountry('United States');
    expect(usLinks.length).toBeGreaterThan(20);
    const usText = await Promise.all(usLinks.map(l => l.innerText()));
    ['Phoenix', 'Salt Lake City', 'Houston', 'Las Vegas', 'Atlanta'].forEach(city => {
      expect(usText.some(t => t.includes(city))).toBeTruthy();
    });

    // 1.5 Canadian Locations Count (> 10) & Specific Cities
    const caLinks = await locationsPage.getSitesByCountry('Canada');
    expect(caLinks.length).toBeGreaterThan(10);
    const caText = await Promise.all(caLinks.map(l => l.innerText()));
    ['Edmonton', 'Montreal', 'Toronto', 'Regina', 'Saskatoon'].forEach(city => {
      expect(caText.some(t => t.includes(city))).toBeTruthy();
    });

    // 1.6 & 1.7 Satellite vs Permanent Counts
    const allLinks = await page.locator('a[href*="/lp/"]').allInnerTexts();
    const satellites = allLinks.filter(text => text.includes('*'));
    const permanents = allLinks.filter(text => !text.includes('*'));

    expect(satellites.length).toBeGreaterThan(15);
    expect(permanents.length).toBeGreaterThan(25);
    expect(allLinks.length).toBeGreaterThan(60);

    expect(allLinks.some(t => t.includes('San Antonio') && t.includes('*'))).toBeTruthy();
    expect(allLinks.some(t => t.includes('Calgary') && t.includes('*'))).toBeTruthy();
    expect(allLinks.some(t => t.includes('Phoenix') && !t.includes('*'))).toBeTruthy();
    expect(allLinks.some(t => t.includes('Edmonton') && !t.includes('*'))).toBeTruthy();

    // 1.9 Toggle Controls
    const auctionSitesToggle = page.locator('button, [role="tab"]').filter({ hasText: /^Auction sites$/i });
    const repToggle = page.locator('button, [role="tab"]').filter({ hasText: /^Local representatives$/i });
    await expect(auctionSitesToggle).toBeVisible();
    await expect(repToggle).toBeVisible();
    await repToggle.click();
    const searchRepresentativesText = page.locator("//*[contains(normalize-space(string(.)), 'Search for representatives')]");
    await expect(searchRepresentativesText.first()).toBeVisible();
  });

  test('Scenario 2 - Open Edmonton yard page', async ({ page }) => {
    const locationsPage = new LocationsPage(page);
    await locationsPage.navigate();

    const edmontonLink = await locationsPage.getSiteLink('Edmonton');
    const text = await edmontonLink.innerText();
    expect(text).not.toContain('*');

    await edmontonLink.click();
    await expect(page).toHaveURL(/\/lp\/edmonton-ab/);
    await expect(page.getByRole('heading', { name: /Edmonton/i }).nth(0)).toBeVisible();
  });

  test('Scenario 3 - Edmonton yard page', async ({ page }) => {
    const yardPage = new YardPage(page);
    await yardPage.navigate('edmonton-ab');

    // 3.1 Details
    await expect(yardPage.address.nth(0)).toContainText('1500 Sparrow Drive, Nisku, AB, Canada, T9E 8H6');
   // await expect(yardPage.address.nth(0)).toContainText('T9E 8H6');
    await expect(yardPage.officeHours).toBeVisible();
    await expect(yardPage.phone).toBeVisible();

    // 3.2 Auction events
    await expect(yardPage.auctionEventsHeading).toBeVisible();
    const eventCount = await yardPage.eventCards.count();
    expect(eventCount).toBeGreaterThanOrEqual(1);
    expect(await yardPage.eventCardsdate.nth(0)).toContainText(/[A-Z][a-z]{2} \d+\s*-\s*[A-Z][a-z]{2} \d+/);
    // 3.3 About section
    await expect(yardPage.aboutSection).toBeVisible({timeout:10000});
    await expect(yardPage.aboutSectionText).toContainText(/drop-off|inspection|pick-up/i);
    // 3.4 Carousel cards
    await expect(yardPage.ItemsInYard).toBeVisible();
    const categoryCards = await yardPage.carouselCards.all();
    expect(categoryCards.length).toBeGreaterThan(5);

  // 2. Assert that the carousel contains at least one of the other items
    const matchingCards = await yardPage.carouselCards.filter({
  hasText: /Harvesting Equipment|Agricultural Tractors|Sprayers|Excavator Attachments/i
})
    await expect(matchingCards.first()).toBeVisible();

    // 3.5 Seller form CTA
    await expect(yardPage.sellerCTAForm).toBeVisible();
    await expect(yardPage.sellerCTAFormTitle).toBeVisible();
    await expect(yardPage.sellerFormPhone).toBeVisible();

    // 3.6 Representatives tab
    if (await yardPage.repsTab.isVisible()) {
      await yardPage.repsTab.click();
      const repCardsCount = await yardPage.repCards.count();
      expect(repCardsCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('Scenario 4 - Edmonton inventory search', async ({ page }) => {
    const searchPage = new SearchPage(page);
    await searchPage.navigate('Edmonton');

    await expect(searchPage.totalResultText).toBeVisible();
    const resultText = await searchPage.totalResultText.innerText();

    const totalMatch = resultText.match(/([\d,.]+k?)\s*results/i) || resultText.match(/of\s*([\d,.]+)/i);
    expect(totalMatch).not.toBeNull();
    console.log(`Parsed Total Results: ${totalMatch[1]}`);

    const cards = await searchPage.resultCards.all();
    console.log(`First 5 Titles:`);
    for (let i = 0; i < Math.min(5, cards.length); i++) {
      const title = await cards[i].locator('h2, h3, [class*="title"]').innerText();
      console.log(` ${i + 1}: ${title.trim()}`);
      expect(title.trim().length).toBeGreaterThan(0);
    }
  });

});