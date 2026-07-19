# Full repair test report — 2026-07-08

## Automated syntax and structure

- `node --check` passed for all five JavaScript assets.
- JSON-LD parsed successfully on both language pages.
- No duplicate HTML IDs were found.
- No unlabeled input, textarea or select elements remain.
- No missing project-relative CSS or JavaScript assets were found.
- All modular assets returned HTTP 200 from a local static server.
- No `Math.random`, xorshift fallback, right-click blocking or developer-tools blocking remains.

## Browser smoke tests

Tested in headless Chromium at:

- 1440 × 1000, Hungarian;
- 1440 × 1000, English;
- 390 × 844, Hungarian;
- 390 × 844, English.

Results in all four configurations:

- application booted without JavaScript errors;
- all 76 lexicon cards rendered;
- the first lexicon card opened in the modal;
- the modal close button received focus;
- Escape closed the modal;
- journal copy, delete, export and import controls were present;
- secure Web Crypto random generation was available;
- all form controls had accessible names.

## Modal and accessibility test

- The application shell receives `inert` while the modal is open.
- Keyboard focus remains inside the modal.
- Closing the modal removes `inert` from the application shell.
- The less frequently used shadow-card modal also updates `aria-hidden`, focus and inert state correctly.

## Randomisation tests

- Four independent 20,000-sample tests of `randInt(10)` showed balanced distributions without a visible systematic bias.
- 100 consecutively generated secure draw IDs were all unique.
- Desktop background: 52 animated ambient dots.
- Mobile background: 28 animated ambient dots.
- Reduced-motion and hidden-tab pausing are implemented.

## Journal tests

- Importing 170 valid records retained the newest 150 records, matching the configured limit.
- Import merging uses a draw ID or deterministic legacy signature to avoid duplicates.
- Export includes schema version, application version, deck version and ISO export time.
- Legacy records remain readable and display as `legacy` where audit metadata was not available.

## Deployment note

Upload the complete directory contents, including the `assets/` directory. Uploading only the two HTML files would leave the page without styling and application code.
