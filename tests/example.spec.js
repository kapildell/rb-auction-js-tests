// @ts-check
import { test, expect } from '@playwright/test';
import Ajv from 'ajv';
import userSchema from './schemas/user.schema.json';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});

test('Validate API against JSON Schema', async ({ request }) => {
  // 1. Fetch the API response
  const response = await request.get('https://example.com');
  const responseBody = await response.json();

  // 2. Initialize Ajv and compile the schema
  const ajv = new Ajv();
  const validate = ajv.compile(userSchema);

  // 3. Execute validation
  const isValid = validate(responseBody);

  // 4. Custom assertion message to output syntax errors if it fails
  expect(isValid, `Schema validation errors: ${JSON.stringify(validate.errors)}`).toBeTruthy();
});
