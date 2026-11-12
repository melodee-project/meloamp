'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { MESSAGES, resolveLocale, translate } = require('./strings');

test('all locales define the same keys as English', () => {
  const englishKeys = Object.keys(MESSAGES.en).sort();
  for (const [locale, dictionary] of Object.entries(MESSAGES)) {
    assert.deepEqual(Object.keys(dictionary).sort(), englishKeys, `locale ${locale} key mismatch`);
  }
});

test('resolveLocale falls back sensibly', () => {
  assert.equal(resolveLocale('de-AT'), 'de');
  assert.equal(resolveLocale('zh_Hans'), 'zh-CN');
  assert.equal(resolveLocale('pt-BR'), 'pt');
  assert.equal(resolveLocale('xx-YY'), 'en');
  assert.equal(resolveLocale(undefined), 'en');
});

test('translate interpolates and falls back to English', () => {
  assert.equal(translate('en', 'tray.next'), 'Next');
  assert.equal(translate('de', 'tray.next'), 'Weiter');
  assert.equal(translate('de', 'dialog.aboutMessage', { version: '1.2.3' }), 'MeloAmp v1.2.3');
  assert.equal(translate('xx', 'tray.next'), 'Next');
  assert.equal(translate('en', 'missing.key'), 'missing.key');
});
