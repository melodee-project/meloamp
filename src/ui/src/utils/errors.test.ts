import { getErrorMessage, getErrorStatus, isCanceledError } from './errors';

describe('error helpers', () => {
  test('extracts the API message from an axios-style error', () => {
    const error = { response: { status: 500, data: { message: 'Server exploded' } } };
    expect(getErrorMessage(error)).toBe('Server exploded');
  });

  test('falls back through detail, title, Error.message, then default', () => {
    expect(getErrorMessage({ response: { data: { detail: 'detail' } } })).toBe('detail');
    expect(getErrorMessage({ response: { data: { title: 'title' } } })).toBe('title');
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
    expect(getErrorMessage('nope')).toBe('Something went wrong');
    expect(getErrorMessage(null, 'fallback')).toBe('fallback');
    expect(getErrorMessage({ response: { data: { message: '   ' } } })).toBe('Something went wrong');
  });

  test('getErrorStatus only returns numeric statuses', () => {
    expect(getErrorStatus({ response: { status: 404 } })).toBe(404);
    expect(getErrorStatus({ response: { status: '404' } })).toBeUndefined();
    expect(getErrorStatus(new Error('x'))).toBeUndefined();
    expect(getErrorStatus(undefined)).toBeUndefined();
  });

  test('isCanceledError recognises axios cancellations', () => {
    expect(isCanceledError({ code: 'ERR_CANCELED' })).toBe(true);
    expect(isCanceledError({ name: 'CanceledError' })).toBe(true);
    expect(isCanceledError(new Error('nope'))).toBe(false);
    expect(isCanceledError(null)).toBe(false);
  });
});
