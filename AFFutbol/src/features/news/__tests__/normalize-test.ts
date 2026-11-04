import {
  capitalizedRuns,
  detectStatus,
  detectTopic,
  extractFee,
  extractPlayer,
  hashId,
  normalizeFeed,
  normalizeText,
  parseFeedItem,
  toPlainText,
  truncate,
  type FeedSource,
} from '../../../../supabase/functions/_shared/normalize';

const NOW = Date.UTC(2026, 10, 4, 12, 0, 0);

const marketSource: FeedSource = {
  id: 'marca-mercado',
  label: 'Marca',
  url: 'https://www.marca.com/rss/futbol/mercado-fichajes.xml',
  kind: 'rumor',
  topic: 'Mercado',
  maxItems: 25,
};

const newsSource: FeedSource = {
  id: 'marca-portada',
  label: 'Marca',
  url: 'https://e00-marca.uecdn.es/rss/portada.xml',
  kind: 'news',
  topic: 'LaLiga',
  maxItems: 20,
};

/** Trimmed copy of a real Marca market item. */
const MARCA_MARKET_ITEM = `
<item>
  <title><![CDATA[ El Atlético se mueve para fichar a Stefan Dzodic ]]></title>
  <description><![CDATA[ Mantiene conversaciones con el entorno del centrocampista serbio, que tiene una cláusula de 40 millones ]]></description>
  <dc:creator><![CDATA[ Matteo Moretto ]]></dc:creator>
  <link>https://www.marca.com/futbol/atletico/2026/11/02/atletico-mueve-fichar-stefan-dzodic.html</link>
  <category><![CDATA[ Atlético ]]></category>
  <media:content type="image/jpeg" medium="image" url="https://objetos-xlk.estaticos-marca.com/files/og_thumbnail/uploads/2026/11/02/foto.jpeg"/>
  <guid isPermaLink="true">https://www.marca.com/futbol/atletico/2026/11/02/atletico-mueve-fichar-stefan-dzodic.html</guid>
  <pubDate>Mon, 02 Nov 2026 15:33:29 +0100</pubDate>
</item>`;

const MARCA_NEWS_ITEM = `
<item>
  <title><![CDATA[ El Betis se queda el derbi con un gol en el descuento ]]></title>
  <description><![CDATA[ Un remate en el último suspiro decide un partido trabado. ]]></description>
  <dc:creator><![CDATA[ Alejandro Fernández ]]></dc:creator>
  <link>https://www.marca.com/futbol/betis/2026/11/04/derbi.html</link>
  <category><![CDATA[ LaLiga ]]></category>
  <pubDate>Wed, 04 Nov 2026 10:00:00 +0100</pubDate>
</item>`;

function wrap(...items: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Test</title>${items.join('')}</channel></rss>`;
}

describe('RSS normalisation', () => {
  it('maps a Marca market item to a rumour row', () => {
    const [item] = normalizeFeed(wrap(MARCA_MARKET_ITEM), marketSource, NOW);

    expect(item.kind).toBe('rumor');
    expect(item.title).toBe('El Atlético se mueve para fichar a Stefan Dzodic');
    expect(item.source_label).toBe('Marca');
    expect(item.source_url).toContain('atletico-mueve-fichar-stefan-dzodic');
    expect(item.image_url).toBe(
      'https://objetos-xlk.estaticos-marca.com/files/og_thumbnail/uploads/2026/11/02/foto.jpeg'
    );
    expect(item.author).toBe('Matteo Moretto');
    expect(item.published_at).toBe('2026-11-02T14:33:29.000Z');
    expect(item.player).toBe('Stefan Dzodic');
    expect(item.club_to).toBe('Atlético de Madrid');
    expect(item.club_to_id).toBe(530);
    expect(item.fee).toBe('40 M€');
    expect(item.status).toBe('negociando');
    expect(item.topic).toBe('LaLiga');
  });

  it('keeps news items free of rumour-only fields', () => {
    const [item] = normalizeFeed(wrap(MARCA_NEWS_ITEM), newsSource, NOW);

    expect(item.kind).toBe('news');
    expect(item.status).toBeNull();
    expect(item.player).toBeNull();
    expect(item.fee).toBeNull();
    expect(item.topic).toBe('LaLiga');
  });

  it('drops items without a link or a valid date', () => {
    const withoutLink = '<item><title>Sin enlace</title><pubDate>Wed, 04 Nov 2026 10:00:00 GMT</pubDate></item>';
    const withoutDate = '<item><title>Sin fecha</title><link>https://example.com/a</link></item>';

    expect(normalizeFeed(wrap(withoutLink, withoutDate), newsSource, NOW)).toHaveLength(0);
  });

  it('drops content older than the retention window', () => {
    const old = `<item><title>Viejo</title><link>https://example.com/old</link><pubDate>Mon, 01 Sep 2025 10:00:00 GMT</pubDate></item>`;

    expect(normalizeFeed(wrap(old), newsSource, NOW)).toHaveLength(0);
  });

  it('removes duplicates and caps the number of items', () => {
    const source = { ...newsSource, maxItems: 1 };

    expect(normalizeFeed(wrap(MARCA_NEWS_ITEM, MARCA_NEWS_ITEM), source, NOW)).toHaveLength(1);
  });

  it('never pushes a publication date into the future', () => {
    const future = `<item><title>Futuro</title><link>https://example.com/f</link><pubDate>Wed, 04 Nov 2026 23:00:00 GMT</pubDate></item>`;
    const [item] = normalizeFeed(wrap(future), newsSource, NOW);

    expect(Date.parse(item.published_at)).toBeLessThanOrEqual(NOW);
  });

  it('never uses a section name as the destination club', () => {
    const rumour = `<item><title>Danilo renueva con el Flamengo</title><link>https://www.marca.com/futbol/mercado/danilo.html</link><category><![CDATA[ Fútbol ]]></category><pubDate>Wed, 04 Nov 2026 10:00:00 GMT</pubDate></item>`;
    const [item] = normalizeFeed(wrap(rumour), marketSource, NOW);

    expect(item.club_to).toBeNull();
    expect(item.club_to_id).toBeNull();
  });

  it('keeps only football paths when the source sets a path filter', () => {
    const source = { ...newsSource, pathFilter: '/futbol/' };
    const cycling = `<item><title>El Giro más brutal</title><link>https://www.marca.com/ciclismo/giro.html</link><pubDate>Wed, 04 Nov 2026 10:00:00 GMT</pubDate></item>`;

    expect(normalizeFeed(wrap(cycling), source, NOW)).toHaveLength(0);
    expect(normalizeFeed(wrap(MARCA_NEWS_ITEM), source, NOW)).toHaveLength(1);
  });

  it('builds a stable id from the canonical URL', () => {
    const first = hashId('https://www.marca.com/a');
    const second = hashId('https://www.marca.com/a');
    const other = hashId('https://www.marca.com/b');

    expect(first).toBe(second);
    expect(first).not.toBe(other);
    expect(first).toHaveLength(16);
  });
});

