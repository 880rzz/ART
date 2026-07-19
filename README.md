# helloitsme

## Full technical repair — 2026-07-08

- Shared CSS moved to `assets/css/app.css`.
- Language-specific application code moved to `assets/js/app.hu.js` and `assets/js/app.en.js`.
- Shared interaction, ambient animation and runtime hardening modules added.
- Journal capped at 150 entries, with JSON export/import and versioned metadata.
- Every new reading receives a secure draw ID, engine version, deck version, timestamp and randomisation mode.
- Web Crypto is mandatory; insecure pseudo-random fallback was removed.
- Modal focus trapping, inert background, form labels and reduced-motion handling were added.
- Continuous animation pauses when the browser tab is hidden.
- Right-click, F12 and source-view blocking were removed.
- English runtime UI and placeholders were cleaned up.

Deploy the contents of this directory, including the complete `assets/` directory.
