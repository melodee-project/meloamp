/**
 * Search.test.tsx - Tests for search functionality
 * Tests recent searches and filter toggling
 */

export {};

// Test recent searches localStorage helper
describe('Recent Searches', () => {
  const RECENT_SEARCHES_KEY = 'meloamp_recent_searches';
  const MAX_RECENT_SEARCHES = 10;

  beforeEach(() => {
    localStorage.clear();
  });

  const getRecentSearches = (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const addRecentSearch = (query: string) => {
    if (!query.trim()) return;
    const searches = getRecentSearches();
    const filtered = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  test('getRecentSearches returns empty array when no searches', () => {
    expect(getRecentSearches()).toEqual([]);
  });

  test('addRecentSearch adds a search to the list', () => {
    addRecentSearch('test query');
    expect(getRecentSearches()).toEqual(['test query']);
  });

  test('addRecentSearch adds to front of list', () => {
    addRecentSearch('first');
    addRecentSearch('second');
    addRecentSearch('third');
    expect(getRecentSearches()).toEqual(['third', 'second', 'first']);
  });

  test('addRecentSearch removes duplicates (case insensitive)', () => {
    addRecentSearch('Test');
    addRecentSearch('other');
    addRecentSearch('TEST'); // Same as 'Test', different case
    
    const searches = getRecentSearches();
    expect(searches).toEqual(['TEST', 'other']);
    expect(searches.length).toBe(2);
  });

  test('addRecentSearch caps at MAX_RECENT_SEARCHES', () => {
    for (let i = 0; i < 15; i++) {
      addRecentSearch(`query ${i}`);
    }
    
    const searches = getRecentSearches();
    expect(searches.length).toBe(MAX_RECENT_SEARCHES);
    expect(searches[0]).toBe('query 14'); // Most recent
  });

  test('addRecentSearch ignores empty strings', () => {
    addRecentSearch('');
    addRecentSearch('   ');
    expect(getRecentSearches()).toEqual([]);
  });

  test('clearRecentSearches removes all searches', () => {
    addRecentSearch('test1');
    addRecentSearch('test2');
    expect(getRecentSearches().length).toBe(2);
    
    clearRecentSearches();
    expect(getRecentSearches()).toEqual([]);
  });

  test('getRecentSearches handles corrupted localStorage gracefully', () => {
    localStorage.setItem(RECENT_SEARCHES_KEY, 'not valid json');
    expect(getRecentSearches()).toEqual([]);
  });
});

describe('Search Filters', () => {
  type FilterType = 'artists' | 'albums' | 'songs' | 'playlists';

  test('default filters include all types', () => {
    const defaultFilters: FilterType[] = ['artists', 'albums', 'songs', 'playlists'];
    expect(defaultFilters).toContain('artists');
    expect(defaultFilters).toContain('albums');
    expect(defaultFilters).toContain('songs');
    expect(defaultFilters).toContain('playlists');
  });

  test('toggling filter adds/removes from active filters', () => {
    let activeFilters: FilterType[] = ['artists', 'albums', 'songs', 'playlists'];
    
    const toggleFilter = (filter: FilterType) => {
      activeFilters = activeFilters.includes(filter)
        ? activeFilters.filter(f => f !== filter)
        : [...activeFilters, filter];
    };
    
    // Remove 'songs'
    toggleFilter('songs');
    expect(activeFilters).not.toContain('songs');
    expect(activeFilters).toContain('artists');
    
    // Add 'songs' back
    toggleFilter('songs');
    expect(activeFilters).toContain('songs');
  });
});
