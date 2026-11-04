/**
 * RSS normalisation shared by the `news-refresh` Edge Function and the Jest
 * suite.
 *
 * Rules for this file: no Deno globals, no Node built-ins and no network. It
 * only transforms a feed document into rows, so the same code can run in the
 * Supabase runtime and in Jest. Everything here is deterministic.
 */

export type ContentKind = 'news' | 'rumor';
export type RumorStatus = 'rumor' | 'negociando' | 'avanzado' | 'descartado';

export type FeedSource = {
  id: string;
  label: string;
  url: string;
  kind: ContentKind;
  topic: string;
  maxItems: number;
  /** Optional URL path a football item must contain, e.g. `/futbol/`. */
  pathFilter?: string | null;
};

/** Row shape of `public.news_items`. */
export type NormalizedItem = {
  id: string;
  kind: ContentKind;
  title: string;
  summary: string;
  topic: string;
  source_id: string;
  source_label: string;
  source_url: string;
  image_url: string | null;
  author: string | null;
  published_at: string;
  status: RumorStatus | null;
  player: string | null;
  club_from: string | null;
  club_from_id: number | null;
  club_to: string | null;
  club_to_id: number | null;
  fee: string | null;
  tags: string[];
};

type Club = {
  id: number;
  name: string;
  league: string;
  aliases: string[];
};

/**
 * Clubs we can recognise in a headline. IDs match API-Football so the app can
 * render the crest without spending any request. Only clubs whose ID is known
 * for certain are listed; anything else keeps a name but no badge.
 */
