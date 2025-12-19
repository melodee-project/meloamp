import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts, formatShortcut } from './hooks/useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  it('calls action when shortcut matches', () => {
    const action = jest.fn();
    
    renderHook(() => 
      useKeyboardShortcuts([
        { key: 'ctrl+k', description: 'Search', action }
      ])
    );

    // Simulate Ctrl+K keydown
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('does not call action when shortcut does not match', () => {
    const action = jest.fn();
    
    renderHook(() => 
      useKeyboardShortcuts([
        { key: 'ctrl+k', description: 'Search', action }
      ])
    );

    // Simulate just K without Ctrl
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: false,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(action).not.toHaveBeenCalled();
  });

  it('does not trigger shortcuts when disabled', () => {
    const action = jest.fn();
    
    renderHook(() => 
      useKeyboardShortcuts(
        [{ key: 'ctrl+k', description: 'Search', action }],
        { enabled: false }
      )
    );

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(action).not.toHaveBeenCalled();
  });

  it('skips disabled shortcuts', () => {
    const action = jest.fn();
    
    renderHook(() => 
      useKeyboardShortcuts([
        { key: 'ctrl+k', description: 'Search', action, enabled: false }
      ])
    );

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(action).not.toHaveBeenCalled();
  });

  it('handles space key', () => {
    const action = jest.fn();
    
    renderHook(() => 
      useKeyboardShortcuts([
        { key: 'space', description: 'Play/Pause', action }
      ])
    );

    const event = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(action).toHaveBeenCalledTimes(1);
  });

  it('handles escape key', () => {
    const action = jest.fn();
    
    renderHook(() => 
      useKeyboardShortcuts([
        { key: 'escape', description: 'Close', action }
      ])
    );

    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(action).toHaveBeenCalledTimes(1);
  });
});

describe('formatShortcut', () => {
  it('formats ctrl modifier', () => {
    const formatted = formatShortcut('ctrl+k');
    expect(formatted).toMatch(/ctrl|⌃/i);
    expect(formatted).toMatch(/k/i);
  });

  it('formats shift modifier', () => {
    const formatted = formatShortcut('shift+p');
    expect(formatted).toMatch(/shift|⇧/i);
    expect(formatted).toMatch(/p/i);
  });

  it('formats special keys', () => {
    expect(formatShortcut('space')).toMatch(/␣/);
    expect(formatShortcut('escape')).toMatch(/esc/i);
    expect(formatShortcut('enter')).toMatch(/↵/);
  });

  it('formats arrow keys', () => {
    expect(formatShortcut('arrowup')).toMatch(/↑/);
    expect(formatShortcut('arrowdown')).toMatch(/↓/);
    expect(formatShortcut('arrowleft')).toMatch(/←/);
    expect(formatShortcut('arrowright')).toMatch(/→/);
  });

  it('formats complex combinations', () => {
    const formatted = formatShortcut('ctrl+shift+p');
    expect(formatted).toMatch(/ctrl|⌃/i);
    expect(formatted).toMatch(/shift|⇧/i);
    expect(formatted).toMatch(/p/i);
  });
});
