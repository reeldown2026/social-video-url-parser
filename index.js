'use strict';

const PLATFORMS = {
  instagram: {
    hosts: ['instagram.com', 'www.instagram.com', 'm.instagram.com', 'instagr.am'],
    types: {
      p: 'post',
      reel: 'reel',
      reels: 'reel',
      tv: 'igtv',
      stories: 'story',
      share: 'share'
    }
  },
  facebook: {
    hosts: [
      'facebook.com', 'www.facebook.com', 'm.facebook.com',
      'web.facebook.com', 'fb.com', 'www.fb.com', 'fb.watch'
    ],
    types: {
      videos: 'video',
      video: 'video',
      reel: 'reel',
      watch: 'video',
      share: 'share'
    }
  },
  pinterest: {
    hosts: [
      'pinterest.com', 'www.pinterest.com', 'pin.it',
      'pinterest.co.uk', 'pinterest.ca', 'pinterest.fr',
      'pinterest.de', 'pinterest.es', 'pinterest.com.mx',
      'br.pinterest.com', 'ru.pinterest.com', 'in.pinterest.com'
    ],
    types: {
      pin: 'pin'
    }
  }
};

const SHORT_HOSTS = new Set(['pin.it', 'fb.watch', 'instagr.am']);

function detectPlatform(hostname) {
  const host = hostname.toLowerCase().replace(/^www\./, '');
  for (const [name, config] of Object.entries(PLATFORMS)) {
    for (const candidate of config.hosts) {
      const bare = candidate.replace(/^www\./, '');
      if (host === bare || host.endsWith('.' + bare)) return name;
    }
  }
  return null;
}

function cleanSegments(pathname) {
  return pathname.split('/').filter(Boolean);
}

function parseInstagram(segments, url) {
  if (segments.length === 0) return null;

  // /stories/<user>/<mediaId>
  if (segments[0] === 'stories') {
    return {
      type: 'story',
      id: segments[2] || null,
      username: segments[1] || null
    };
  }

  // /<user>/reel/<id> or /reel/<id>
  const knownIndex = segments.findIndex((s) => PLATFORMS.instagram.types[s]);
  if (knownIndex !== -1) {
    const keyword = segments[knownIndex];
    const id = segments[knownIndex + 1] || null;
    return {
      type: PLATFORMS.instagram.types[keyword],
      id,
      username: knownIndex > 0 ? segments[0] : null
    };
  }

  // Bare profile URL: /<username>
  if (segments.length === 1) {
    return { type: 'profile', id: null, username: segments[0] };
  }

  return null;
}

function parseFacebook(segments, url) {
  if (segments.length === 0) return null;

  // fb.watch/<id>
  if (url.hostname.replace(/^www\./, '') === 'fb.watch') {
    return { type: 'video', id: segments[0], username: null, short: true };
  }

  // /watch/?v=<id>
  if (segments[0] === 'watch') {
    const v = url.searchParams.get('v');
    return { type: 'video', id: v || segments[1] || null, username: null };
  }

  // /<page>/videos/<id> or /reel/<id>
  const knownIndex = segments.findIndex((s) => PLATFORMS.facebook.types[s]);
  if (knownIndex !== -1) {
    const keyword = segments[knownIndex];
    let id = segments[knownIndex + 1] || null;
    // Some URLs use /videos/<slug>/<id>/
    if (id && !/^\d+$/.test(id) && segments[knownIndex + 2]) {
      id = segments[knownIndex + 2];
    }
    return {
      type: PLATFORMS.facebook.types[keyword],
      id,
      username: knownIndex > 0 ? segments[0] : null
    };
  }

  // /video.php?v=<id>
  if (segments[0] === 'video.php') {
    return { type: 'video', id: url.searchParams.get('v'), username: null };
  }

  return null;
}

