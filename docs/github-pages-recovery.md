# GitHub Pages deployment recovery

BANHALMI ART is published from the protected `main` branch with **GitHub Actions** as the Pages source.

## Verified limitation

The official `actions/deploy-pages@v5` action has a hard maximum timeout of `600000` milliseconds. When the GitHub Pages backend keeps an otherwise valid deployment in `deployment_queued` longer than ten minutes, the action reaches its local timeout and explicitly cancels the server-side deployment.

The archive audit and Pages artifact build can both succeed while this service-side queue condition is present. It must not be misclassified as a content, schema, language, route or asset failure.

## Repository-owned deployment path

The workflow `.github/workflows/pages.yml`:

1. runs the complete multilingual archive audit;
2. packages only files committed in the reviewed SHA;
3. removes workflows, tests, tools, scripts, internal documentation and package files from the public artifact;
4. verifies the English, Hungarian and German entry pages plus the canonical archive, sitemap, robots, redirect, AI/LLM and CSS files;
5. rejects symbolic links;
6. uploads the artifact through the official Pages artifact action;
7. passes the uploaded `artifact_id` to `tools/deploy-pages-api.mjs`;
8. obtains a GitHub Actions OIDC token;
9. creates a unique Pages deployment version for each run and rerun;
10. polls the Pages status API for up to 45 minutes; and
11. does not cancel the deployment if local monitoring expires.

The workflow uses `contents: read`, `pages: write` and `id-token: write`. It cannot commit or push. The deployment client contains no Pages cancellation endpoint.

## Operational rules

- Keep **Settings → Pages → Build and deployment → Source** set to **GitHub Actions**.
- Do not restore `actions/deploy-pages` while its maximum remains `600000` milliseconds.
- Do not create repeated no-op commits to force deployments.
- Preserve the previously successful public archive until a newer deployment reports `succeed`.
- If polling expires, inspect the existing deployment before starting another run because the workflow intentionally leaves it active.