const CLUBS: readonly Club[] = [
  // LaLiga
  { id: 541, name: 'Real Madrid', league: 'LaLiga', aliases: ['real madrid', 'madrid', 'madrid cf'] },
  { id: 529, name: 'Barcelona', league: 'LaLiga', aliases: ['barcelona', 'barca', 'fc barcelona'] },
  { id: 530, name: 'Atlético de Madrid', league: 'LaLiga', aliases: ['atletico', 'atletico de madrid', 'atleti'] },
  { id: 531, name: 'Athletic Club', league: 'LaLiga', aliases: ['athletic', 'athletic club', 'athletic de bilbao'] },
  { id: 532, name: 'Valencia', league: 'LaLiga', aliases: ['valencia', 'valencia cf'] },
  { id: 533, name: 'Villarreal', league: 'LaLiga', aliases: ['villarreal', 'villareal'] },
  { id: 536, name: 'Sevilla', league: 'LaLiga', aliases: ['sevilla', 'sevilla fc'] },
  { id: 543, name: 'Real Betis', league: 'LaLiga', aliases: ['betis', 'real betis'] },
  { id: 548, name: 'Real Sociedad', league: 'LaLiga', aliases: ['real sociedad', 'la real'] },
  { id: 547, name: 'Girona', league: 'LaLiga', aliases: ['girona'] },
  { id: 538, name: 'Celta de Vigo', league: 'LaLiga', aliases: ['celta', 'celta de vigo'] },
  { id: 728, name: 'Rayo Vallecano', league: 'LaLiga', aliases: ['rayo', 'rayo vallecano'] },
  { id: 727, name: 'Osasuna', league: 'LaLiga', aliases: ['osasuna'] },
  { id: 546, name: 'Getafe', league: 'LaLiga', aliases: ['getafe'] },
  { id: 798, name: 'Mallorca', league: 'LaLiga', aliases: ['mallorca'] },
  { id: 542, name: 'Alavés', league: 'LaLiga', aliases: ['alaves', 'deportivo alaves'] },
  { id: 540, name: 'Espanyol', league: 'LaLiga', aliases: ['espanyol', 'espanol'] },
  { id: 534, name: 'Las Palmas', league: 'LaLiga', aliases: ['las palmas'] },
  { id: 720, name: 'Valladolid', league: 'LaLiga', aliases: ['valladolid'] },
  { id: 539, name: 'Leganés', league: 'LaLiga', aliases: ['leganes'] },

  // Premier League
  { id: 50, name: 'Manchester City', league: 'Premier League', aliases: ['manchester city', 'man city'] },
  { id: 33, name: 'Manchester United', league: 'Premier League', aliases: ['manchester united', 'man united'] },
  { id: 40, name: 'Liverpool', league: 'Premier League', aliases: ['liverpool'] },
  { id: 42, name: 'Arsenal', league: 'Premier League', aliases: ['arsenal'] },
  { id: 49, name: 'Chelsea', league: 'Premier League', aliases: ['chelsea'] },
  { id: 47, name: 'Tottenham', league: 'Premier League', aliases: ['tottenham', 'spurs'] },
  { id: 34, name: 'Newcastle', league: 'Premier League', aliases: ['newcastle'] },
  { id: 66, name: 'Aston Villa', league: 'Premier League', aliases: ['aston villa'] },
  { id: 48, name: 'West Ham', league: 'Premier League', aliases: ['west ham'] },
  { id: 51, name: 'Brighton', league: 'Premier League', aliases: ['brighton'] },
  { id: 45, name: 'Everton', league: 'Premier League', aliases: ['everton'] },
  { id: 39, name: 'Wolves', league: 'Premier League', aliases: ['wolves', 'wolverhampton'] },
  { id: 65, name: 'Nottingham Forest', league: 'Premier League', aliases: ['nottingham', 'nottingham forest'] },
  { id: 36, name: 'Fulham', league: 'Premier League', aliases: ['fulham'] },
  { id: 55, name: 'Brentford', league: 'Premier League', aliases: ['brentford'] },
  { id: 52, name: 'Crystal Palace', league: 'Premier League', aliases: ['crystal palace'] },
  { id: 35, name: 'Bournemouth', league: 'Premier League', aliases: ['bournemouth'] },
  { id: 46, name: 'Leicester', league: 'Premier League', aliases: ['leicester'] },
  { id: 41, name: 'Southampton', league: 'Premier League', aliases: ['southampton'] },

  // Serie A
  { id: 505, name: 'Inter de Milán', league: 'Serie A', aliases: ['inter', 'inter de milan'] },
  { id: 489, name: 'AC Milan', league: 'Serie A', aliases: ['milan', 'ac milan'] },
  { id: 496, name: 'Juventus', league: 'Serie A', aliases: ['juventus', 'juve'] },
  { id: 492, name: 'Napoli', league: 'Serie A', aliases: ['napoli', 'napoles'] },
  { id: 497, name: 'Roma', league: 'Serie A', aliases: ['roma'] },
  { id: 487, name: 'Lazio', league: 'Serie A', aliases: ['lazio'] },
  { id: 499, name: 'Atalanta', league: 'Serie A', aliases: ['atalanta'] },
  { id: 502, name: 'Fiorentina', league: 'Serie A', aliases: ['fiorentina'] },
  { id: 500, name: 'Bologna', league: 'Serie A', aliases: ['bologna'] },
  { id: 503, name: 'Torino', league: 'Serie A', aliases: ['torino'] },

  // Bundesliga
  { id: 157, name: 'Bayern Múnich', league: 'Bundesliga', aliases: ['bayern', 'bayern munich', 'bayern de munich'] },
  { id: 165, name: 'Borussia Dortmund', league: 'Bundesliga', aliases: ['dortmund', 'borussia dortmund'] },
  { id: 168, name: 'Bayer Leverkusen', league: 'Bundesliga', aliases: ['leverkusen', 'bayer leverkusen'] },
  { id: 173, name: 'RB Leipzig', league: 'Bundesliga', aliases: ['leipzig', 'rb leipzig'] },
  { id: 172, name: 'Stuttgart', league: 'Bundesliga', aliases: ['stuttgart'] },
  { id: 169, name: 'Eintracht Frankfurt', league: 'Bundesliga', aliases: ['frankfurt', 'eintracht'] },

  // Ligue 1
  { id: 85, name: 'Paris Saint-Germain', league: 'Ligue 1', aliases: ['psg', 'paris saint germain'] },
  { id: 81, name: 'Olympique de Marsella', league: 'Ligue 1', aliases: ['marsella', 'olympique de marsella'] },
  { id: 80, name: 'Olympique de Lyon', league: 'Ligue 1', aliases: ['lyon', 'olympique de lyon'] },
  { id: 91, name: 'Mónaco', league: 'Ligue 1', aliases: ['monaco'] },
  { id: 79, name: 'Lille', league: 'Ligue 1', aliases: ['lille'] },

  // Portugal and the rest
  { id: 211, name: 'Benfica', league: 'Otras ligas', aliases: ['benfica'] },
  { id: 212, name: 'Porto', league: 'Otras ligas', aliases: ['porto', 'fc porto'] },
  { id: 228, name: 'Sporting de Lisboa', league: 'Otras ligas', aliases: ['sporting', 'sporting de lisboa'] },
  { id: 194, name: 'Ajax', league: 'Otras ligas', aliases: ['ajax'] },
  { id: 197, name: 'PSV', league: 'Otras ligas', aliases: ['psv'] },
  { id: 645, name: 'Galatasaray', league: 'Otras ligas', aliases: ['galatasaray'] },
  { id: 611, name: 'Fenerbahçe', league: 'Otras ligas', aliases: ['fenerbahce'] },
  { id: 127, name: 'Flamengo', league: 'Otras ligas', aliases: ['flamengo'] },
  { id: 121, name: 'Palmeiras', league: 'Otras ligas', aliases: ['palmeiras'] },
  { id: 435, name: 'River Plate', league: 'Otras ligas', aliases: ['river plate'] },
  { id: 451, name: 'Boca Juniors', league: 'Otras ligas', aliases: ['boca', 'boca juniors'] },
];