function parsePinterest(segments, url) {
  if (segments.length === 0) return null;

  // pin.it/<code>
  if (url.hostname.replace(/^www\./, '') === 'pin.it') {
    return { type: 'pin', id: segments[0], username: null, short: true };
  }

  // /pin/<id>/ — may be prefixed by a locale, e.g. /de/pin/<id>
  const pinIndex = segments.indexOf('pin');
  if (pinIndex !== -1 && segments[pinIndex + 1]) {
    const raw = segments[pinIndex + 1];
    // IDs sometimes look like "slug--123456789"
    const match = raw.match(/(\d{6,})$/);
    return {
      type: 'pin',
      id: match ? match[1] : raw,
      username: null
    };
  }

  // /<user>/<board>/
  if (segments.length >= 2) {
    return { type: 'board', id: segments[1], username: segments[0] };
  }

  return null;
}

const PARSERS = {
  instagram: parseInstagram,
  facebook: parseFacebook,
  pinterest: parsePinterest
};

/**
 * Parse a social media URL into structured data.
 *
 * @param {string} input - The URL to parse.
 * @returns {{valid: boolean, platform: string|null, type: string|null,
 *            id: string|null, username: string|null, isShortLink: boolean,
 *            canonicalUrl: string|null, error: string|null}}
 */
function parse(input) {
  const result = {
    valid: false,
    platform: null,
    type: null,
    id: null,
    username: null,
    isShortLink: false,
    canonicalUrl: null,
    error: null
  };

  if (typeof input !== 'string' || input.trim() === '') {
    result.error = 'Input must be a non-empty string';
    return result;
  }

  let raw = input.trim();
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;

  let url;
  try {
    url = new URL(raw);
  } catch (err) {
    result.error = 'Malformed URL';
    return result;
  }

  const platform = detectPlatform(url.hostname);
  if (!platform) {
    result.error = 'Unsupported platform';
    return result;
  }

  result.platform = platform;
  result.isShortLink = SHORT_HOSTS.has(url.hostname.toLowerCase().replace(/^www\./, ''));

  const segments = cleanSegments(url.pathname);
  const parsed = PARSERS[platform](segments, url);

  if (!parsed || !parsed.type) {
    result.error = 'Could not determine content type';
    return result;
  }

  result.type = parsed.type;
  result.id = parsed.id || null;
  result.username = parsed.username || null;
  result.valid = Boolean(result.id) || result.type === 'profile';
  result.canonicalUrl = buildCanonical(platform, result);

  if (!result.valid) result.error = 'Missing content identifier';

  return result;
}

function buildCanonical(platform, r) {
  if (!r.id) return null;
  if (r.isShortLink) return null;

  if (platform === 'instagram') {
    if (r.type === 'reel') return `https://www.instagram.com/reel/${r.id}/`;
    if (r.type === 'post') return `https://www.instagram.com/p/${r.id}/`;
    if (r.type === 'igtv') return `https://www.instagram.com/tv/${r.id}/`;
    if (r.type === 'story' && r.username) {
      return `https://www.instagram.com/stories/${r.username}/${r.id}/`;
    }
    return null;
  }

  if (platform === 'facebook') {
    if (r.type === 'reel') return `https://www.facebook.com/reel/${r.id}/`;
    if (r.type === 'video') return `https://www.facebook.com/watch/?v=${r.id}`;
    return null;
  }

  if (platform === 'pinterest') {
    if (r.type === 'pin') return `https://www.pinterest.com/pin/${r.id}/`;
    return null;
  }

  return null;
}

/**
 * Quick boolean check.
 * @param {string} input
 * @returns {boolean}
 */
function isSupported(input) {
  return parse(input).valid;
}

/**
 * List every platform and content type the parser understands.
 * @returns {Object<string, string[]>}
 */
function supportedPlatforms() {
  const out = {};
  for (const [name, config] of Object.entries(PLATFORMS)) {
    out[name] = [...new Set(Object.values(config.types))];
  }
  return out;
}

module.exports = { parse, isSupported, supportedPlatforms };
