/* Guard for one-time migration scripts.
 *
 * Nine scripts in this folder were written to perform a single migration and
 * were never meant to be run again. Running them against the current site does
 * not "re-apply" anything — it overwrites work done since. A sweep of every
 * HTML-writing script found:
 *
 *   build-google-redirects.mjs   turns 37 real pages into redirect stubs
 *   fix-migration.mjs            rewrites JSON-LD across 108 pages, net deletion
 *   refine-curatorial-trust.mjs  deletes 374 lines from hu/curators.html and
 *                                reverts approved biography copy
 *   fix-cross-site-audit.mjs     double-escapes HTML entities (&#x27; -> &amp;#x27;)
 *   integrate-family-origins.mjs re-adds a menu entry the other languages lack
 *   integrate-secondary-pages.mjs renames a menu entry, breaking parity
 *   integrate-hu-project-pages.mjs, enrich-exhibitions-hu.mjs,
 *   normalize-galleries.mjs      rewrite meta descriptions and duplicate tags
 *
 * None of them failed loudly; each is one `node scripts/…` away from undoing
 * committed work. Rather than delete them — they are a record of how the site
 * was built, and may be needed for a genuine re-migration — they now refuse to
 * run unless the operator says so explicitly.
 */
export function requireExplicitRun(name, whatItDoes) {
  if (process.env.ALLOW_ONE_TIME_MIGRATION === '1') return;

  console.error(
    `\n${name} is a one-time migration script and will not run by default.\n\n` +
    `  What it does: ${whatItDoes}\n\n` +
    `  It rewrites pages that have been edited since the migration it belongs to,\n` +
    `  so running it now would overwrite current content rather than update it.\n` +
    `  tests/audit-generator-idempotency.mjs checks this for every script here.\n\n` +
    `  If you genuinely need it, run it deliberately:\n` +
    `      ALLOW_ONE_TIME_MIGRATION=1 node scripts/${name}.mjs\n` +
    `  and check \`git diff\` before committing.\n`
  );
  process.exit(0);
}