const CLUB_BY_ALIAS = new Map<string, Club>();
for (const club of CLUBS) {
  for (const alias of club.aliases) {
    CLUB_BY_ALIAS.set(normalizeText(alias), club);
  }
}

/** Multi-word expressions that look like names but are not players or clubs. */
const NON_NAME_EXPRESSIONS = new Set([
  'premier league',
  'serie a',
  'la liga',
  'laliga',
  'champions league',
  'europa league',
  'copa del rey',
  'ligue 1',
  'seleccion espanola',
  'real madrid',
  'manchester city',
  'manchester united',
]);

/** Single words that disqualify a candidate from being a player name. */
const STOPWORDS = new Set([
  'mercado', 'fichajes', 'fichaje', 'fichar', 'ficha', 'fichado', 'clausula',
  'millones', 'millon', 'euros', 'real', 'club', 'equipo', 'liga', 'champions',
  'invierno', 'verano', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  'temporada', 'contrato', 'oferta', 'cesion', 'traspaso', 'delantero',
  'centrocampista', 'defensa', 'portero', 'extremo', 'lateral', 'medio',
  'pivote', 'interior', 'futbol', 'copa', 'supercopa', 'mundial', 'eurocopa',
  'seleccion', 'premier', 'serie', 'bundesliga', 'laliga', 'ligue', 'analisis',
  'ultima', 'ultimo', 'hora', 'noticia', 'oficial', 'gran', 'nuevo', 'mejor',
  'peor', 'asi', 'ademas', 'aqui', 'hoy', 'ayer', 'manana', 'el', 'la', 'los',
  'las', 'un', 'una', 'unos', 'unas', 'su', 'sus', 'este', 'esta', 'estos',
  'estas', 'ese', 'esa', 'del', 'de', 'y', 'en', 'con', 'por', 'para', 'al',
  'a', 'que', 'se', 'lo', 'le', 'les', 'no', 'si', 'mas', 'tras', 'sobre',
]);

const CONNECTORS = new Set(['de', 'del', 'da', 'dos', 'van', 'der', 'di', 'la', 'le', 'y', 'von']);

