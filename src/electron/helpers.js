/**
 * Pure helpers for the Electron main process.
 *
 * Kept free of `electron` imports so they can be unit-tested with
 * `node --test` (no display server required).
 */
'use strict';

const path = require('node:path');
const { pathToFileURL } = require('node:url');

/** Convert a D-Bus / MPRIS microsecond value to seconds. */
function microsecondsToSeconds(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return numeric / 1_000_000;
}

/** Convert seconds to the microseconds MPRIS expects. */
function secondsToMicroseconds(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric * 1_000_000);
}

/**
 * Turn an absolute file path into a `file://` URL that MPRIS/notifications
 * can consume. (This is the helper that `cacheArtUrl` previously called but
 * which had been deleted.)
 */
function formatArtUrl(filePath) {
  if (!filePath) return '';
  if (/^(https?|file):\/\//i.test(filePath)) return filePath;
  try {
    return pathToFileURL(filePath).toString();
  } catch {
    return '';
  }
}

/** Generate a valid D-Bus object path for an MPRIS track id. */
function generateTrackId(trackId) {
  if (!trackId) return '/org/mpris/MediaPlayer2/track/0';
  const sanitized = String(trackId).replace(/[^a-zA-Z0-9_]/g, '_');
  return `/org/mpris/MediaPlayer2/track/${sanitized}`;
}

const ALLOWED_ACCELERATOR_KEYS = new Set([
  'MediaPlayPause', 'MediaNextTrack', 'MediaPreviousTrack', 'MediaStop',
  'MediaPlay', 'MediaPause', 'Space', 'Enter', 'Left', 'Right', 'Up', 'Down',
  'Escape', 'Tab', 'Backspace', 'Delete', 'Home', 'End', 'PageUp', 'PageDown',
]);

const ALLOWED_ACCELERATOR_MODIFIERS = new Set([
  'CommandOrControl', 'CmdOrCtrl', 'Command', 'Cmd', 'Control', 'Ctrl',
  'Alt', 'Option', 'AltGr', 'Shift', 'Super', 'Meta',
]);

/** Combinations that would shadow OS-level shortcuts. */
const DENIED_ACCELERATORS = new Set(['alt+f4', 'control+alt+delete', 'ctrl+alt+delete', 'meta+q', 'command+q']);

/**
 * Validate a single Electron accelerator string.
 * Returns the accelerator when safe, otherwise `null`.
 *
 * Prevents the renderer from registering arbitrary global shortcuts.
 */
function sanitizeAccelerator(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 100) return null;

  const parts = trimmed.split('+');
  const key = parts.pop();
  const modifiers = parts;

  if (!key) return null;

  const isFunctionKey = /^F([1-9]|1[0-9]|2[0-4])$/.test(key);
  const isSingleChar = /^[A-Za-z0-9]$/.test(key);
  const isAllowedKey = ALLOWED_ACCELERATOR_KEYS.has(key);

  if (!(isFunctionKey || isSingleChar || isAllowedKey)) return null;
  if (!modifiers.every((modifier) => ALLOWED_ACCELERATOR_MODIFIERS.has(modifier))) return null;
  if (DENIED_ACCELERATORS.has(trimmed.toLowerCase())) return null;

  return trimmed;
}

/** Only http(s) URLs may be opened in the user's browser. */
function isAllowedExternalUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Build a deterministic cache file path for a remote artwork URL.
 * The hash keeps user-controlled URLs from escaping the cache directory.
 */
function artCachePath(cacheDir, url, hash) {
  const extension = path.extname(new URL(url).pathname) || '.jpg';
  const safeExtension = /^\.[a-zA-Z0-9]{1,5}$/.test(extension) ? extension.toLowerCase() : '.jpg';
  return path.join(cacheDir, `${hash}${safeExtension}`);
}

module.exports = {
  ALLOWED_ACCELERATOR_KEYS,
  ALLOWED_ACCELERATOR_MODIFIERS,
  artCachePath,
  formatArtUrl,
  generateTrackId,
  isAllowedExternalUrl,
  microsecondsToSeconds,
  sanitizeAccelerator,
  secondsToMicroseconds,
};
