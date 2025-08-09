import React from 'react';
import { ExclamationTriangleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning';
  className?: string;
  onRetry?: () => void;
  showIcon?: boolean;
}

export default function ErrorMessage({
  title,
  message,
  type = 'error',
  className,
  onRetry,
  showIcon = true
}: ErrorMessageProps) {
  const Icon = type === 'error' ? XCircleIcon : ExclamationTriangleIcon;
  
  const baseClasses = 'rounded-md p-4';
  const typeClasses = {
    error: 'bg-red-50 border border-red-200',
    warning: 'bg-yellow-50 border border-yellow-200'
  };
  
  const iconClasses = {
    error: 'text-red-400',
    warning: 'text-yellow-400'
  };
  
  const textClasses = {
    error: 'text-red-800',
    warning: 'text-yellow-800'
  };

  return (
    <div className={cn(baseClasses, typeClasses[type], className)}>
      <div className="flex">
        {showIcon && (
          <div className="flex-shrink-0">
            <Icon className={cn('h-5 w-5', iconClasses[type])} />
          </div>
        )}
        <div className={cn('ml-3', !showIcon && 'ml-0')}>
          {title && (
            <h3 className={cn('text-sm font-medium', textClasses[type])}>
              {title}
            </h3>
          )}
          <div className={cn('text-sm', textClasses[type], title && 'mt-2')}>
            <p>{message}</p>
          </div>
          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className={cn(
                  'text-sm font-medium underline hover:no-underline',
                  textClasses[type]
                )}
              >
                Tekrar Dene
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline error for forms
export function InlineError({ message, className }: { message: string; className?: string }) {
  return (
    <p className={cn('text-sm text-red-600', className)}>
      {message}
    </p>
  );
}

// Page level error
export function PageError({ 
  title = 'Bir hata oluştu',
  message = 'Sayfa yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
  onRetry
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Tekrar Dene
          </button>
        )}
      </div>
    </div>
  );
}