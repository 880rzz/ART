module.exports = {
  ci: {
    collect: {
      startServerCommand: 'python3 -m http.server 4173 --bind 127.0.0.1',
      startServerReadyPattern: 'Serving HTTP',
      startServerReadyTimeout: 10000,
      url: [
        'http://127.0.0.1:4173/',
        'http://127.0.0.1:4173/hu/',
        'http://127.0.0.1:4173/de-at/',
        'http://127.0.0.1:4173/exhibitions/ebredes.html'
      ],
      numberOfRuns: 2,
      settings: {
        chromeFlags: '--headless --no-sandbox --disable-dev-shm-usage'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.90 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.10 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './artifacts/lighthouse'
    }
  }
};
