/**
 * Player.test.tsx - Tests for playback features
 * Tests repeat modes, shuffle, error recovery, and gapless transitions
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { RepeatMode, useQueueStore } from './queueStore';

// Reset queue store before each test
beforeEach(() => {
  // Clear localStorage
  localStorage.clear();
  
  // Reset the store state
  const { clearQueue, setRepeatMode } = useQueueStore.getState();
  clearQueue();
  setRepeatMode(RepeatMode.OFF);
});

describe('QueueStore Repeat Mode', () => {
  test('default repeat mode is OFF', () => {
    const { repeatMode } = useQueueStore.getState();
    expect(repeatMode).toBe(RepeatMode.OFF);
  });

  test('setRepeatMode changes the repeat mode', () => {
    const { setRepeatMode } = useQueueStore.getState();
    
    setRepeatMode(RepeatMode.ALL);
    expect(useQueueStore.getState().repeatMode).toBe(RepeatMode.ALL);
    
    setRepeatMode(RepeatMode.ONE);
    expect(useQueueStore.getState().repeatMode).toBe(RepeatMode.ONE);
    
    setRepeatMode(RepeatMode.OFF);
    expect(useQueueStore.getState().repeatMode).toBe(RepeatMode.OFF);
  });

  test('repeat mode persists to localStorage', () => {
    const { setRepeatMode } = useQueueStore.getState();
    
    setRepeatMode(RepeatMode.ALL);
    
    // Check localStorage
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    expect(settings.repeatMode).toBe(RepeatMode.ALL);
  });
});

describe('QueueStore Shuffle Mode', () => {
  const mockSongs = [
    { id: '1', title: 'Song 1', artist: { id: 'a1', name: 'Artist' } as any, album: { id: 'al1', name: 'Album' } as any, durationMs: 180000 },
    { id: '2', title: 'Song 2', artist: { id: 'a1', name: 'Artist' } as any, album: { id: 'al1', name: 'Album' } as any, durationMs: 200000 },
    { id: '3', title: 'Song 3', artist: { id: 'a1', name: 'Artist' } as any, album: { id: 'al1', name: 'Album' } as any, durationMs: 220000 },
    { id: '4', title: 'Song 4', artist: { id: 'a1', name: 'Artist' } as any, album: { id: 'al1', name: 'Album' } as any, durationMs: 240000 },
  ];

  test('default shuffle is disabled', () => {
    const { shuffleEnabled } = useQueueStore.getState();
    expect(shuffleEnabled).toBe(false);
  });

  test('toggleShuffle enables shuffle and keeps current song at position 0', () => {
    const { playNow, setCurrent, toggleShuffle } = useQueueStore.getState();
    
    // Setup queue with songs and set current to index 2
    playNow(mockSongs);
    setCurrent(2);
    
    // Get the current song before shuffle
    const currentSongId = useQueueStore.getState().queue[2].id;
    
    // Toggle shuffle on
    toggleShuffle();
    
    const state = useQueueStore.getState();
    expect(state.shuffleEnabled).toBe(true);
    expect(state.current).toBe(0); // Current should be at index 0
    expect(state.queue[0].id).toBe(currentSongId); // Current song should be at position 0
    expect(state.originalOrder).not.toBeNull();
    expect(state.originalOrder?.length).toBe(mockSongs.length);
  });

  test('toggleShuffle off restores original order', () => {
    const { playNow, setCurrent, toggleShuffle } = useQueueStore.getState();
    
    // Setup queue
    playNow(mockSongs);
    setCurrent(1);
    
    const originalIds = mockSongs.map(s => s.id);
    
    // Shuffle on then off
    toggleShuffle(); // On
    toggleShuffle(); // Off
    
    const state = useQueueStore.getState();
    expect(state.shuffleEnabled).toBe(false);
    expect(state.originalOrder).toBeNull();
    
    // Verify original order is restored
    const restoredIds = state.queue.map(s => s.id);
    expect(restoredIds).toEqual(originalIds);
  });

  test('shuffle persists to localStorage', () => {
    const { playNow, toggleShuffle } = useQueueStore.getState();
    
    playNow(mockSongs);
    toggleShuffle();
    
    // Check localStorage
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    expect(settings.shuffleEnabled).toBe(true);
  });
});

describe('QueueStore playNow resets shuffle', () => {
  const mockSongs = [
    { id: '1', title: 'Song 1', artist: { id: 'a1', name: 'Artist' } as any, album: { id: 'al1', name: 'Album' } as any, durationMs: 180000 },
    { id: '2', title: 'Song 2', artist: { id: 'a1', name: 'Artist' } as any, album: { id: 'al1', name: 'Album' } as any, durationMs: 200000 },
  ];

  test('playNow clears shuffle state', () => {
    const { playNow, toggleShuffle } = useQueueStore.getState();
    
    // Setup and shuffle
    playNow(mockSongs);
    toggleShuffle();
    
    expect(useQueueStore.getState().shuffleEnabled).toBe(true);
    
    // Play new songs
    playNow([mockSongs[0]]);
    
    const state = useQueueStore.getState();
    expect(state.shuffleEnabled).toBe(false);
    expect(state.originalOrder).toBeNull();
  });
});

describe('RepeatMode enum values', () => {
  test('RepeatMode has correct values', () => {
    expect(RepeatMode.OFF).toBe('off');
    expect(RepeatMode.ALL).toBe('all');
    expect(RepeatMode.ONE).toBe('one');
  });
});

describe('QueueStore Play Next (addToQueueNext)', () => {
  const mockSongs = [
    { id: '1', title: 'Song 1', artist: { id: 'a1', name: 'Artist' } as any, album: { id: 'al1', name: 'Album' } as any, durationMs: 180000 },
    { id: '2', title: 'Song 2', artist: { id: 'a1', name: 'Artist' } as any, album: { id: 'al1', name: 'Album' } as any, durationMs: 200000 },
    { id: '3', title: 'Song 3', artist: { id: 'a1', name: 'Artist' } as any, album: { id: 'al1', name: 'Album' } as any, durationMs: 220000 },
  ];

  test('addToQueueNext inserts song after current position', () => {
    const { playNow, setCurrent, addToQueueNext } = useQueueStore.getState();
    
    // Setup queue with 3 songs and set current to index 1
    playNow(mockSongs);
    setCurrent(1);
    
    const newSong = { id: '4', title: 'New Song', artist: { id: 'a1', name: 'Artist' } as any, album: { id: 'al1', name: 'Album' } as any, durationMs: 240000 };
    addToQueueNext(newSong);
    
    const state = useQueueStore.getState();
    expect(state.queue.length).toBe(4);
    expect(state.queue[2].id).toBe('4'); // Inserted at index 2 (after current index 1)
    expect(state.current).toBe(1); // Current unchanged
  });

  test('addToQueueNext with empty queue adds at position 1', () => {
    const { clearQueue, addToQueueNext } = useQueueStore.getState();
    
    clearQueue();
    
    const newSong = { id: '1', title: 'First Song', artist: { id: 'a1', name: 'Artist' } as any, album: { id: 'al1', name: 'Album' } as any, durationMs: 180000 };
    addToQueueNext(newSong);
    
    const state = useQueueStore.getState();
    expect(state.queue.length).toBe(1);
    expect(state.queue[0].id).toBe('1');
  });
});

describe('QueueStore Undo', () => {
  const mockSongs = [
    { id: '1', title: 'Song 1', artist: { id: 'a1', name: 'Artist' } as any, album: { id: 'al1', name: 'Album' } as any, durationMs: 180000 },
    { id: '2', title: 'Song 2', artist: { id: 'a1', name: 'Artist' } as any, album: { id: 'al1', name: 'Album' } as any, durationMs: 200000 },
    { id: '3', title: 'Song 3', artist: { id: 'a1', name: 'Artist' } as any, album: { id: 'al1', name: 'Album' } as any, durationMs: 220000 },
  ];

  test('undo remove restores song at correct position', () => {
    const { playNow, removeFromQueue, undo } = useQueueStore.getState();
    
    playNow(mockSongs);
    
    // Remove song at index 1
    removeFromQueue(1);
    expect(useQueueStore.getState().queue.length).toBe(2);
    expect(useQueueStore.getState().queue.map(s => s.id)).toEqual(['1', '3']);
    
    // Undo
    const success = undo();
    expect(success).toBe(true);
    
    const state = useQueueStore.getState();
    expect(state.queue.length).toBe(3);
    expect(state.queue.map(s => s.id)).toEqual(['1', '2', '3']);
    expect(state.lastAction).toBeNull();
  });

  test('undo clear restores entire queue', () => {
    const { playNow, setCurrent, clearQueue, undo } = useQueueStore.getState();
    
    playNow(mockSongs);
    setCurrent(2);
    
    clearQueue();
    expect(useQueueStore.getState().queue.length).toBe(0);
    
    // Undo
    const success = undo();
    expect(success).toBe(true);
    
    const state = useQueueStore.getState();
    expect(state.queue.length).toBe(3);
    expect(state.queue.map(s => s.id)).toEqual(['1', '2', '3']);
    expect(state.lastAction).toBeNull();
  });

  test('undo returns false when no action to undo', () => {
    const { playNow, undo } = useQueueStore.getState();
    
    playNow(mockSongs);
    
    // No action performed, lastAction is null
    const success = undo();
    expect(success).toBe(false);
  });
});
