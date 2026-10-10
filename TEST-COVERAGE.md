# Test Coverage Mapping

This document maps the Test Automation Home Assignment requirements to the automated tests in this repository. “Partial” means the test covers some, but not all, of the stated checks. “Known failing” identifies an assertion that currently fails against the live site.

## Framework and architecture

| Requirement | Coverage | Implementation |
|---|---|---|
| Project setup and runnable E2E/API suites | Covered | `package.json`, `playwright.config.js`, and this README's setup/run instructions |
| Test architecture | Partial | Playwright Test, shared page objects in `pages/`, and separate E2E/API spec files are used. API schemas are in `tests/api/schemas/`. |
| Do not create accounts, bid, or submit seller forms | Covered by test scope | Tests inspect the public pages and do not create accounts, place bids, or submit the seller form. |

## E2E happy path

| Requirement | Coverage | Test / notes |
|---|---|---|
| Scenario 1.1 — Locations heading and introduction | Partial | `tests/e2e/e2e-happy.spec.js` — “Scenario 1 - Locations directory” checks the Locations heading and intro wording; it does not assert the browser page title. |
| Scenario 1.2 — Satellite-site note | Covered | Checks visibility of copy containing satellite and asterisk. |
| Scenario 1.3 — Country groups | Covered | Checks the first two headings, at least six headings, and required countries. |
| Scenario 1.4 — US site count and cities | Covered | Checks more than 20 entries and Phoenix, Salt Lake City, Houston, Las Vegas, and Atlanta. |
| Scenario 1.5 — Canadian site count and cities | Covered | Checks more than 10 entries and Edmonton, Montreal, Toronto, Regina, and Saskatoon. |
| Scenario 1.6 — Satellite/permanent counts | Covered | Counts asterisk-marked and unmarked `/lp/` links and checks required thresholds. |
| Scenario 1.7 — Known satellite/permanent sites | Covered | Checks San Antonio and Calgary as satellite, Phoenix and Edmonton as permanent. |
| Scenario 1.9 — Auction sites / representatives controls | Covered | Checks both controls, switches to Local representatives, and checks for Search for representatives. |
| Scenario 2.1 — Edmonton under Canada, not satellite | Partial | Checks the Edmonton link exists and its text lacks `*`; does not verify that the link is grouped under the Canada heading. |
| Scenario 2.2 — Open Edmonton yard | Covered | Checks navigation URL contains `/lp/edmonton-ab` and an Edmonton heading is visible. |
| Scenario 3.1 — Yard details | Partial | Checks address, visible office hours, and visible telephone link. It does not assert the office-hours text includes a weekday and time range. |
| Scenario 3.2 — Auction events | Partial | Checks event heading, at least one event card, and a date range on the first card. Does not check every card or a card title. |
| Scenario 3.3 — About this yard | Partial | Checks section visibility and text containing at least one of drop-off, inspection, or pick-up; does not require all three or assert non-empty text separately. |
| Scenario 3.4 — Items-in-yard carousel | Partial | Counts more than five category links (including off-screen matches) and checks for at least one listed equipment category. Does not assert Excavators, or validate every card name and quantity. |
| Scenario 3.5 — Become a seller form | Covered | Checks the form, title, and phone visibility; does not submit the form. |
| Scenario 3.6 — Representatives | Partial | Clicks the Representatives tab only if visible and checks at least one representative card. Does not assert territory/region or contact information. |
| Scenario 4.1 — Edmonton inventory search context | Partial | Navigates with the Edmonton query; does not separately assert the query/location context in the UI. |
| Scenario 4.2 — Inventory results | Partial | Parses and logs the displayed total and checks non-empty titles for up to the first five cards. It does not assert the parsed count is greater than zero or validate optional location/date fields on cards. |
| Supported locales — additional coverage | Covered | “Scenario 5 - All supported locale sites” visits each configured locale domain and checks HTTP 200 and the document `lang`. |
| E2E negative tests | Covered for selected scenarios | `tests/e2e/e2e-negative.spec.js` checks unknown country/site absence, invalid yard slug details, and a no-exact-match search. |

## API happy path

