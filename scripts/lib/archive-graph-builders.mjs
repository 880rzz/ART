export function buildArtworkGraph(registry) {
  const graph = registry.records.map((record) => ({
    '@type': record.type,
    '@id': record.archiveId,
    name: record.title,
    url: record.url,
    creator: {'@id': record.creator},
    ...(record.subject ? {about: {'@id': record.subject}} : {}),
    ...(record.project ? {isPartOf: {'@id': record.project}} : {}),
    ...(record.dateCreated ? {dateCreated: record.dateCreated} : {}),
    ...(record.contentLocation ? {contentLocation: {'@id': record.contentLocation}} : {}),
    ...(record.sameAs?.length ? {sameAs: record.sameAs} : {}),
    ...(record.evidence?.length ? {evidence: record.evidence} : {}),
    inLanguage: registry.language,
    archiveStatus: record.archiveStatus,
    sourceQuality: record.sourceQuality,
  }));

  return {
    '@context': {
      '@vocab': 'https://schema.org/',
      archiveStatus: 'https://www.banhalmi.art/vocabulary/archiveStatus',
      sourceQuality: 'https://www.banhalmi.art/vocabulary/sourceQuality',
      evidence: 'https://www.banhalmi.art/vocabulary/evidence',
    },
    '@graph': graph,
  };
}

export function buildPressGraph(registry, relations) {
  const records = registry.languages?.hu?.records || [];
  const byAnchor = new Map(records.map((record) => [record.anchor, record]));
  const accepted = new Set(relations.rules.acceptedSourceQuality);
  const graph = [{
    '@type': 'CollectionPage',
    '@id': 'https://www.banhalmi.art/hu/press.html#collection',
    url: 'https://www.banhalmi.art/hu/press.html',
    name: 'Sajtó, interjúk és mozgóképes dokumentumok',
    inLanguage: 'hu-HU',
    about: {'@id': 'https://www.banhalmi.art/norbert-banhalmi#person'},
    isPartOf: {'@id': 'https://www.banhalmi.art/#website'},
  }];

  for (const [projectKey, relation] of Object.entries(relations.projects)) {
    const subjectOf = [];
    for (const anchor of relation.pressAnchors) {
      const record = byAnchor.get(anchor);
      if (!record) throw new Error(`${projectKey}: hiányzó sajtórekord: ${anchor}`);
      if (!accepted.has(record.sourceQuality)) throw new Error(`${anchor}: nem elfogadott forrásminőség: ${record.sourceQuality}`);

      const id = `https://www.banhalmi.art/hu/press.html#${anchor}-record`;
      const isVideo = /youtube|youtu\.be/i.test(record.sourceUrl) || /videó|video/i.test(record.publicationNote || '');
      const mentions = [
        {'@id': 'https://www.banhalmi.art/norbert-banhalmi#person'},
        ...(relation.recordMentions?.[anchor] || []).map((entityId) => ({'@id': entityId})),
      ];

      graph.push({
        '@type': isVideo ? ['VideoObject', 'CreativeWork'] : ['Article', 'CreativeWork'],
        '@id': id,
        name: record.title,
        ...(record.description ? {description: record.description} : {}),
        url: record.archiveUrl,
        sameAs: record.sourceUrl,
        inLanguage: 'hu-HU',
        about: {'@id': relation.projectId},
        mentions: mentions.length === 1 ? mentions[0] : mentions,
        isPartOf: {'@id': 'https://www.banhalmi.art/hu/press.html#collection'},
        archiveStatus: 'verified-press-source',
        sourceQuality: record.sourceQuality,
        ...(record.publicationNote ? {publicationNote: record.publicationNote} : {}),
      });
      subjectOf.push({'@id': id});
    }

    graph.push({
      '@type': 'CreativeWorkSeries',
      '@id': relation.projectId,
      subjectOf,
    });
  }

  return {
    '@context': {
      '@vocab': 'https://schema.org/',
      archiveStatus: 'https://www.banhalmi.art/vocabulary/archiveStatus',
      sourceQuality: 'https://www.banhalmi.art/vocabulary/sourceQuality',
      publicationNote: 'https://www.banhalmi.art/vocabulary/publicationNote',
    },
    '@graph': graph,
  };
}
