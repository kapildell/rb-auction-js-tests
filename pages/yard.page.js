class YardPage {
  constructor(page) {
    this.page = page;
    this.address = page.locator('text=/1500 Sparrow Drive|Nisku|T9E 8H6/i');
    this.officeHours = page.getByText('Mon - Fri,');
    this.phone = page.locator('a[href^="tel:"]').first();
    this.auctionEventsHeading = page.getByRole('heading', { name: /Auction events/i });
    this.eventCards = page.locator("//div[contains(@class,'MuiStack-root muiltr') and (@role='list')]//a");
    this.eventCardsdate = page.locator("//p[contains(@data-testid,'auction-card-date-range-')]");
    this.aboutSection = page.locator("//h4[contains(text(),'About this yard')]")
    this.aboutSectionText = page.locator("//p[contains(text(),'Please note:')]");
    this.ItemsInYard = page.locator("//h4[contains(text(),'Items in yard')]");
    this.carouselCards = page.locator('//a[contains(@href, "https://www.rbauction.com/cp")]//h6');
    this.sellerCTAFormTitle = page.locator("//h6[contains(text(), 'Become a seller')]");
    this.sellerCTAForm = page.locator("div#seller-form");
    this.sellerFormPhone = page.locator('//a[contains(text(), "+1-866-901-2104")]');
    this.repsTab = page.getByRole('tab', { name: /Representatives/i }).or(page.locator('button:has-text("Representatives")'));
    this.repCards = page.locator("//div[contains(@class,'MuiStack-root muiltr-iltku')]");
  }
x
  async navigate(slug = 'edmonton-ab') {
    await this.page.goto(`/lp/${slug}`);
  }
}

module.exports = { YardPage };