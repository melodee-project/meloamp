import { debugLog, debugError, isDebugEnabled } from './debug';

describe('debug utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('isDebugEnabled returns false by default', () => {
    expect(isDebugEnabled()).toBe(false);
  });

  test('isDebugEnabled returns true when localStorage flag is set', () => {
    localStorage.setItem('meloamp_debug', 'true');
    expect(isDebugEnabled()).toBe(true);
  });

  test('debugLog does not log when debug is disabled', () => {
    debugLog('Tag', 'message');
    expect(console.log).not.toHaveBeenCalled();
  });

  test('debugLog logs when debug is enabled', () => {
    localStorage.setItem('meloamp_debug', 'true');
    debugLog('Tag', 'message');
    expect(console.log).toHaveBeenCalledWith('[Tag]', 'message');
  });

  test('debugError logs with tag when enabled', () => {
    localStorage.setItem('meloamp_debug', 'true');
    debugError('Tag', 'err');
    expect(console.error).toHaveBeenCalledWith('[Tag]', 'err');
  });

  test('debugError logs without tag when disabled', () => {
    debugError('Tag', 'err');
    expect(console.error).toHaveBeenCalledWith('err');
  });

  test('isDebugEnabled handles localStorage exception gracefully', () => {
    const getItemMock = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('storage error'); });
    expect(isDebugEnabled()).toBe(false);
    getItemMock.mockRestore();
  });
});
