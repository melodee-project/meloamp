// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for Jest environment (needed by react-router v7)
import { TextEncoder, TextDecoder } from 'util';
(global as { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;

// Mock window.matchMedia for MUI components
(window as Window & { matchMedia: typeof window.matchMedia }).matchMedia = jest.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

jest.mock('@mui/system/useMediaQuery', () => {
  const actual = jest.requireActual('@mui/system/useMediaQuery');
  return {
    ...actual,
    default: () => false,
    unstable_createUseMediaQuery: () => () => false,
  };
});

// Real classes (not jest.fn mocks) so component code that does
// `new ResizeObserver(cb).observe(node)` always receives a valid instance,
// including code that reads `window.ResizeObserver` via MUI's `ownerWindow`.
class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

class IntersectionObserverMock {
  root = null;
  rootMargin = '';
  thresholds: number[] = [];
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn(() => []);
}

Object.defineProperty(global, 'ResizeObserver', { writable: true, value: ResizeObserverMock });
Object.defineProperty(window, 'ResizeObserver', { writable: true, value: ResizeObserverMock });
Object.defineProperty(global, 'IntersectionObserver', { writable: true, value: IntersectionObserverMock });
Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: IntersectionObserverMock });

// Clear localStorage before each test to ensure isolation
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// Suppress console.error for expected errors during tests
// (e.g., React act warnings, expected API errors)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suppress specific expected warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
       args[0].includes('Error: Not implemented: navigation') ||
       args[0].includes('Failed to fetch user profile'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
