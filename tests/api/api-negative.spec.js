const { test, expect } = require('@playwright/test');

test.describe('API Negative Suite', () => {

  test('POST /api/search with empty payload handles error gracefully', async ({ request }) => {
    const response = await request.post('/api/search', {
      data: { invalidKey: 'unrecognizedData' },
      headers: { 'Content-Type': 'application/json' }
    });

    expect([400, 422, 200]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.items?.length || 0).toBe(0);
    }
  });

});