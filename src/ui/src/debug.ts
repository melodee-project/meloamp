// Debug logging utility
// Set DEBUG_ENABLED to true to enable verbose console logging
// Or set localStorage.setItem('meloamp_debug', 'true') in browser console

const DEBUG_ENABLED = false;

export function isDebugEnabled(): boolean {
  if (DEBUG_ENABLED) return true;
  try {
    return localStorage.getItem('meloamp_debug') === 'true';
  } catch {
    return false;
  }
}

export function debugLog(tag: string, ...args: any[]): void {
  if (isDebugEnabled()) {
    console.log(`[${tag}]`, ...args);
  }
}

export function debugError(tag: string, ...args: any[]): void {
  // Always log errors, but only with tag prefix if debug is enabled
  if (isDebugEnabled()) {
    console.error(`[${tag}]`, ...args);
  } else {
    // Still log errors but without verbose prefix
    console.error(...args);
  }
}
