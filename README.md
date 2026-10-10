# Ritchie Bros. Auction Site Tests

End-to-end and API tests for the [Ritchie Bros.](https://www.rbauction.com/) auction-site directory, yard pages, and inventory search. The project uses JavaScript and [Playwright Test](https://playwright.dev/docs/intro), with page objects for the locations directory, yard pages, and search results.

## Requirements

- Node.js (current LTS recommended)
- npm

## Setup

From the project root, install dependencies and the Chromium browser:

```bash
npm ci
npx playwright install chromium
```

## Run tests

```bash
# Run the complete test suite
npm test

# Run end-to-end tests
npm run test:e2e

# Run API tests
npm run test:api

# Open Playwright's interactive test runner
npm run test:ui
```

Run an individual test file or scenario:

```bash
npx playwright test tests/e2e/e2e-happy.spec.js
npx playwright test tests/e2e/e2e-happy.spec.js --grep "Scenario 1 - Locations directory"
npx playwright test tests/e2e/e2e-negative.spec.js
npx playwright test tests/api/api-happy.spec.js
npx playwright test tests/api/api-negative.spec.js
```

## Coverage

- **Locations directory:** verifies the Locations heading and introduction, satellite-site note, country groups, US and Canadian site counts and cities, satellite/permanent totals, known site types, and the local-representatives control.
- **Edmonton yard:** checks the yard address, office hours, phone, auction events, yard information, inventory categories, seller contact section, and representatives.
- **Inventory search:** checks the Edmonton search result count and that returned cards have titles.
- **API happy paths:** validates auction-site data from `/lp`, Edmonton yard details/events/categories from `/lp/edmonton-ab`, and Edmonton inventory search results from `POST /api/search`.
- **API negative paths:** verifies an unknown site is absent, an invalid yard slug does not return Edmonton details, and a no-exact-match inventory query displays the appropriate response.
- **E2E negative paths:** verifies unknown countries and sites are absent, invalid yard slugs do not show Edmonton details, and unmatched searches show the no-exact-match message.

The tests use `https://www.rbauction.com` as the base URL, configured in [`playwright.config.js`](./playwright.config.js). The Chromium project is configured to run in headed mode.

## Reports and artifacts

Playwright uses the list and HTML reporters. To open the most recent HTML report:

```bash
npm run report
```

On failure, screenshots and videos are retained in the Playwright output directories. These generated files are excluded from Git.

## Continuous integration

The GitHub Actions workflow in [`.github/workflows/playwright.yml`](./.github/workflows/playwright.yml) installs dependencies and browsers, runs the Playwright suite on pushes and pull requests targeting `main` or `master`, and uploads the HTML report as an artifact.
