import { renderHook, act, waitFor } from '@testing-library/react';
import { ApiError } from '@/lib/api';
import useSearchWithErrorHandling from '@/hooks/useSearchWithErrorHandling';

// Mock the toast utility
jest.mock('@/lib/toast', () => ({
  showToast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

describe('useSearchWithErrorHandling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should handle successful search', async () => {
    const mockSearchFn = jest.fn().mockResolvedValue({ data: 'test' });
    const onSuccess = jest.fn();

    const { result } = renderHook(() =>
      useSearchWithErrorHandling(mockSearchFn, { onSuccess })
    );

    act(() => {
      result.current.search('test query');
    });

    expect(result.current.isSearching).toBe(false); // Not searching yet due to debounce

    // Fast-forward debounce time
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.isSearching).toBe(true);

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(mockSearchFn).toHaveBeenCalledWith('test query', expect.any(AbortSignal));
    expect(onSuccess).toHaveBeenCalledWith({ data: 'test' });
    expect(result.current.error).toBeNull();
  });

  it('should handle network errors with retry', async () => {
    const networkError = new ApiError('Network error', 0);
    const mockSearchFn = jest
      .fn()
      .mockRejectedValueOnce(networkError)
      .mockResolvedValue({ data: 'success' });

    const { result } = renderHook(() =>
      useSearchWithErrorHandling(mockSearchFn, { retryAttempts: 2, retryDelay: 1000 })
    );

    act(() => {
      result.current.search('test');
    });

    // Fast-forward debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.isSearching).toBe(true);
    });

    // Fast-forward retry delay
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    expect(mockSearchFn).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  it('should handle timeout errors', async () => {
    const mockSearchFn = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 15000))
    );

    const { result } = renderHook(() =>
      useSearchWithErrorHandling(mockSearchFn, { timeoutMs: 5000 })
    );

    act(() => {
      result.current.search('test');
    });

    // Fast-forward debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.isSearching).toBe(true);

    // Fast-forward timeout
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(ApiError);
      expect(result.current.error?.status).toBe(408);
    });
  });

  it('should handle client errors without retry', async () => {
    const clientError = new ApiError('Bad request', 400);
    const mockSearchFn = jest.fn().mockRejectedValue(clientError);

    const { result } = renderHook(() =>
      useSearchWithErrorHandling(mockSearchFn, { retryAttempts: 2 })
    );

    act(() => {
      result.current.search('test');
    });

    // Fast-forward debounce
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.error).toBe(clientError);
    });

    expect(mockSearchFn).toHaveBeenCalledTimes(1); // No retry for client errors
  });

  it('should cancel previous requests', async () => {
    const mockSearchFn = jest.fn().mockImplementation(
      (query, signal) => new Promise((resolve, reject) => {
        signal?.addEventListener('abort', () => reject(new Error('Aborted')));
        setTimeout(() => resolve({ data: query }), 1000);
      })
    );

    const { result } = renderHook(() =>
      useSearchWithErrorHandling(mockSearchFn)
    );

    // Start first search
    act(() => {
      result.current.search('first');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Start second search before first completes
    act(() => {
      result.current.search('second');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Fast-forward to complete second search
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(result.current.isSearching).toBe(false);
    });

    // Should have been called twice but only second should complete
    expect(mockSearchFn).toHaveBeenCalledTimes(2);
    expect(result.current.lastSearchTerm).toBe('second');
  });

  it('should clear search when empty term provided', () => {
    const mockSearchFn = jest.fn();

    const { result } = renderHook(() =>
      useSearchWithErrorHandling(mockSearchFn)
    );

    act(() => {
      result.current.search('');
    });

    expect(result.current.isSearching).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastSearchTerm).toBe('');
    expect(mockSearchFn).not.toHaveBeenCalled();
  });

  it('should allow manual retry', async () => {
    const error = new ApiError('Server error', 500);
    const mockSearchFn = jest
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValue({ data: 'success' });

    const { result } = renderHook(() =>
      useSearchWithErrorHandling(mockSearchFn, { retryAttempts: 0 })
    );

    // Initial search that fails
    act(() => {
      result.current.search('test');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.error).toBe(error);
    });

    // Manual retry
    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });

    expect(mockSearchFn).toHaveBeenCalledTimes(2);
  });

  it('should clear error state', () => {
    const mockSearchFn = jest.fn();

    const { result } = renderHook(() =>
      useSearchWithErrorHandling(mockSearchFn)
    );

    // Set error state manually for testing
    act(() => {
      (result.current as any).setSearchState({
        isSearching: false,
        error: new ApiError('Test error', 500),
        lastSearchTerm: 'test',
        retryCount: 0
      });
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should cancel all operations', () => {
    const mockSearchFn = jest.fn();

    const { result } = renderHook(() =>
      useSearchWithErrorHandling(mockSearchFn)
    );

    act(() => {
      result.current.search('test');
    });

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isSearching).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastSearchTerm).toBe('');
  });
});