/** Categories that are a section, not a club: never show them as a destination. */
const SECTION_LABELS = new Set([
  'futbol',
  'futbol femenino',
  'futbol internacional',
  'primera division',
  'segunda division',
  'mercado',
  'mercado de fichajes',
  'fichajes',
  'laliga',
  'la liga',
  'premier league',
  'serie a',
  'bundesliga',
  'ligue 1',
  'primeira liga',
  'brasileirao',
  'liga profesional',
  'champions league',
  'champions league masculina',
  'europa league',
  'seleccion',
  'seleccion espanola',
  'analisis',
  'opinion',
  'reportaje',
  'reportajes',
  'sucesos',
]);

const LEADING_DETERMINERS = /^(el|la|los|las|un|una|unos|unas)\s+/i;

const TOPIC_KEYWORDS: readonly [RegExp, string][] = [
  [/\bchampions\b/i, 'Champions League'],
  [/\bpremier league\b/i, 'Premier League'],
  [/\bserie a\b/i, 'Serie A'],
  [/\bbundesliga\b/i, 'Bundesliga'],
  [/\bligue 1\b/i, 'Ligue 1'],
  [/\b(europa league|uefa europa)\b/i, 'Otras ligas'],
  [/\b(la liga|laliga|primera division)\b/i, 'LaLiga'],
];

const KNOWN_TOPICS = new Set([
  'LaLiga',
  'Premier League',
  'Serie A',
  'Bundesliga',
  'Champions League',
  'Ligue 1',
  'Mercado',
  'Análisis',
  'Otras ligas',
]);

export function isKnownTopic(value: string): boolean {
  return KNOWN_TOPICS.has(value);
}

/** Lowercases and strips accents so comparisons ignore typography. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
};

export function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    if (entity.startsWith('#')) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/** Removes CDATA wrappers, tags and entities, then collapses whitespace. */
export function toPlainText(value: string): string {
  const withoutCdata = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  const withoutTags = withoutCdata.replace(/<[^>]+>/g, ' ');
  return decodeEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

/** Cuts on a word boundary so summaries never end mid-word. */
export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  const cut = value.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function readTag(block: string, tag: string): string | null {
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i');
  const match = pattern.exec(block);
  return match ? toPlainText(match[1]) : null;
}

function readAttribute(block: string, tag: string, attribute: string): string | null {
  const pattern = new RegExp(`<${tag}\\b[^>]*\\b${attribute}="([^"]*)"`, 'i');
  const match = pattern.exec(block);
  return match ? decodeEntities(match[1]).trim() || null : null;
}

function readLink(block: string): string | null {
  const inline = readTag(block, 'link');
  if (inline) {
    return inline;
  }

  const href = readAttribute(block, 'link', 'href');
  if (href) {
    return href;
  }

  const guid = readTag(block, 'guid');
  return guid && /^https?:\/\//i.test(guid) ? guid : null;
}

function readImage(block: string): string | null {
  return (
    readAttribute(block, 'media:content', 'url') ??
    readAttribute(block, 'enclosure', 'url') ??
    readAttribute(block, 'media:thumbnail', 'url') ??
    (() => {
      const match = /<img\b[^>]*\bsrc="([^"]+)"/i.exec(block);
      return match ? decodeEntities(match[1]).trim() : null;
    })()
  );
}

