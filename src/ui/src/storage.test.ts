import { readJsonFromStorage, readUser, writeUser, clearUser } from './storage';

describe('storage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('readJsonFromStorage returns null for missing key', () => {
    expect(readJsonFromStorage(localStorage, 'nope')).toBeNull();
  });

  test('readJsonFromStorage parses JSON value', () => {
    localStorage.setItem('foo', '{"a":1}');
    expect(readJsonFromStorage(localStorage, 'foo')).toEqual({ a: 1 });
  });

  test('readJsonFromStorage returns null on invalid JSON', () => {
    localStorage.setItem('bad', 'not json');
    expect(readJsonFromStorage(localStorage, 'bad')).toBeNull();
  });

  test('readUser prefers localStorage over sessionStorage', () => {
    localStorage.setItem('user', JSON.stringify({ id: 'local' }));
    sessionStorage.setItem('user', JSON.stringify({ id: 'session' }));
    expect(readUser()).toEqual({ id: 'local' });
  });

  test('readUser falls back to sessionStorage', () => {
    sessionStorage.setItem('user', JSON.stringify({ id: 'session' }));
    expect(readUser()).toEqual({ id: 'session' });
  });

  test('readUser returns null when neither store has user', () => {
    expect(readUser()).toBeNull();
  });

  test('writeUser writes to both stores', () => {
    writeUser({ id: 'u1' });
    expect(JSON.parse(localStorage.getItem('user') || 'null')).toEqual({ id: 'u1' });
    expect(JSON.parse(sessionStorage.getItem('user') || 'null')).toEqual({ id: 'u1' });
  });

  test('clearUser removes from both stores', () => {
    localStorage.setItem('user', JSON.stringify({ id: 'u1' }));
    sessionStorage.setItem('user', JSON.stringify({ id: 'u1' }));
    clearUser();
    expect(localStorage.getItem('user')).toBeNull();
    expect(sessionStorage.getItem('user')).toBeNull();
  });
});
