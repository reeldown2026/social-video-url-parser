# social-video-url-parser

[![test](https://github.com/YOUR-USERNAME/social-video-url-parser/actions/workflows/test.yml/badge.svg)](https://github.com/YOUR-USERNAME/social-video-url-parser/actions/workflows/test.yml)
[![npm](https://img.shields.io/npm/v/social-video-url-parser.svg)](https://www.npmjs.com/package/social-video-url-parser)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Zero-dependency parser for Instagram, Facebook and Pinterest URLs.

Social platforms use a dozen different URL shapes for the same kind of content. An Instagram reel might arrive as `/reel/<id>`, `/reels/<id>`, `/<username>/reel/<id>`, or wrapped in tracking parameters. Pinterest pins sometimes carry a slug before the numeric ID. Facebook has at least four video formats. This library normalises all of them into one predictable object.

## Install

```bash
npm install social-video-url-parser
```

## Usage

```js
const { parse } = require('social-video-url-parser');

parse('https://www.instagram.com/reel/Cx1y2z3AbCd/?igshid=abc');
// {
//   valid: true,
//   platform: 'instagram',
//   type: 'reel',
//   id: 'Cx1y2z3AbCd',
//   username: null,
//   isShortLink: false,
//   canonicalUrl: 'https://www.instagram.com/reel/Cx1y2z3AbCd/',
//   error: null
// }

parse('https://www.pinterest.com/pin/my-cool-idea--1234567890123456/');
// { valid: true, platform: 'pinterest', type: 'pin', id: '1234567890123456', ... }

parse('https://example.com/video/123');
// { valid: false, error: 'Unsupported platform', ... }
```

### Quick check

```js
const { isSupported } = require('social-video-url-parser');

isSupported('https://fb.watch/aBcD1234/');  // true
isSupported('https://youtube.com/watch?v=x'); // false
```

## CLI

```bash
npx social-video-url-parser "https://www.instagram.com/reel/Cx1y2z3AbCd/"
```

```
https://www.instagram.com/reel/Cx1y2z3AbCd/
  platform:  instagram
  type:      reel
  id:        Cx1y2z3AbCd
  canonical: https://www.instagram.com/reel/Cx1y2z3AbCd/
```

Pass `--json` for machine-readable output, or `--list` to print every supported platform and type.

## Supported URLs

| Platform | Types | Example |
|---|---|---|
| Instagram | post, reel, story, igtv, profile | `instagram.com/reel/<id>` |
| Instagram | | `instagram.com/stories/<user>/<id>` |
| Facebook | video, reel | `facebook.com/<page>/videos/<id>` |
| Facebook | | `facebook.com/watch/?v=<id>` |
| Facebook | | `fb.watch/<code>` |
| Pinterest | pin, board | `pinterest.com/pin/<id>` |
| Pinterest | | `pin.it/<code>` |

Localised domains (`br.pinterest.com`, `m.facebook.com`, `in.pinterest.com`, …), mobile subdomains, missing schemes and tracking query parameters are all handled.

## API

### `parse(url)`

Returns an object with:

| Field | Type | Description |
|---|---|---|
| `valid` | boolean | Whether a usable content ID was extracted |
| `platform` | string\|null | `instagram`, `facebook` or `pinterest` |
| `type` | string\|null | `post`, `reel`, `story`, `igtv`, `video`, `pin`, `board`, `profile` |
| `id` | string\|null | The content identifier |
| `username` | string\|null | Author handle, when present in the URL |
| `isShortLink` | boolean | True for `pin.it` and `fb.watch` links |
| `canonicalUrl` | string\|null | Normalised URL, when one can be built |
| `error` | string\|null | Reason parsing failed |

### `isSupported(url)`

Boolean shorthand for `parse(url).valid`.

### `supportedPlatforms()`

Returns a map of platform names to their supported content types.

## Notes on short links

`pin.it` and `fb.watch` URLs are opaque redirects. This library flags them with `isShortLink: true` and returns the redirect code as the ID, but it will not resolve them — that requires a network request, and keeping the package dependency-free and synchronous is a deliberate choice. Follow the redirect yourself if you need the underlying ID:

```js
const res = await fetch(shortUrl, { redirect: 'follow' });
const real = parse(res.url);
```

## Scope

This is a URL parser, not a downloader. It does not fetch media, call any API, or interact with the platforms in any way — it only reads the string you hand it. If you are looking for a hosted tool that actually downloads the media, the maintainers run [ReelDown](https://reeldown.app), a free browser-based downloader for the same three platforms.

## Contributing

Bug reports and pull requests are welcome. If you find a URL shape that is not handled, please open an issue with the example URL.

```bash
git clone https://github.com/YOUR-USERNAME/social-video-url-parser.git
cd social-video-url-parser
npm test
```

## License

MIT
