const { test, expect } = require('@playwright/test');
const Ajv = require('ajv');
const auctionSitesSchema = require('./schemas/auction-sites.schema.json');
const edmontonYardPageSchema = require('./schemas/edmonton-yard-page.schema.json');
const inventorySearchSchema = require('./schemas/inventory-search.schema.json');

const ajv = new Ajv({ allErrors: true });

function expectSchemaInvalid(data, schema, description) {
  const validate = ajv.compile(schema);
  expect(validate(data), `${description} should fail schema validation`).toBe(false);
}

async function getNextData(request, path) {
  const response = await request.get(path);
  expect(response.status()).toBe(200);
  const html = await response.text();
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  expect(match, '__NEXT_DATA__ JSON payload should be present').not.toBeNull();
  return JSON.parse(match[1]);
}

async function searchInventory(page, query) {
  await page.goto(`/search?freeText=${encodeURIComponent(query)}`, {
    waitUntil: 'domcontentloaded'
  });
  const urlQuery = await page.evaluate(() => new URL(window.location.href).searchParams.get('freeText'));
  const response = await page.evaluate(async searchText => {
    const apiResponse = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        freeText: searchText,
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

  return { urlQuery, response };
}

test.describe('API Negative Suite', () => {
  test('API schemas - Reject incorrect response data types and array items', async () => {
    expectSchemaInvalid(
      { locations: [] },
      auctionSitesSchema,
      'Auction sites payload with an object instead of an array'
    );
    expectSchemaInvalid(
      [{ name: 'Edmonton', country: 123 }],
      auctionSitesSchema,
      'Auction site with a numeric country'
    );
    expectSchemaInvalid(
      [{ name: 'Edmonton', country: 'Canada' }, 'invalid location'],
      auctionSitesSchema,
      'Auction sites array containing a string item'
    );

    const validYardPage = {
      yardDetails: {
        name: 'Edmonton',
        address: {
          addressLine1: '1500 Sparrow Drive',
          city: 'Nisku',
          zipPostalCode: 'T9E 8H6'
        },
        contactPhone: '+17809552486',
        pickupHoursFrom: '08:00',
        pickupHoursTo: '17:00'
      },
      upcomingEvents: [{
        event_start_date: '2026-11-03T15:00:00Z',
        bidding_end_time: '2026-11-07T02:00:00Z',
        event_advertised_name: 'Edmonton, AB, CAN'
      }],
      itemsInYard: [{
        categories: [{
          categoryLocalized: 'Excavators',
          totalAssets: 10
        }]
      }]
    };

    const invalidYardPhone = structuredClone(validYardPage);
    invalidYardPhone.yardDetails.contactPhone = 17809552486;
    expectSchemaInvalid(invalidYardPhone, edmontonYardPageSchema, 'Yard page with a numeric phone');

    const invalidYardEvent = structuredClone(validYardPage);
    invalidYardEvent.upcomingEvents.push('invalid event');
    expectSchemaInvalid(invalidYardEvent, edmontonYardPageSchema, 'Yard events array containing a string item');

    const invalidCategoryCount = structuredClone(validYardPage);
    invalidCategoryCount.itemsInYard[0].categories[0].totalAssets = '10';
    expectSchemaInvalid(invalidCategoryCount, edmontonYardPageSchema, 'Category with a string totalAssets value');

    expectSchemaInvalid(
      { results: { totalAmount: '1', records: [{ assetDescription: 'Tractor' }] } },
      inventorySearchSchema,
      'Search response with a string totalAmount'
    );
    expectSchemaInvalid(
      { results: { totalAmount: 1, records: ['invalid record'] } },
      inventorySearchSchema,
      'Search records array containing a string item'
    );
    expectSchemaInvalid(
      { results: { totalAmount: 1, records: [{ title: 'Tractor' }] } },
      inventorySearchSchema,
      'Search record missing assetDescription'
    );
  });

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

  test('API 4 - Accented equipment search text is preserved', async ({ page }) => {
    const query = 'équipement agricole';
    const { urlQuery, response } = await searchInventory(page, query);

    expect(urlQuery).toBe(query);
    expect(response.status).toBe(200);
    expect(response.contentType).toMatch(/application\/json/i);

    const results = JSON.parse(response.body).results;
    expect(results.totalAmount).toEqual(expect.any(Number));
    expect(results.totalAmount).toBeGreaterThanOrEqual(0);
    expect(results.records).toEqual(expect.any(Array));
    for (const record of results.records) {
      expect(record.assetDescription).toBeTruthy();
    }
  });

  test('API 5 - SQL-like 1=1 search query is rejected', async ({ page }) => {
    const query = '1=1';
    const { urlQuery, response } = await searchInventory(page, query);

    expect(urlQuery).toBe(query);
    expect([400, 422]).toContain(response.status);
  });
});
