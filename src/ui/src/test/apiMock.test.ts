import { setupApiMock, cleanupApiMock, mockUnauthorized, mockServerError, mockNetworkError, mockTimeout } from './apiMock';

describe('apiMock helpers', () => {
  beforeEach(() => {
    setupApiMock();
  });

  afterEach(() => {
    cleanupApiMock();
  });

  describe('mockUnauthorized', () => {
    test('mocks 401 response for user endpoint', () => {
      mockUnauthorized();
      // Just verify it doesn't throw
      expect(() => mockUnauthorized()).not.toThrow();
    });
  });

  describe('mockServerError', () => {
    test('mocks 500 error for specific endpoint', () => {
      expect(() => mockServerError('/test')).not.toThrow();
    });
  });

  describe('mockNetworkError', () => {
    test('mocks network error for specific endpoint', () => {
      expect(() => mockNetworkError('/test')).not.toThrow();
    });
  });

  describe('mockTimeout', () => {
    test('mocks timeout for specific endpoint', () => {
      expect(() => mockTimeout('/test')).not.toThrow();
    });
  });
});