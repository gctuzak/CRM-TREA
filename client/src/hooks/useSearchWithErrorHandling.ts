import { useState, useCallback, useRef, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

interface UseSearchOptions {
  debounceMs?: number;
  retryAttempts?: number;
  retryDelay?: number;
  timeoutMs?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error | ApiError) => void;
  showToastOnError?: boolean;
}

interface SearchState {
  isSearching: boolean;
  error: Error | ApiError | null;
  lastSearchTerm: string;
  retryCount: number;
}

export function useSearchWithErrorHandling<T>(
  searchFn: (searchTerm: string, signal?: AbortSignal) => Promise<T>,
  options: UseSearchOptions = {}
) {
  const {
    debounceMs = 300,
    retryAttempts = 2,
    retryDelay = 1000,
    timeoutMs = 10000,
    onSuccess,
    onError,
    showToastOnError = false
  } = options;

  const [searchState, setSearchState] = useState<SearchState>({
    isSearching: false,
    error: null,
    lastSearchTerm: '',
    retryCount: 0
  });

  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup function
  const cleanup = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const performSearch = useCallback(async (
    searchTerm: string, 
    isRetry: boolean = false
  ): Promise<T | null> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Update state
    setSearchState(prev => ({
      ...prev,
      isSearching: true,
      error: null,
      lastSearchTerm: searchTerm,
      retryCount: isRetry ? prev.retryCount + 1 : 0
    }));

    try {
      // Add timeout wrapper
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new ApiError('Search timeout', 408));
        }, timeoutMs);
      });

      const searchPromise = searchFn(searchTerm, signal);
      const result = await Promise.race([searchPromise, timeoutPromise]);

      // Check if request was aborted
      if (signal.aborted) {
        return null;
      }

      // Success
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        error: null,
        retryCount: 0
      }));

      onSuccess?.(result);
      return result;

    } catch (error) {
      // Check if request was aborted
      if (signal.aborted) {
        return null;
      }

      const apiError = error instanceof ApiError ? error : new ApiError(
        error instanceof Error ? error.message : 'Search failed',
        0
      );

      // Determine if we should retry
      const shouldRetry = 
        !isRetry && 
        searchState.retryCount < retryAttempts &&
        (apiError.status === 0 || apiError.status >= 500 || apiError.status === 408);

      if (shouldRetry) {
        // Schedule retry
        retryTimeoutRef.current = setTimeout(() => {
          performSearch(searchTerm, true);
        }, retryDelay * (searchState.retryCount + 1));

        // Update state to show retry is pending
        setSearchState(prev => ({
          ...prev,
          isSearching: true,
          error: null
        }));

        return null;
      }

      // Final error state
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        error: apiError
      }));

      // Show toast if enabled
      if (showToastOnError) {
        const errorMessage = getErrorMessage(apiError);
        showToast.error(errorMessage);
      }

      onError?.(apiError);
      return null;
    }
  }, [searchFn, retryAttempts, retryDelay, timeoutMs, onSuccess, onError, showToastOnError, searchState.retryCount]);

  const search = useCallback((searchTerm: string) => {
    // Clear previous debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Clear previous retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // If search term is empty, clear state immediately
    if (!searchTerm.trim()) {
      cleanup();
      setSearchState({
        isSearching: false,
        error: null,
        lastSearchTerm: '',
        retryCount: 0
      });
      return;
    }

    // Debounce the search
    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(searchTerm);
    }, debounceMs);
  }, [debounceMs, performSearch, cleanup]);

  const retry = useCallback(() => {
    if (searchState.lastSearchTerm) {
      performSearch(searchState.lastSearchTerm, true);
    }
  }, [searchState.lastSearchTerm, performSearch]);

  const clearError = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  const cancel = useCallback(() => {
    cleanup();
    setSearchState({
      isSearching: false,
      error: null,
      lastSearchTerm: '',
      retryCount: 0
    });
  }, [cleanup]);

  return {
    search,
    retry,
    clearError,
    cancel,
    isSearching: searchState.isSearching,
    error: searchState.error,
    lastSearchTerm: searchState.lastSearchTerm,
    retryCount: searchState.retryCount,
    canRetry: searchState.retryCount < retryAttempts
  };
}

// Helper function to get user-friendly error messages
function getErrorMessage(error: ApiError): string {
  switch (error.status) {
    case 0:
      return 'İnternet bağlantınızı kontrol edin';
    case 408:
      return 'Arama zaman aşımına uğradı';
    case 429:
      return 'Çok hızlı arama yapıyorsunuz, lütfen bekleyin';
    case 500:
    case 502:
    case 503:
      return 'Sunucu hatası, lütfen daha sonra deneyin';
    default:
      return error.message || 'Arama sırasında hata oluştu';
  }
}

export default useSearchWithErrorHandling;