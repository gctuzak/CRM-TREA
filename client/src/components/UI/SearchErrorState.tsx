import React from 'react';
import { 
  ExclamationTriangleIcon, 
  WifiIcon,
  ClockIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/api';

interface SearchErrorStateProps {
  error: Error | ApiError | null;
  searchTerm?: string;
  onRetry?: () => void;
  onClearSearch?: () => void;
  className?: string;
}

export default function SearchErrorState({
  error,
  searchTerm,
  onRetry,
  onClearSearch,
  className
}: SearchErrorStateProps) {
  if (!error) return null;

  const getErrorInfo = () => {
    if (error instanceof ApiError) {
      switch (error.status) {
        case 0:
          return {
            icon: WifiIcon,
            title: 'Bağlantı Hatası',
            message: 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
            type: 'network' as const
          };
        case 408:
          return {
            icon: ClockIcon,
            title: 'Zaman Aşımı',
            message: 'Arama işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.',
            type: 'timeout' as const
          };
        case 429:
          return {
            icon: ExclamationTriangleIcon,
            title: 'Çok Fazla İstek',
            message: 'Çok hızlı arama yapıyorsunuz. Lütfen biraz bekleyin.',
            type: 'rate-limit' as const
          };
        case 500:
        case 502:
        case 503:
          return {
            icon: ExclamationTriangleIcon,
            title: 'Sunucu Hatası',
            message: 'Sunucuda bir sorun oluştu. Lütfen daha sonra tekrar deneyin.',
            type: 'server' as const
          };
        default:
          return {
            icon: ExclamationTriangleIcon,
            title: 'Arama Hatası',
            message: error.message || 'Arama sırasında bir hata oluştu.',
            type: 'general' as const
          };
      }
    }

    // Network or other errors
    if (error.message.includes('fetch') || error.message.includes('Network')) {
      return {
        icon: WifiIcon,
        title: 'Bağlantı Hatası',
        message: 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
        type: 'network' as const
      };
    }

    return {
      icon: ExclamationTriangleIcon,
      title: 'Arama Hatası',
      message: error.message || 'Arama sırasında beklenmeyen bir hata oluştu.',
      type: 'general' as const
    };
  };

  const { icon: Icon, title, message, type } = getErrorInfo();

  const getBackgroundColor = () => {
    switch (type) {
      case 'network':
        return 'bg-blue-50 border-blue-200';
      case 'timeout':
        return 'bg-yellow-50 border-yellow-200';
      case 'rate-limit':
        return 'bg-orange-50 border-orange-200';
      case 'server':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'network':
        return 'text-blue-500';
      case 'timeout':
        return 'text-yellow-500';
      case 'rate-limit':
        return 'text-orange-500';
      case 'server':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={cn('rounded-lg border p-6', getBackgroundColor(), className)}>
      <div className="flex items-center justify-center">
        <div className="text-center">
          <Icon className={cn('mx-auto h-12 w-12 mb-4', getIconColor())} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4 max-w-md">{message}</p>
          
          {searchTerm && (
            <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
              <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
              <span>Arama terimi: "{searchTerm}"</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Tekrar Dene
              </button>
            )}
            
            {onClearSearch && searchTerm && (
              <button
                onClick={onClearSearch}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Aramayı Temizle
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact error for inline display
export function InlineSearchError({ 
  error, 
  onRetry,
  className 
}: { 
  error: Error | ApiError;
  onRetry?: () => void;
  className?: string;
}) {
  const isNetworkError = error instanceof ApiError && error.status === 0;
  const isTimeoutError = error instanceof ApiError && error.status === 408;

  return (
    <div className={cn('flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-md', className)}>
      <div className="flex items-center">
        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
        <span className="text-sm text-red-700">
          {isNetworkError 
            ? 'Bağlantı hatası' 
            : isTimeoutError 
            ? 'Zaman aşımı' 
            : 'Arama hatası'}
        </span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Tekrar dene
        </button>
      )}
    </div>
  );
}