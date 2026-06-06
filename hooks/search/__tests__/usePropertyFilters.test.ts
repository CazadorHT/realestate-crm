import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePropertyFilters } from '../usePropertyFilters';

// Robust Mock for next/navigation
const mockSearchParams = new URLSearchParams();
const mockRouter = {
  replace: vi.fn(),
  push: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => mockSearchParams),
  useRouter: vi.fn(() => mockRouter),
}));

describe('usePropertyFilters Debouncing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear URL search params
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, '', url.toString());
  });

  it('should debounce the keyword changes', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePropertyFilters());

    // Initially keyword and debouncedKeyword should be empty
    expect(result.current.keyword).toBe('');
    expect(result.current.debouncedKeyword).toBe('');

    // Update keyword
    act(() => {
      result.current.setKeyword('luxury condo');
    });

    // Immediate check: keyword is updated
    expect(result.current.keyword).toBe('luxury condo');
    // But debouncedKeyword is NOT yet
    expect(result.current.debouncedKeyword).toBe('');

    // Fast forward 200ms (halfway)
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.debouncedKeyword).toBe('');

    // Fast forward to 400ms total
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.debouncedKeyword).toBe('luxury condo');

    vi.useRealTimers();
  });

  it('should reset debouncedKeyword when keyword is cleared', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => usePropertyFilters());

    // Set keyword and wait for debounce
    act(() => {
      result.current.setKeyword('search');
    });
    
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current.debouncedKeyword).toBe('search');

    // Clear keyword
    act(() => {
      result.current.setKeyword('');
    });
    
    // Immediate: keyword is cleared
    expect(result.current.keyword).toBe('');
    
    // Wait for debounce
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current.debouncedKeyword).toBe('');
    
    vi.useRealTimers();
  });
});