| Requirement | Coverage | Test / notes |
|---|---|---|
| API 1 / A1.1 — `/lp` page JSON and location list | Partial | `tests/api/api-happy.spec.js` — “API 1 - Auction sites list (/lp page JSON)” parses `__NEXT_DATA__` and checks a locations array. The HTTP response content type is not explicitly checked. |
| A1.2 — More than 60 locations | Covered | Checks the runtime list count. |
| A1.3 — Every location has name and country | Covered | AJV schema allows supported name/country fields, including country nested under address; test applies schema to the full list. |
| A1.4 — Edmonton/Canada and Phoenix/USA | Partial | Confirms Edmonton and Phoenix are present but does not validate their country values. |
| A1.5 — Site type and counts | Partial | Counts satellite and permanent records using available type fields and checks count thresholds. It does not fail explicitly when a location has no recognized site type. |
| A1.6 — Distinct countries, including US and Canada | Partial | Checks more than eight distinct country values but does not explicitly require United States and Canada. |
| API 2 / A2.1 — `/lp/edmonton-ab` page JSON | Partial | “API 2 - Edmonton yard page JSON” parses `__NEXT_DATA__`; it does not explicitly check the HTTP content type. |
| A2.2 — Yard details | Covered | Checks Edmonton, street/city/postal address, phone, and pickup-hour values. |
| A2.3 — Upcoming events | Covered | Requires events, then checks every event has start/end date fields and a name, and at least one refers to Edmonton or Nisku. |
| A2.4 — Items-in-yard categories | Covered | Flattens nested category arrays; checks count, each category name, optional numeric non-negative `totalAssets`, and Excavators. |
| API 3 / A3.1 — Search response HTTP 200 and JSON | Partial | “API 3 - Edmonton inventory search API” checks status and JSON content type after a same-origin browser request. A direct API request has returned HTTP 403, but this behavior is not yet covered by a dedicated test. |
| A3.2 — Full hit count is positive | Covered | Reads `results.totalAmount` and checks greater than zero without paging through all lots. |
| A3.3 — First page and display names | Covered | Requires records and schema-valid `assetDescription` values. |
| A3.4 — Log count and first five titles | Covered | Logs `totalAmount` and up to the first five `assetDescription` values. |
| API negative tests | Partial; one known failing | `tests/api/api-negative.spec.js` covers invalid schema types/items, unknown location, invalid yard slug, no-exact-match search, and accented text. “API 5 - SQL-like 1=1 search query is rejected” expects HTTP 400/422, but a prior live run returned HTTP 200. |

## Schema files

The API happy-path tests validate response data against these AJV schemas:

- `tests/api/schemas/auction-sites.schema.json`
- `tests/api/schemas/edmonton-yard-page.schema.json`
- `tests/api/schemas/inventory-search.schema.json`

## Suggested follow-up

## Missing and partial requirement coverage

The following stated requirements are not fully validated by the current tests:

### E2E gaps

- **Scenario 1.1:** The heading and intro copy are checked, but the browser page title is not.
- **Scenario 2.1:** Edmonton is checked for presence and no asterisk, but its grouping under the Canada heading is not verified.
- **Scenario 3.1:** Office-hours visibility is checked, but weekday text and a time range are not asserted.
- **Scenario 3.2:** Only the first event date range is checked; titles and date ranges are not validated for every event card.
- **Scenario 3.3:** The About text assertion accepts any one of drop-off, inspection, or pick-up, instead of verifying the required weekday/open context and all stated services.
- **Scenario 3.4:** The carousel count and one alternative category are checked, but every category's name and “N items” quantity are not; Excavators is not explicitly required by this E2E assertion.
- **Scenario 3.6:** The Representatives tab is optional in the test. Territory/region and phone, mobile, or email are not checked on each representative card.
- **Scenario 4.1:** The search is opened with the Edmonton query, but the visible query/location context is not asserted separately.
- **Scenario 4.2:** The total is parsed and logged, but not explicitly required to be greater than zero. Only up to five visible cards are checked for titles; optional location and closing/auction date fields are not validated.

### API gaps

- **A1.4:** Edmonton and Phoenix presence is checked, but Edmonton's Canada/CAN and Phoenix's United States/USA country values are not asserted.
- **A1.5:** Satellite/permanent totals are checked, but the schema and loop do not require every location to have a recognized site type.
- **A1.6:** The distinct-country threshold is checked, but United States and Canada are not explicitly required in the distinct-country set.
- **A2.1:** The `__NEXT_DATA__` script is parsed as JSON, but the page response content type is not explicitly asserted.
- **API 3 — Direct search API access:** The happy-path test calls `/api/search` from the loaded search page using a same-origin browser request because a direct API request returned HTTP 403. The direct-call 403 behavior is not currently asserted by a dedicated test.

### Negative API expectation requiring server-side behavior

- **API 5 — `1=1` search query:** The test expects HTTP 400 or 422. A previous live run returned HTTP 200, so this remains a known failing security expectation. Client-side tests cannot make the production API reject the input; server-side validation is required.

## Suggested follow-up

To close the gaps above:

1. Add the missing E2E title, Canada grouping, event-title/date-per-card, carousel quantity/name, representative contact/territory, and search-result assertions.
2. Add a dedicated API 3 test for direct `/api/search` requests, asserting the observed HTTP 403 response, while retaining the same-origin happy-path test.
3. Strengthen API 1 assertions for location type and Edmonton/Phoenix country assignments, and explicitly check United States and Canada in the country set.
4. Add explicit HTTP/content-type assertions to page-JSON API 1 and API 2.
5. Resolve API 5 with the API owner: the public search endpoint accepted `1=1` with HTTP 200, so this client test can detect the behavior but cannot enforce server-side query rejection.
