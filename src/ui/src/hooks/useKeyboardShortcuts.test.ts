import { formatShortcut, parseKeyCombination, matchesKeyCombination, isInputElement } from './useKeyboardShortcuts';

describe('parseKeyCombination', () => {
  test('parses simple key', () => {
    const result = parseKeyCombination('space');
    expect(result.key).toBe(' ');
    expect(result.ctrl).toBe(false);
  });

  test('parses ctrl+k', () => {
    const result = parseKeyCombination('ctrl+k');
    expect(result.key).toBe('k');
    expect(result.ctrl).toBe(true);
  });

  test('parses ctrl+shift+p', () => {
    const result = parseKeyCombination('ctrl+shift+p');
    expect(result.key).toBe('p');
    expect(result.ctrl).toBe(true);
    expect(result.shift).toBe(true);
  });

  test('parses meta key variants', () => {
    expect(parseKeyCombination('meta+k').meta).toBe(true);
    expect(parseKeyCombination('cmd+k').meta).toBe(true);
    expect(parseKeyCombination('command+k').meta).toBe(true);
  });

  test('parses alt key', () => {
    const result = parseKeyCombination('alt+ArrowLeft');
    expect(result.key).toBe('arrowleft');
    expect(result.alt).toBe(true);
  });
});

describe('formatShortcut', () => {
  const originalPlatform = navigator.platform;

  afterEach(() => {
    Object.defineProperty(navigator, 'platform', { value: originalPlatform, configurable: true });
  });

  test('formats ctrl+k', () => {
    expect(formatShortcut('ctrl+k')).toBe('Ctrl+K');
  });

  test('formats shift+/', () => {
    expect(formatShortcut('shift+/')).toBe('Shift+/');
  });

  test('formats space key alone', () => {
    expect(formatShortcut('space')).toBe('␣');
  });

  test('formats ctrl+space', () => {
    expect(formatShortcut('ctrl+space')).toBe('Ctrl+␣');
  });

  test('formats escape', () => {
    expect(formatShortcut('escape')).toBe('Esc');
  });

  test('formats arrow keys', () => {
    expect(formatShortcut('arrowup')).toBe('↑');
    expect(formatShortcut('arrowdown')).toBe('↓');
    expect(formatShortcut('arrowleft')).toBe('←');
    expect(formatShortcut('arrowright')).toBe('→');
  });

  test('formats enter', () => {
    expect(formatShortcut('enter')).toBe('↵');
  });

  test('formats with mac modifiers', () => {
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true });
    expect(formatShortcut('ctrl+k')).toBe('⌃K');
    expect(formatShortcut('alt+k')).toBe('⌥K');
    expect(formatShortcut('shift+k')).toBe('⇧K');
    expect(formatShortcut('meta+k')).toBe('⌘K');
  });
});

describe('isInputElement', () => {
  test('returns false for null', () => {
    expect(isInputElement(null)).toBe(false);
  });

  test('returns true for input elements', () => {
    const input = document.createElement('input');
    expect(isInputElement(input)).toBe(true);
  });

  test('returns true for textarea', () => {
    const textarea = document.createElement('textarea');
    expect(isInputElement(textarea)).toBe(true);
  });

  test('returns true for select', () => {
    const select = document.createElement('select');
    expect(isInputElement(select)).toBe(true);
  });

  test('returns true for contentEditable', () => {
    const div = document.createElement('div');
    div.contentEditable = 'true';
    expect(isInputElement(div)).toBe(true);
  });

  test('returns false for regular div', () => {
    const div = document.createElement('div');
    expect(isInputElement(div)).toBe(false);
  });
});
