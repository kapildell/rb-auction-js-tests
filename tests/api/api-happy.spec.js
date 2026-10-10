const { test, expect } = require('@playwright/test');

async function fetchNextData(request, path) {
  const response = await request.get(path);
  if (response.status() !== 200) throw new Error(`HTTP ${response.status()}`);
  const html = await response.text();
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  if (!match) throw new Error('__NEXT_DATA__ script block not found.');
  return JSON.parse(match[1]);
}

test.describe('API Happy Path Suite', () => {

  test('API 1 - Auction sites list (/lp page JSON)', async ({ request }) => {
    const nextData = await fetchNextData(request, '/lp');
    const pageProps = nextData.props.pageProps;
    const locations = pageProps.locations || pageProps.yards || pageProps.initialState?.locations || [];

    expect(Array.isArray(locations)).toBeTruthy();
    expect(locations.length).toBeGreaterThan(60);

    let hasEdmonton = false;
    let hasPhoenix = false;
    const countries = new Set();
    let satellites = 0;
    let permanents = 0;

    for (const loc of locations) {
      expect(loc.name || loc.cityName).toBeDefined();
      const country = loc.country || loc.countryName || loc.countryCode ||
        loc.address?.country || loc.address?.countryName || loc.address?.countryCode;
      expect(country).toBeDefined();
      countries.add(country);

      const siteType = loc.type || loc.siteType;
      if (loc.isSatellite || siteType === 'Satellite') satellites++;
      else if (siteType === 'Permanent') permanents++;

      if (/Edmonton/i.test(loc.name)) hasEdmonton = true;
      if (/Phoenix/i.test(loc.name)) hasPhoenix = true;
    }

    expect(hasEdmonton).toBeTruthy();
    expect(hasPhoenix).toBeTruthy();
    expect(satellites).toBeGreaterThan(15);
    expect(permanents).toBeGreaterThan(25);
    expect(countries.size).toBeGreaterThan(8);
  });

  test('API 2 - Edmonton yard page JSON', async ({ request }) => {
    const nextData = await fetchNextData(request, '/lp/edmonton-ab');
    expect(nextData).toEqual(expect.objectContaining({
      props: expect.objectContaining({
        pageProps: expect.any(Object)
      })
    }));

    const pageProps = nextData.props.pageProps;
    const yardDetails = pageProps.yardDetails;
    expect(yardDetails.name).toMatch(/Edmonton/i);
    expect(yardDetails.address.addressLine1).toContain('1500 Sparrow Drive');
    expect(yardDetails.address.city).toContain('Nisku');
    expect(yardDetails.address.zipPostalCode).toContain('T9E 8H6');
    expect(yardDetails.contactPhone).toMatch(/\+?\d[\d\s()-]{6,}/);
    expect(yardDetails.pickupHoursFrom).toBeTruthy();
    expect(yardDetails.pickupHoursTo).toBeTruthy();

    const events = pageProps.upcomingEvents;
    expect(events).toEqual(expect.any(Array));
    expect(events.length).toBeGreaterThan(0);
    let hasEdmontonEvent = false;
    for (const event of events) {
      const startDate = event.event_start_date || event.date_of_event;
      const endDate = event.bidding_end_time || event.event_end_date;
      const eventName = event.event_advertised_name || event.name || event.title;

      expect(startDate).toBeTruthy();
      expect(endDate).toBeTruthy();
      expect(eventName).toBeTruthy();
      if (/Edmonton|Nisku/i.test(`${eventName} ${event.event_locality || ''}`)) {
        hasEdmontonEvent = true;
      }
    }
    expect(hasEdmontonEvent).toBeTruthy();

    const rawCategories = pageProps.itemsInYard;
    expect(rawCategories).toEqual(expect.any(Array));
    const categories = rawCategories.flatMap(event => event.categories || []);

    expect(categories.length).toBeGreaterThan(5);
    for (const category of categories) {
      expect(category.categoryLocalized).toBeTruthy();
      if (category.totalAssets !== undefined && category.totalAssets !== null) {
        expect(typeof category.totalAssets).toBe('number');
        expect(category.totalAssets).toBeGreaterThanOrEqual(0);
      }
    }
    const categoryNames = categories.map(category => category.categoryLocalized);
    expect(categoryNames.some(name => /Excavators/i.test(name))).toBeTruthy();
  });

  test('API 3 - Edmonton inventory search API', async ({ page }) => {
    await page.goto('/search?freeText=Edmonton', { waitUntil: 'domcontentloaded' });
    const response = await page.evaluate(async () => {
      const apiResponse = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          freeText: 'Edmonton',
          skip: 0,
          take: 60
        })
      });
      return {
        status: apiResponse.status,
        contentType: apiResponse.headers.get('content-type'),
        body: await apiResponse.text()
      };
    });

    expect(response.status).toBe(200);
    expect(response.contentType).toMatch(/application\/json/i);
    const body = JSON.parse(response.body);
    const results = body.results;
    const totalAmount = results.totalAmount;
    expect(totalAmount).toBeGreaterThan(0);

    const items = results.records;
    expect(items.length).toBeGreaterThan(0);

    console.log(`API Total Hits: ${totalAmount}`);
    console.log('First 5 Asset Descriptions:');
    for (const item of items) {
      expect(item.assetDescription).toBeTruthy();
    }
    items.slice(0, 5).forEach((item, index) => {
      console.log(` ${index + 1}: ${item.assetDescription}`);
    });
  });

});