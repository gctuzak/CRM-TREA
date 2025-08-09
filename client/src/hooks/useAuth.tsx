import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';
import { authApi, isAuthenticated } from '@/lib/api';
import type { User, LoginCredentials, ChangePasswordData } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  changePassword: (passwordData: ChangePasswordData) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is admin
  const isAdmin = user?.ROLE === 'admin';
  
  // Check if user is manager or admin
  const isManager = user?.ROLE === 'manager' || user?.ROLE === 'admin';

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // TEMPORARILY DISABLED FOR TESTING - Clear any existing tokens
      // and set mock user directly
      
      // Clear any existing tokens first
      const { clearAuthToken } = await import('@/lib/api');
      clearAuthToken();
      
      const mockUser = {
        ID: 1,
        NAME: 'Test User',
        EMAIL: 'test@example.com',
        ROLE: 'admin',
        DEPARTMENT_ID: 1,
        STATUS: 'active',
        CREATED_DATE: new Date().toISOString(),
        UPDATED_DATE: new Date().toISOString()
      };
      
      setUser(mockUser);
      
      /* ORIGINAL CODE - COMMENTED OUT
      if (isAuthenticated()) {
        const response = await authApi.getProfile();
        setUser(response.user);
      }
      */
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      // Clear invalid token
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    // TEMPORARILY DISABLED FOR TESTING
    // Login kontrolü geçici olarak devre dışı bırakıldı
    try {
      setLoading(true);
      
      // Mock user data for testing
      const mockUser = {
        ID: 1,
        NAME: 'Test User',
        EMAIL: 'test@example.com',
        ROLE: 'admin',
        DEPARTMENT_ID: 1,
        STATUS: 'active',
        CREATED_DATE: new Date().toISOString(),
        UPDATED_DATE: new Date().toISOString()
      };
      
      setUser(mockUser);
      toast.success('Login başarılı! (Test modu)');
      
      // Redirect to dashboard or intended page
      const redirectTo = router.query.redirect as string || '/dashboard';
      router.push(redirectTo);
    } catch (error: any) {
      console.error('Login failed:', error);
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
    
    /* ORIGINAL CODE - COMMENTED OUT
    try {
      setLoading(true);
      const response = await authApi.login(credentials);
      setUser(response.user);
      toast.success('Login successful!');
      
      // Redirect to dashboard or intended page
      const redirectTo = router.query.redirect as string || '/dashboard';
      router.push(redirectTo);
    } catch (error: any) {
      console.error('Login failed:', error);
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
    */
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // Redirect to dashboard instead of login since authentication is disabled
      router.push('/dashboard');
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      const response = await authApi.updateProfile(userData);
      setUser(response.user);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Update profile failed:', error);
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      throw error;
    }
  };

  const changePassword = async (passwordData: ChangePasswordData) => {
    try {
      await authApi.changePassword(passwordData);
      toast.success('Password changed successfully!');
    } catch (error: any) {
      console.error('Change password failed:', error);
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      if (isAuthenticated()) {
        const response = await authApi.getProfile();
        setUser(response.user);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
    isAdmin,
    isManager,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protecting routes
// TEMPORARILY DISABLED FOR TESTING
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    // Route protection temporarily disabled
    return <Component {...props} />;
    
    /* ORIGINAL CODE - COMMENTED OUT
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      }
    }, [user, loading, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="spinner-lg"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <Component {...props} />;
    */
  };
}

// Higher-order component for admin-only routes
// TEMPORARILY DISABLED FOR TESTING
export function withAdminAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AdminAuthenticatedComponent(props: P) {
    // Admin route protection temporarily disabled
    return <Component {...props} />;
    
    /* ORIGINAL CODE - COMMENTED OUT
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
        } else if (!isAdmin) {
          router.push('/dashboard');
          toast.error('Access denied. Admin privileges required.');
        }
      }
    }, [user, loading, isAdmin, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="spinner-lg"></div>
        </div>
      );
    }

    if (!user || !isAdmin) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Higher-order component for manager/admin routes
// TEMPORARILY DISABLED FOR TESTING
export function withManagerAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ManagerAuthenticatedComponent(props: P) {
    // Manager route protection temporarily disabled
    return <Component {...props} />;
    
    /* ORIGINAL CODE - COMMENTED OUT
    const { user, loading, isManager } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
        } else if (!isManager) {
          router.push('/dashboard');
          toast.error('Access denied. Manager privileges required.');
        }
      }
    }, [user, loading, isManager, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="spinner-lg"></div>
        </div>
      );
    }

    if (!user || !isManager) {
      return null;
    }

    return <Component {...props} />;
    */
  };
}