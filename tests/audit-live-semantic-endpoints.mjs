const baseUrl = process.env.ARCHIVE_BASE_URL || 'https://www.banhalmi.art';

const endpoints = [
  {
    path: '/hu/',
    kind: 'html',
    contentTypes: ['text/html'],
    contains: ['BANHALMI'],
  },
  {
    path: '/hu/works/magyar-peter-portre-2026.html',
    kind: 'html',
    contentTypes: ['text/html'],
    contains: ['magyar-peter-portre-2026', 'application/ld+json'],
  },
  {
    path: '/sitemap.xml',
    kind: 'xml',
    contentTypes: ['application/xml', 'text/xml'],
    contains: ['<urlset', 'magyar-peter-portre-2026.html'],
  },
  {
    path: '/artwork-knowledge-graph.hu.jsonld',
    kind: 'jsonld',
    contentTypes: ['application/ld+json', 'application/json', 'text/plain'],
    contains: ['magyar-peter-portre-2026.html#record', 'public-primary-record'],
  },
  {
    path: '/press-knowledge-graph.hu.jsonld',
    kind: 'jsonld',
    contentTypes: ['application/ld+json', 'application/json', 'text/plain'],
    contains: ['press-21-record', 'magyar-peter-portre-2026.html#record'],
  },
  {
    path: '/oeuvre-knowledge-graph.hu.jsonld',
    kind: 'jsonld',
    contentTypes: ['application/ld+json', 'application/json', 'text/plain'],
    contains: ['norbert-banhalmi#person', 'projects/euforia#project'],
  },
  {
    path: '/vocabulary/index.jsonld',
    kind: 'jsonld',
    contentTypes: ['application/ld+json', 'application/json', 'text/plain'],
    contains: ['DefinedTermSet', 'archiveStatus', 'sourceQuality'],
  },
  {
    path: '/vocabulary/archiveStatus',
    kind: 'jsonld',
    contentTypes: ['application/ld+json', 'application/json', 'text/plain'],
    contains: ['DefinedTerm', 'archiveStatus'],
  },
  {
    path: '/vocabulary/sourceQuality',
    kind: 'jsonld',
    contentTypes: ['application/ld+json', 'application/json', 'text/plain'],
    contains: ['DefinedTerm', 'sourceQuality'],
  },
];

const timeoutMs = Number(process.env.LIVE_AUDIT_TIMEOUT_MS || 15000);
const failures = [];

function normalizedContentType(response) {
  return (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
}

async function auditEndpoint(endpoint) {
  const url = new URL(endpoint.path, baseUrl).href;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'BANHALMI-Archive-Semantic-Audit/1.0',
        accept: endpoint.kind === 'html'
          ? 'text/html,application/xhtml+xml'
          : 'application/ld+json,application/json,application/xml,text/xml,text/plain;q=0.8,*/*;q=0.1',
      },
    });

    const body = await response.text();
    const contentType = normalizedContentType(response);

    if (response.status !== 200) {
      failures.push(`${endpoint.path}: HTTP ${response.status}; final URL: ${response.url}`);
      return;
    }

    if (!response.url.startsWith(baseUrl)) {
      failures.push(`${endpoint.path}: váratlan külső átirányítás: ${response.url}`);
    }

    if (!endpoint.contentTypes.includes(contentType)) {
      failures.push(`${endpoint.path}: nem megfelelő Content-Type: ${contentType || '(hiányzik)'}`);
    }

    for (const marker of endpoint.contains) {
      if (!body.includes(marker)) {
        failures.push(`${endpoint.path}: hiányzó tartalmi marker: ${marker}`);
      }
    }

    if (endpoint.kind === 'jsonld') {
      try {
        JSON.parse(body);
      } catch (error) {
        failures.push(`${endpoint.path}: a válasz nem érvényes JSON: ${error.message}`);
      }
    }

    console.log(`✓ ${endpoint.path} — ${response.status} — ${contentType || 'no-content-type'} — ${body.length} bytes`);
  } catch (error) {
    failures.push(`${endpoint.path}: hálózati hiba: ${error.name === 'AbortError' ? `timeout ${timeoutMs} ms után` : error.message}`);
  } finally {
    clearTimeout(timer);
  }
}

for (const endpoint of endpoints) {
  await auditEndpoint(endpoint);
}

if (failures.length) {
  console.error('\nÉlő szemantikai végpont audit sikertelen:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`\n✓ ${endpoints.length} élő archívumi és szemantikai végpont ellenőrizve`);
