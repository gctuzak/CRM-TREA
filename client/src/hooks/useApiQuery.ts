import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from 'react-query';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

// Enhanced useQuery with error handling
export function useApiQuery<T>(
  key: string | string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'> & {
    showErrorToast?: boolean;
    errorMessage?: string;
  }
) {
  const { showErrorToast = true, errorMessage, ...queryOptions } = options || {};

  return useQuery<T, ApiError>(
    key,
    queryFn,
    {
      ...queryOptions,
      onError: (error) => {
        if (showErrorToast) {
          const message = errorMessage || error.message || 'Veri yüklenirken hata oluştu';
          showToast.error(message);
        }
        options?.onError?.(error);
      },
      retry: (failureCount, error) => {
        // Don't retry on client errors (4xx)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );
}

// Enhanced useMutation with error handling
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, ApiError, TVariables> & {
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string | ((data: TData) => string);
    errorMessage?: string | ((error: ApiError) => string);
    invalidateQueries?: string | string[];
  }
) {
  const queryClient = useQueryClient();
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage,
    errorMessage,
    invalidateQueries,
    ...mutationOptions
  } = options || {};

  return useMutation<TData, ApiError, TVariables>(
    mutationFn,
    {
      ...mutationOptions,
      onSuccess: (data, variables, context) => {
        if (showSuccessToast && successMessage) {
          const message = typeof successMessage === 'function' 
            ? successMessage(data) 
            : successMessage;
          showToast.success(message);
        }

        if (invalidateQueries) {
          if (Array.isArray(invalidateQueries)) {
            invalidateQueries.forEach(key => {
              queryClient.invalidateQueries(key);
            });
          } else {
            queryClient.invalidateQueries(invalidateQueries);
          }
        }

        options?.onSuccess?.(data, variables, context);
      },
      onError: (error, variables, context) => {
        if (showErrorToast) {
          const message = errorMessage 
            ? (typeof errorMessage === 'function' ? errorMessage(error) : errorMessage)
            : error.message || 'İşlem sırasında hata oluştu';
          showToast.error(message);
        }

        options?.onError?.(error, variables, context);
      },
    }
  );
}

// Specific hooks for common operations
export function useCreateMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Parameters<typeof useApiMutation<TData, TVariables>>[1] & {
    resourceName?: string;
  }
) {
  const { resourceName = 'Kayıt', ...restOptions } = options || {};
  
  return useApiMutation(mutationFn, {
    showSuccessToast: true,
    successMessage: `${resourceName} başarıyla oluşturuldu`,
    ...restOptions,
  });
}

export function useUpdateMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Parameters<typeof useApiMutation<TData, TVariables>>[1] & {
    resourceName?: string;
  }
) {
  const { resourceName = 'Kayıt', ...restOptions } = options || {};
  
  return useApiMutation(mutationFn, {
    showSuccessToast: true,
    successMessage: `${resourceName} başarıyla güncellendi`,
    ...restOptions,
  });
}

export function useDeleteMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Parameters<typeof useApiMutation<TData, TVariables>>[1] & {
    resourceName?: string;
  }
) {
  const { resourceName = 'Kayıt', ...restOptions } = options || {};
  
  return useApiMutation(mutationFn, {
    showSuccessToast: true,
    successMessage: `${resourceName} başarıyla silindi`,
    ...restOptions,
  });
}

// Pagination hook
export function usePaginatedQuery<T>(
  baseKey: string,
  queryFn: (page: number, limit: number, search?: string) => Promise<{
    data: T[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>,
  options?: {
    initialPage?: number;
    limit?: number;
    search?: string;
    enabled?: boolean;
  }
) {
  const { initialPage = 1, limit = 20, search = '', enabled = true } = options || {};

  return useApiQuery(
    [baseKey, initialPage, limit, search],
    () => queryFn(initialPage, limit, search),
    {
      enabled,
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export default useApiQuery;