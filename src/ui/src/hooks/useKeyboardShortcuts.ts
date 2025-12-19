import { useEffect, useCallback, useMemo } from 'react';

export interface KeyboardShortcut {
  /** Key combination (e.g., 'ctrl+k', 'shift+/', 'space') */
  key: string;
  /** Description for display in help */
  description: string;
  /** Callback when shortcut is triggered */
  action: () => void;
  /** Whether shortcut is enabled */
  enabled?: boolean;
  /** Category for grouping in help display */
  category?: string;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  /** Whether shortcuts are globally enabled */
  enabled?: boolean;
  /** Element to attach listeners to (defaults to window) */
  target?: HTMLElement | Window | null;
}

/**
 * Parse a key combination string into its components.
 * Supports: ctrl, alt, shift, meta (cmd on Mac)
 */
function parseKeyCombination(combo: string): { 
  key: string; 
  ctrl: boolean; 
  alt: boolean; 
  shift: boolean; 
  meta: boolean;
} {
  const parts = combo.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  
  return {
    key: key === 'space' ? ' ' : key,
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
  };
}

/**
 * Check if a keyboard event matches a key combination.
 */
function matchesKeyCombination(
  event: KeyboardEvent, 
  combo: ReturnType<typeof parseKeyCombination>
): boolean {
  const eventKey = event.key.toLowerCase();
  const comboKey = combo.key.toLowerCase();
  
  // Handle special keys
  const keyMatches = eventKey === comboKey || 
    (comboKey === '/' && eventKey === '/') ||
    (comboKey === '?' && event.shiftKey && eventKey === '/') ||
    (comboKey === 'escape' && eventKey === 'escape') ||
    (comboKey === 'esc' && eventKey === 'escape') ||
    (comboKey === 'enter' && eventKey === 'enter') ||
    (comboKey === ' ' && eventKey === ' ');

  return keyMatches &&
    event.ctrlKey === combo.ctrl &&
    event.altKey === combo.alt &&
    event.shiftKey === combo.shift &&
    event.metaKey === combo.meta;
}

/**
 * Check if the event target is an input element where shortcuts should be ignored.
 */
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  
  const tagName = target.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  const isContentEditable = target.isContentEditable;
  
  return isInput || isContentEditable;
}

/**
 * Hook for managing keyboard shortcuts.
 * 
 * @example
 * useKeyboardShortcuts([
 *   { key: 'ctrl+k', description: 'Open search', action: openSearch },
 *   { key: 'space', description: 'Play/Pause', action: togglePlay },
 * ]);
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, target = typeof window !== 'undefined' ? window : null } = options;

  // Memoize parsed shortcuts
  const parsedShortcuts = useMemo(() => 
    shortcuts
      .filter(s => s.enabled !== false)
      .map(s => ({
        ...s,
        parsed: parseKeyCombination(s.key),
      })),
    [shortcuts]
  );

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if in input element (unless it's Escape)
    if (isInputElement(event.target) && event.key !== 'Escape') {
      return;
    }

    for (const shortcut of parsedShortcuts) {
      if (matchesKeyCombination(event, shortcut.parsed)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.action();
        break;
      }
    }
  }, [parsedShortcuts]);

  useEffect(() => {
    if (!enabled || !target) return;

    target.addEventListener('keydown', handleKeyDown as EventListener);
    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [enabled, target, handleKeyDown]);

  return { shortcuts: parsedShortcuts };
}

/**
 * Format a key combination for display.
 */
export function formatShortcut(key: string): string {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  
  return key
    .split('+')
    .map(part => {
      const p = part.toLowerCase();
      if (p === 'ctrl' || p === 'control') return isMac ? '⌃' : 'Ctrl';
      if (p === 'alt') return isMac ? '⌥' : 'Alt';
      if (p === 'shift') return isMac ? '⇧' : 'Shift';
      if (p === 'meta' || p === 'cmd' || p === 'command') return isMac ? '⌘' : 'Win';
      if (p === 'space') return '␣';
      if (p === 'escape' || p === 'esc') return 'Esc';
      if (p === 'enter') return '↵';
      if (p === 'arrowup') return '↑';
      if (p === 'arrowdown') return '↓';
      if (p === 'arrowleft') return '←';
      if (p === 'arrowright') return '→';
      return part.toUpperCase();
    })
    .join(isMac ? '' : '+');
}

export default useKeyboardShortcuts;
