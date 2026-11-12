// Adds Vitest-aware jest-dom matchers (`toBeInTheDocument`, ...).
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { TextDecoder, TextEncoder } from 'node:util';

// Polyfill TextEncoder/TextDecoder for older jsdom environments.
(globalThis as { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder;
(globalThis as { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder;

// Mock window.matchMedia for MUI components.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('@mui/system/useMediaQuery', async () => {
  const actual = await vi.importActual<typeof import('@mui/system/useMediaQuery')>(
    '@mui/system/useMediaQuery',
  );
  return {
    ...actual,
    default: () => false,
    unstable_createUseMediaQuery: () => () => false,
  };
});

// Real classes (not mock functions) so component code that does
// `new ResizeObserver(cb).observe(node)` always receives a valid instance,
// including code that reads `window.ResizeObserver` via MUI's `ownerWindow`.
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

class IntersectionObserverMock {
  root = null;
  rootMargin = '';
  thresholds: number[] = [];
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

Object.defineProperty(globalThis, 'ResizeObserver', { writable: true, value: ResizeObserverMock });
Object.defineProperty(window, 'ResizeObserver', { writable: true, value: ResizeObserverMock });
Object.defineProperty(globalThis, 'IntersectionObserver', { writable: true, value: IntersectionObserverMock });
Object.defineProperty(window, 'IntersectionObserver', { writable: true, value: IntersectionObserverMock });

// Clear storage before each test to ensure isolation.
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// Suppress console.error for expected errors during tests.
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
        args[0].includes('Error: Not implemented: navigation') ||
        args[0].includes('Failed to fetch user profile'))
    ) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
