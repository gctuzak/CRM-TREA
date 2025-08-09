import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // TEMPORARILY DISABLED FOR TESTING - Always redirect to dashboard
    // Authentication check bypassed
    if (!loading) {
      router.replace('/dashboard');
    }
    
    /* ORIGINAL CODE - COMMENTED OUT
    if (!loading) {
      if (user) {
        // User is authenticated, redirect to dashboard
        router.replace('/dashboard');
      } else {
        // User is not authenticated, redirect to login
        router.replace('/login');
      }
    }
    */
  }, [loading, router]);

  // Show loading spinner while checking authentication
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-lg bg-primary-600 mb-4">
          <span className="text-xl font-bold text-white">CRM</span>
        </div>
        <div className="spinner-large" />
        <p className="mt-4 text-gray-600">Yükleniyor...</p>
      </div>
    </div>
  );
}