import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SearchLoadingStateProps {
  isSearching: boolean;
  searchTerm: string;
  className?: string;
}

export default function SearchLoadingState({
  isSearching,
  searchTerm,
  className
}: SearchLoadingStateProps) {
  if (!isSearching) return null;

  return (
    <div className={cn('flex items-center justify-center py-8', className)}>
      <div className="flex items-center space-x-3 text-gray-500">
        <div className="relative">
          <MagnifyingGlassIcon className="h-6 w-6" />
          <div className="absolute inset-0 animate-pulse">
            <MagnifyingGlassIcon className="h-6 w-6 text-blue-500" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            "{searchTerm}" için aranıyor...
          </span>
          <span className="text-xs text-gray-400">
            Lütfen bekleyin
          </span>
        </div>
      </div>
    </div>
  );
}

// Inline search loading for input fields
export function InlineSearchLoading({ className }: { className?: string }) {
  return (
    <div className={cn('absolute inset-y-0 right-0 pr-3 flex items-center', className)}>
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600" />
    </div>
  );
}

// Search results loading skeleton
export function SearchResultsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="h-8 w-20 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}