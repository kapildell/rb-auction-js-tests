class SearchPage {
  constructor(page) {
    this.page = page;
    this.totalResultText = page.locator('[data-testid="search-count-header"]');
    this.resultCards = page.locator('[data-testid*="search-result"], [data-testid*="lot-card"], [class*="search-result"], [class*="lot-card"]');
  }

  async navigate(query = 'Edmonton') {
    await this.page.goto(`/search?freeText=${encodeURIComponent(query)}`);
  }
}

module.exports = { SearchPage };