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
      const country = loc.country || loc.countryName || loc.countryCode;
      expect(country).toBeDefined();
      countries.add(country);

      if (loc.isSatellite || loc.siteType === 'Satellite') satellites++;
      else permanents++;

      if (/Edmonton/i.test(loc.name)) hasEdmonton = true;
      if (/Phoenix/i.test(loc.name)) hasPhoenix = true;
    }

    expect(hasEdmonton).toBeTruthy();
    expect(hasPhoenix).toBeTruthy();
    expect(satellites).toBeGreaterThan(15);
    expect(permanents).toBeGreaterThan(25);
    expect(countries.size).toBeGreaterThan(8);
  });

//   test('API 2 - Edmonton yard page JSON', async ({ request }) => {
//     const nextData = await fetchNextData(request, '/lp/edmonton-ab');
//     const yardData = nextData.props.pageProps.yard || nextData.props.pageProps.locationDetails;

//     expect(yardData.name).toMatch(/Edmonton/i);
//     const fullAddress = JSON.stringify(yardData.address || yardData);
//     expect(fullAddress).toContain('1500 Sparrow Drive');
//     expect(fullAddress).toContain('Nisku');
//     expect(fullAddress).toContain('T9E 8H6');

//     const events = yardData.events || yardData.upcomingEvents || [];
//     if (events.length > 0) {
//       expect(events.length).toBeGreaterThanOrEqual(1);
//       expect(events[0].startDate || events[0].date).toBeDefined();
//       expect(events[0].name || events[0].title).toMatch(/Edmonton|Nisku/i);
//     }

//     const rawCategories = yardData.itemsInYard || yardData.categories || [];
//     const flattenedCategories = rawCategories.flatMap(c => c.subCategories ? [c, ...c.subCategories] : [c]);

//     expect(flattenedCategories.length).toBeGreaterThan(5);
//     const categoryNames = flattenedCategories.map(c => c.categoryLocalized || c.name);
//     expect(categoryNames.some(name => /Excavators/i.test(name))).toBeTruthy();
//   });

//   test('API 3 - Edmonton inventory search API', async ({ request }) => {
//     const response = await request.post('/api/search', {
//       data: {
//         freeText: 'Edmonton',
//         skip: 0,
//         take: 60
//       }
//     });

//     expect(response.status()).toBe(200);
//     const body = await response.json();

//     const totalAmount = body.totalAmount ?? body.totalHits ?? body.pagination?.total;
//     expect(totalAmount).toBeGreaterThan(0);

//     const items = body.items || body.results || body.documents || [];
//     expect(items.length).toBeGreaterThan(0);

//     console.log(`API Total Hits: ${totalAmount}`);
//     console.log(`First 5 Asset Descriptions:`);
//     items.slice(0, 5).forEach((item, index) => {
//       const desc = item.assetDescription || item.title || item.description;
//       expect(desc).toBeDefined();
//       console.log(` ${index + 1}: ${desc}`);
//     });
//   });

});