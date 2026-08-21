'use strict';

const assert = require('assert');
const { parse, isSupported, supportedPlatforms } = require('../src/index.js');

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL  ${name}`);
    console.log(`        ${err.message}`);
  }
}

console.log('\ninstagram');

it('parses a reel URL', () => {
  const r = parse('https://www.instagram.com/reel/Cx1y2z3AbCd/');
  assert.strictEqual(r.platform, 'instagram');
  assert.strictEqual(r.type, 'reel');
  assert.strictEqual(r.id, 'Cx1y2z3AbCd');
  assert.strictEqual(r.valid, true);
});

it('parses a post URL', () => {
  const r = parse('https://instagram.com/p/ABC123xyz/');
  assert.strictEqual(r.type, 'post');
  assert.strictEqual(r.id, 'ABC123xyz');
});

it('parses a username-prefixed reel', () => {
  const r = parse('https://www.instagram.com/natgeo/reel/Cx1y2z3AbCd/');
  assert.strictEqual(r.type, 'reel');
  assert.strictEqual(r.username, 'natgeo');
});

it('parses a story URL', () => {
  const r = parse('https://www.instagram.com/stories/natgeo/3241234567890/');
  assert.strictEqual(r.type, 'story');
  assert.strictEqual(r.username, 'natgeo');
  assert.strictEqual(r.id, '3241234567890');
});

it('parses an IGTV URL', () => {
  const r = parse('https://www.instagram.com/tv/ABC123/');
  assert.strictEqual(r.type, 'igtv');
});

it('strips query parameters', () => {
  const r = parse('https://www.instagram.com/reel/Cx1y2z3AbCd/?igshid=abc123');
  assert.strictEqual(r.id, 'Cx1y2z3AbCd');
});

it('builds a canonical URL', () => {
  const r = parse('https://instagram.com/p/ABC123xyz/');
  assert.strictEqual(r.canonicalUrl, 'https://www.instagram.com/p/ABC123xyz/');
});

console.log('\nfacebook');

it('parses a page video URL', () => {
  const r = parse('https://www.facebook.com/natgeo/videos/1234567890123456/');
  assert.strictEqual(r.platform, 'facebook');
  assert.strictEqual(r.type, 'video');
  assert.strictEqual(r.id, '1234567890123456');
});

it('parses a reel URL', () => {
  const r = parse('https://www.facebook.com/reel/987654321098765');
  assert.strictEqual(r.type, 'reel');
  assert.strictEqual(r.id, '987654321098765');
});

it('parses a watch URL with a query id', () => {
  const r = parse('https://www.facebook.com/watch/?v=1234567890');
  assert.strictEqual(r.type, 'video');
  assert.strictEqual(r.id, '1234567890');
});

it('flags fb.watch as a short link', () => {
  const r = parse('https://fb.watch/aBcD1234/');
  assert.strictEqual(r.isShortLink, true);
  assert.strictEqual(r.platform, 'facebook');
});

it('handles a slug between keyword and id', () => {
  const r = parse('https://www.facebook.com/natgeo/videos/some-slug-here/1234567890/');
  assert.strictEqual(r.id, '1234567890');
});

console.log('\npinterest');

it('parses a pin URL', () => {
  const r = parse('https://www.pinterest.com/pin/1234567890123456/');
  assert.strictEqual(r.platform, 'pinterest');
  assert.strictEqual(r.type, 'pin');
  assert.strictEqual(r.id, '1234567890123456');
});

it('parses a localised pin URL', () => {
  const r = parse('https://br.pinterest.com/pin/9876543210987654/');
  assert.strictEqual(r.type, 'pin');
  assert.strictEqual(r.id, '9876543210987654');
});

it('extracts the id from a slug-prefixed pin', () => {
  const r = parse('https://www.pinterest.com/pin/my-cool-idea--1234567890123456/');
  assert.strictEqual(r.id, '1234567890123456');
});

it('flags pin.it as a short link', () => {
  const r = parse('https://pin.it/aBcDeF');
  assert.strictEqual(r.isShortLink, true);
  assert.strictEqual(r.type, 'pin');
});

it('parses a board URL', () => {
  const r = parse('https://www.pinterest.com/someuser/my-board/');
  assert.strictEqual(r.type, 'board');
  assert.strictEqual(r.username, 'someuser');
});

console.log('\nedge cases');

it('accepts a URL without a scheme', () => {
  const r = parse('instagram.com/reel/ABC123/');
  assert.strictEqual(r.valid, true);
});

it('rejects an empty string', () => {
  const r = parse('');
  assert.strictEqual(r.valid, false);
  assert.ok(r.error);
});

it('rejects a non-string input', () => {
  const r = parse(null);
  assert.strictEqual(r.valid, false);
});

it('rejects an unsupported platform', () => {
  const r = parse('https://example.com/video/123');
  assert.strictEqual(r.valid, false);
  assert.strictEqual(r.error, 'Unsupported platform');
});

it('isSupported returns a boolean', () => {
  assert.strictEqual(isSupported('https://www.instagram.com/reel/ABC123/'), true);
  assert.strictEqual(isSupported('https://example.com'), false);
});

it('supportedPlatforms lists all three platforms', () => {
  const p = supportedPlatforms();
  assert.ok(p.instagram && p.facebook && p.pinterest);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
