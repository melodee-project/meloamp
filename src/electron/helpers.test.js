'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  artCachePath,
  SHELL_PORT_CANDIDATES,
  shellUrl,
  formatArtUrl,
  generateTrackId,
  isAllowedExternalUrl,
  listenOnAvailablePort,
  microsecondsToSeconds,
  sanitizeAccelerator,
  secondsToMicroseconds,
} = require('./helpers');

test('static server skips occupied ports and serves its own handler', async (t) => {
  const occupied = await listenOnAvailablePort((_req, res) => res.end('other service'), [0]);
  t.after(() => occupied.close());
  const port = occupied.address().port;
  const server = await listenOnAvailablePort((_req, res) => res.end('MeloAmp'), [port, 0]);
  t.after(() => server.close());
  assert.notEqual(server.address().port, port);
  const response = await fetch(`http://127.0.0.1:${server.address().port}`);
  assert.equal(await response.text(), 'MeloAmp');
});

test('static server rejects when every candidate is occupied', async (t) => {
  const occupied = await listenOnAvailablePort((_req, res) => res.end(), [0]);
  t.after(() => occupied.close());
  await assert.rejects(listenOnAvailablePort(() => {}, [occupied.address().port]), /Failed to bind/);
});

test('static server propagates errors other than port conflicts', async () => {
  await assert.rejects(listenOnAvailablePort(() => {}, [-1, 0]), { code: 'ERR_SOCKET_BAD_PORT' });
});

test('microsecondsToSeconds converts and tolerates junk', () => {
  assert.equal(microsecondsToSeconds(1_500_000), 1.5);
  assert.equal(microsecondsToSeconds('2500000'), 2.5);
  assert.equal(microsecondsToSeconds(undefined), 0);
  assert.equal(microsecondsToSeconds('nope'), 0);
});

test('secondsToMicroseconds rounds to an integer', () => {
  assert.equal(secondsToMicroseconds(1.5), 1_500_000);
  assert.equal(secondsToMicroseconds('bad'), 0);
});

test('formatArtUrl produces file URLs and passes HTTP URLs through', () => {
  const fileUrl = formatArtUrl(path.join(path.sep, 'tmp', 'cover art.jpg'));
  assert.ok(fileUrl.startsWith('file://'), fileUrl);
  assert.ok(fileUrl.includes('cover%20art.jpg'), fileUrl);
  assert.equal(formatArtUrl('https://example.com/a.jpg'), 'https://example.com/a.jpg');
  assert.equal(formatArtUrl(''), '');
});

test('generateTrackId sanitises ids', () => {
  assert.equal(generateTrackId('abc-123/../x'), '/org/mpris/MediaPlayer2/track/abc_123____x');
  assert.equal(generateTrackId(null), '/org/mpris/MediaPlayer2/track/0');
});

test('sanitizeAccelerator accepts known accelerators only', () => {
  assert.equal(sanitizeAccelerator('MediaPlayPause'), 'MediaPlayPause');
  assert.equal(sanitizeAccelerator('CommandOrControl+Shift+P'), 'CommandOrControl+Shift+P');
  assert.equal(sanitizeAccelerator('F5'), 'F5');
  assert.equal(sanitizeAccelerator('Control+Alt+Delete'), null);
  assert.equal(sanitizeAccelerator('Alt+F4'), null);
  assert.equal(sanitizeAccelerator('Control+;'), null);
  assert.equal(sanitizeAccelerator(''), null);
  assert.equal(sanitizeAccelerator(42), null);
});

test('isAllowedExternalUrl only allows http(s)', () => {
  assert.equal(isAllowedExternalUrl('https://example.com'), true);
  assert.equal(isAllowedExternalUrl('http://example.com'), true);
  assert.equal(isAllowedExternalUrl('file:///etc/passwd'), false);
  assert.equal(isAllowedExternalUrl('javascript:alert(1)'), false);
  assert.equal(isAllowedExternalUrl('not a url'), false);
});

test('artCachePath keeps output inside the cache directory', () => {
  const cacheDir = path.join(path.sep, 'tmp', 'meloamp-art');
  const result = artCachePath(cacheDir, 'https://example.com/x.PNG', 'abc123');
  assert.equal(result, path.join(cacheDir, 'abc123.png'));

  const traversal = artCachePath(cacheDir, 'https://example.com/../../etc/passwd', 'abc123');
  assert.equal(path.dirname(traversal), cacheDir);
});

test('shell URL uses localhost so the server CORS allowlist matches', () => {
  assert.equal(shellUrl(3001), 'http://localhost:3001');
  assert.deepEqual([...SHELL_PORT_CANDIDATES], [3001, 3000, 8080]);
  for (const port of SHELL_PORT_CANDIDATES) {
    assert.ok(shellUrl(port).startsWith('http://localhost:'), shellUrl(port));
  }
});
