const { test, expect } = require('@playwright/test');

async function getNextData(request, path) {
  const response = await request.get(path);
  expect(response.status()).toBe(200);
  const html = await response.text();
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  expect(match, '__NEXT_DATA__ JSON payload should be present').not.toBeNull();
  return JSON.parse(match[1]);
}

test.describe('API Negative Suite', () => {
  test('API 1 - Unknown auction site is not present in the locations payload', async ({ request }) => {
    const nextData = await getNextData(request, '/lp');
    const pageProps = nextData.props.pageProps;
    const locations = pageProps.locations || pageProps.yards || pageProps.initialState?.locations || [];

    expect(Array.isArray(locations)).toBeTruthy();
    expect(locations.length).toBeGreaterThan(0);
    expect(locations.some(location => /Atlantis Test Yard/i.test(location.name || location.cityName || ''))).toBe(false);
  });

  test('API 2 - Invalid yard slug does not return Edmonton yard details', async ({ request }) => {
    const response = await request.get('/lp/this-yard-does-not-exist');

    if (response.status() === 404) {
      expect(response.status()).toBe(404);
      return;
    }

    expect(response.status()).toBe(200);
    const html = await response.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
    if (match) {
      const pageProps = JSON.parse(match[1]).props.pageProps;
      expect(pageProps.yardDetails?.name).toBeUndefined();
    }
    expect(html).not.toContain('1500 Sparrow Drive');
  });

  test('API 3 - Inventory search with no matching category returns no exact matches', async ({ page }) => {
    const query = 'commercial space launch equipment';
    await page.goto(`/search?freeText=${encodeURIComponent(query)}`, {
      waitUntil: 'domcontentloaded'
    });
    const response = await page.evaluate(async query => {
      const apiResponse = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          freeText: query,
          skip: 0,
          take: 60
        })
      });
      return {
        status: apiResponse.status,
        contentType: apiResponse.headers.get('content-type'),
        body: await apiResponse.text()
      };
    }, query);

    expect(response.status).toBe(200);
    expect(response.contentType).toMatch(/application\/json/i);
    const results = JSON.parse(response.body).results;
    expect(results.totalAmount).toBeGreaterThan(0);
    expect(results.records.length).toBeGreaterThan(0);
    await expect(page.getByRole('heading', {
      name: new RegExp(`No exact matches found for "${query}"`, 'i')
    })).toBeVisible();
    for (const record of results.records) {
      expect(record.assetDescription).toBeTruthy();
      expect(record.assetDescription.toLowerCase()).not.toContain(query.toLowerCase());
    }
  });
});