function readDate(block: string): string | null {
  const raw = readTag(block, 'pubDate') ?? readTag(block, 'published') ?? readTag(block, 'updated');
  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/** Stable 64-bit-ish identifier derived from the canonical URL. */
export function hashId(url: string): string {
  const fnv = (input: string, seed: number): string => {
    let hash = seed >>> 0;
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  };

  return `${fnv(url, 0x811c9dc5)}${fnv(url, 0x9e3779b9)}`;
}

export function resolveClub(name: string | null): Club | null {
  if (!name) {
    return null;
  }

  const key = normalizeText(name);
  return CLUB_BY_ALIAS.get(key) ?? CLUBS.find((club) => normalizeText(club.name) === key) ?? null;
}

function findClubIn(key: string): Club | null {
  for (const club of CLUBS) {
    for (const alias of club.aliases) {
      if (new RegExp(`\\b${escapeRegExp(alias)}\\b`).test(key)) {
        return club;
      }
    }
  }

  return null;
}

/**
 * The category is the strongest signal (Marca tags every item with its
 * section), then the headline. The excerpt is deliberately ignored: it often
 * mentions a competition in passing and would misfile the story.
 */
export function detectTopic(title: string, category: string | null, fallback: string): string {
  const categoryKey = category ? normalizeText(category) : '';
  const titleKey = normalizeText(title);

  for (const [pattern, topic] of TOPIC_KEYWORDS) {
    if (categoryKey && pattern.test(categoryKey)) {
      return topic;
    }
  }

  for (const [pattern, topic] of TOPIC_KEYWORDS) {
    if (pattern.test(titleKey)) {
      return topic;
    }
  }

  return findClubIn(titleKey)?.league ?? findClubIn(categoryKey)?.league ?? fallback;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Runs of capitalised words, which is where Spanish headlines put names. */
export function capitalizedRuns(title: string): string[] {
  const tokens = title.split(/\s+/);
  const runs: string[] = [];
  let current: string[] = [];

  const flush = () => {
    if (current.length > 0) {
      runs.push(current.join(' '));
    }
    current = [];
  };

  for (const raw of tokens) {
    const token = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    if (!token) {
      flush();
      continue;
    }

    if (/^[\p{Lu}Ñ]/u.test(token)) {
      current.push(token);
      continue;
    }

    if (CONNECTORS.has(token.toLowerCase()) && current.length > 0) {
      current.push(token);
      continue;
    }

    flush();
  }

  flush();
  return runs;
}

/**
 * Best guess for the player named in a transfer headline. Returns `null`
 * instead of inventing a name: the card then degrades to a market story.
 */
export function extractPlayer(title: string): string | null {
  for (const run of capitalizedRuns(title)) {
    const candidate = run.replace(LEADING_DETERMINERS, '').trim();
    const key = normalizeText(candidate);
    if (!key) {
      continue;
    }

    if (CLUB_BY_ALIAS.has(key) || NON_NAME_EXPRESSIONS.has(key)) {
      continue;
    }

    const words = key.split(' ');
    if (words.length > 3) {
      continue;
    }

    if (words.every((word) => STOPWORDS.has(word))) {
      continue;
    }

    return candidate;
  }

  return null;
}

/** `40 millones`, `1,5 M€` and `cláusula de 30 kilos` all become `X M€`. */
export function extractFee(title: string): string | null {
  const patterns = [
    /(\d+(?:[.,]\d+)?)\s*(?:millones|millon|mill\.)\s*(?:de\s+)?(?:euros|€)?/i,
    /(\d+(?:[.,]\d+)?)\s*(?:m€|m\.€|kilos|kilo)/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(title);
    if (match) {
      const amount = match[1].replace(',', '.');
      return `${amount} M€`;
    }
  }

  return null;
}

export function detectStatus(title: string): RumorStatus {
  const text = normalizeText(title);

  if (/\b(descart|no ficha|se queda|renuncia|olvida|cierra la puerta|imposible)/.test(text)) {
    return 'descartado';
  }

  if (/\b(a un paso|acuerdo cerrado|practicamente|muy cerca|cerrado|oficial|acuerdo total|ya es|hecho)/.test(text)) {
    return 'avanzado';
  }

  if (
    /\b(negocia|conversaciones|contactos|se mueve|pregunta|interes|oferta|puja|sondea|tantea|aprieta|acelera|estudia|quiere|pretende|sigue)/.test(
      text
    )
  ) {
    return 'negociando';
  }

  return 'rumor';
}

export function normalizeTitleForDedupe(title: string): string {
  return normalizeText(title).replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

/** Splits an RSS/Atom document into item blocks. */
export function splitItems(xml: string): string[] {
  const blocks: string[] = [];
  const pattern = /<item(?:\s[^>]*)?>([\s\S]*?)<\/item>|<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(xml)) !== null) {
    blocks.push(match[1] ?? match[2] ?? '');
  }

  return blocks;
}

type ParseContext = {
  source: FeedSource;
  now: number;
  /** Items older than this are dropped: the feed is a "today" view. */
  maxAgeMs?: number;
};

export function parseFeedItem(block: string, context: ParseContext): NormalizedItem | null {
  const { source, now, maxAgeMs = 14 * 24 * 60 * 60_000 } = context;

  const title = readTag(block, 'title');
  const url = readLink(block);

  if (!title || !url) {
    return null;
  }

  // Section feeds still mix sports (Marca's front page carries tennis and
  // cycling), so an optional URL path keeps the feed to football only.
  if (source.pathFilter && !url.includes(source.pathFilter)) {
    return null;
  }

  const publishedAt = readDate(block);
  if (!publishedAt) {
    return null;
  }

  const publishedMs = Date.parse(publishedAt);
  if (Number.isNaN(publishedMs) || publishedMs < now - maxAgeMs) {
    return null;
  }

  const category = readTag(block, 'category');
  const summarySource = readTag(block, 'description') ?? readTag(block, 'summary') ?? '';
  const summary = truncate(summarySource, 320);
  const author = readTag(block, 'dc:creator') ?? readTag(block, 'author') ?? null;
  const topic = detectTopic(title, category, source.topic);

  const isRumor = source.kind === 'rumor';
  const resolvedClub = resolveClub(category);
  const categoryKey = category ? normalizeText(category) : '';
  const clubName =
    resolvedClub?.name ?? (categoryKey && !SECTION_LABELS.has(categoryKey) ? category : null);

  return {
    id: hashId(url),
    kind: source.kind,
    title: truncate(title, 200),
    summary,
    topic,
    source_id: source.id,
    source_label: source.label,
    source_url: url,
    image_url: readImage(block),
    author: author ? truncate(author, 80) : null,
    // A feed with a broken clock should not push content into the future.
    published_at: new Date(Math.min(publishedMs, now)).toISOString(),
    status: isRumor ? detectStatus(title) : null,
    player: isRumor ? extractPlayer(title) : null,
    club_from: null,
    club_from_id: null,
    club_to: isRumor ? clubName : null,
    club_to_id: isRumor ? (resolvedClub?.id ?? null) : null,
    // Headlines carry the fee most of the time; the excerpt is the fallback.
    fee: isRumor ? (extractFee(title) ?? extractFee(summary)) : null,
    tags: [topic, ...(resolvedClub ? [resolvedClub.name] : [])],
  };
}

/**
 * Full pipeline for one source: parse, drop duplicates, keep the newest
 * `maxItems`. A malformed item is skipped without discarding the whole feed.
 */
export function normalizeFeed(xml: string, source: FeedSource, now: number = Date.now()): NormalizedItem[] {
  const items: NormalizedItem[] = [];

  for (const block of splitItems(xml)) {
    const item = parseFeedItem(block, { source, now });
    if (item) {
      items.push(item);
    }
  }

  const seenTitles = new Set<string>();
  const seenIds = new Set<string>();
  const deduped: NormalizedItem[] = [];

  for (const item of items) {
    const titleKey = normalizeTitleForDedupe(item.title);
    if (seenIds.has(item.id) || (titleKey.length > 12 && seenTitles.has(titleKey))) {
      continue;
    }

    seenIds.add(item.id);
    seenTitles.add(titleKey);
    deduped.push(item);
  }

  return deduped
    .sort((left, right) => right.published_at.localeCompare(left.published_at))
    .slice(0, source.maxItems);
}

/**
 * Second dedupe pass across every source. Marca's front page and its LaLiga
 * section publish the same story, so keeping the first occurrence (sources are
 * processed in priority order) avoids showing it twice.
 */
export function dedupeAcrossSources(items: readonly NormalizedItem[]): NormalizedItem[] {
  const seenTitles = new Set<string>();
  const seenIds = new Set<string>();
  const result: NormalizedItem[] = [];

  for (const item of items) {
    const titleKey = normalizeTitleForDedupe(item.title);

    if (seenIds.has(item.id) || (titleKey.length > 12 && seenTitles.has(titleKey))) {
      continue;
    }

    seenIds.add(item.id);
    seenTitles.add(titleKey);
    result.push(item);
  }

  return result;
}