describe('player extraction', () => {
  it.each([
    ['El Atlético se mueve para fichar a Stefan Dzodic', 'Stefan Dzodic'],
    ['JJ Gabriel, a un paso del Real Madrid', 'JJ Gabriel'],
    ['El Bayern descarta a Youssef Amrani', 'Youssef Amrani'],
    ['El Nápoles pregunta por Diego Marín', 'Diego Marín'],
    ['El Barcelona estudia el fichaje de Thiago Nunes', 'Thiago Nunes'],
  ])('%s → %s', (title, expected) => {
    expect(extractPlayer(title)).toBe(expected);
  });

  it('returns null instead of inventing a name', () => {
    expect(extractPlayer('El mercado de enero calienta motores')).toBeNull();
    expect(extractPlayer('La Premier League aprieta')).toBeNull();
  });
});

describe('fee extraction', () => {
  it.each([
    ['Tiene una cláusula de 40 millones', '40 M€'],
    ['El club pide 30 M€ por el jugador', '30 M€'],
    ['Cuesta 1,5 millones', '1.5 M€'],
  ])('%s → %s', (title, expected) => {
    expect(extractFee(title)).toBe(expected);
  });

  it('returns null when no figure is mentioned', () => {
    expect(extractFee('El Atlético se mueve para fichar a Stefan Dzodic')).toBeNull();
  });
});

describe('status detection', () => {
  it.each([
    ['El Bayern descarta a Youssef Amrani', 'descartado'],
    ['JJ Gabriel, a un paso del Real Madrid', 'avanzado'],
    ['El Atlético se mueve para fichar a Stefan Dzodic', 'negociando'],
    ['Un nombre para el mercado', 'rumor'],
  ])('%s → %s', (title, expected) => {
    expect(detectStatus(title)).toBe(expected);
  });
});

describe('text helpers', () => {
  it('strips tags, CDATA and entities', () => {
    expect(toPlainText('<![CDATA[ Un gol &amp; una </p> jugada ]]>')).toBe('Un gol & una jugada');
  });

  it('normalises accents for comparisons', () => {
    expect(normalizeText('  Atlético   de Madrid ')).toBe('atletico de madrid');
  });

  it('truncates on a word boundary', () => {
    const result = truncate('uno dos tres cuatro cinco seis siete ocho', 20);

    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(21);
  });

  it('finds capitalised runs in a headline', () => {
    expect(capitalizedRuns('El Atlético se mueve para fichar a Stefan Dzodic')).toEqual([
      'El Atlético',
      'Stefan Dzodic',
    ]);
  });

  it('infers the topic from the category or the text', () => {
    expect(detectTopic('', 'Champions League', 'LaLiga')).toBe('Champions League');
    expect(detectTopic('Una noche de Champions', null, 'LaLiga')).toBe('Champions League');
    expect(detectTopic('El Bayern gana', null, 'LaLiga')).toBe('Bundesliga');
    expect(detectTopic('Sin pistas', null, 'Análisis')).toBe('Análisis');
  });
});

describe('single item parsing', () => {
  it('returns null for an empty block', () => {
    expect(parseFeedItem('', { source: newsSource, now: NOW })).toBeNull();
  });
});
