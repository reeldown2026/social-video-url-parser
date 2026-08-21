#!/usr/bin/env node
'use strict';
const { parse, supportedPlatforms } = require('../src/index.js');
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
  console.log(`
social-url-parse <url> [...urls]

Parses Instagram, Facebook and Pinterest URLs.

Options:
  --json      Output raw JSON
  --list      Show supported platforms and types
  -h, --help  Show this help
`);
  process.exit(0);
}

if (args[0] === '--list') {
  console.log(JSON.stringify(supportedPlatforms(), null, 2));
  process.exit(0);
}

const asJson = args.includes('--json');
const urls = args.filter((a) => !a.startsWith('--'));
const results = urls.map(parse);

if (asJson) {
  console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
} else {
  results.forEach((r, i) => {
    console.log(`\n${urls[i]}`);
    if (!r.valid) { console.log(`  invalid: ${r.error}`); return; }
    console.log(`  platform:  ${r.platform}`);
    console.log(`  type:      ${r.type}`);
    console.log(`  id:        ${r.id}`);
    if (r.username) console.log(`  username:  ${r.username}`);
    if (r.canonicalUrl) console.log(`  canonical: ${r.canonicalUrl}`);
  });
  console.log('');
}
process.exit(results.every((r) => r.valid) ? 0 : 1);
