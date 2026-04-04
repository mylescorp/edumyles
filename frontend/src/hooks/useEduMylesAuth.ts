// ============================================================
// EduMyles — Enhanced Auth Hook (WorkOS + Convex Integration)
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSessionFromCookie } from '@/lib/auth';
import { toast } from '@/components/ui/use-toast';

export interface EduMylesUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  tenantId: string;
  isAuthenticated: boolean;
  profilePictureUrl?: string;
}

export interface EduMylesAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: EduMylesUser | null;
  error: Error | null;
  session: any | null;
}

export interface UseEduMylesAuthOptions {
  redirectTo?: string;
  onError?: (error: Error) => void;
  onSuccess?: (user: EduMylesUser) => void;
}

/**
 * Enhanced authentication hook that integrates WorkOS with Convex
 */
export function useEduMylesAuth(options: UseEduMylesAuthOptions = {}) {
  const [state, setState] = useState<EduMylesAuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    error: null,
    session: null,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  /**
   * Check authentication status with Convex
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      const sessionToken = getSessionFromCookie();
      
      if (!sessionToken) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
          user: null,
          session: null,
        }));
        return null;
      }

      const response = await fetch('/api/auth/me', {
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (!response.ok) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isAuthenticated: false,
          user: null,
          session: null,
        }));
        return null;
      }

      const user = await response.json();

      const userData: EduMylesUser = {
        id: user?.id || '',
        email: user?.email || '',
        firstName: user?.firstName,
        lastName: user?.lastName,
        role: user?.role || '',
        tenantId: user?.tenantId || '',
        isAuthenticated: true,
        profilePictureUrl: user?.profilePictureUrl,
      };

      setState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: true,
        user: userData,
        session: {
          sessionToken,
          role: userData.role,
          tenantId: userData.tenantId,
        },
      }));

      options.onSuccess?.(userData);
      return userData;
    } catch (error) {
      const err = error as Error;
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err,
        isAuthenticated: false,
        user: null,
        session: null,
      }));
      options.onError?.(err);
      return null;
    }
  }, [options]);

  /**
   * Initiate WorkOS authentication
   */
  const signIn = useCallback(async (provider: string = 'Google', returnTo?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams();
      params.set('provider', provider);
      params.set('returnTo', returnTo || options.redirectTo || '/platform');

      const response = await fetch(`/auth/login/api?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to initiate authentication');
      }

      // The API will handle the redirect to WorkOS
      window.location.href = response.url;
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, isLoading: false, error: err }));
      options.onError?.(err);
      toast({
        title: 'Authentication Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [options]);

  /**
   * Sign up with WorkOS
   */
  const signUp = useCallback(async (provider: string = 'Google', returnTo?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams();
      params.set('provider', provider);
      params.set('returnTo', returnTo || options.redirectTo || '/platform');
      params.set('mode', 'sign-up');

      const response = await fetch(`/auth/login/api?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to initiate sign up');
      }

      window.location.href = response.url;
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, isLoading: false, error: err }));
      options.onError?.(err);
      toast({
        title: 'Sign Up Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [options]);

  /**
   * Sign out current user
   */
  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await fetch('/auth/logout', { method: 'POST' });
      
      setState({
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null,
        session: null,
      });

      router.push('/auth');
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, isLoading: false, error: err }));
      toast({
        title: 'Sign Out Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [router]);

  /**
   * Refresh user data
   */
  const refreshUser = useCallback(async () => {
    await checkAuthStatus();
  }, [checkAuthStatus]);

  /**
   * Handle authentication callback
   */
  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setState(prev => ({
          ...prev,
          error: new Error(error),
          isAuthenticated: false,
          isLoading: false,
        }));
        return;
      }

      if (code) {
        // The callback route will handle the authentication
        // and set cookies. We just need to check auth status after a short delay.
        setTimeout(() => {
          checkAuthStatus();
        }, 1000);
        return;
      }

      // Normal authentication check
      await checkAuthStatus();
    };

    handleCallback();
  }, [searchParams, checkAuthStatus]);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    refreshUser,
    checkAuthStatus,
  };
}

/**
 * Hook to get current user with Convex integration
 */
export function useEduMylesUser() {
  const { user, isLoading, isAuthenticated, error } = useEduMylesAuth();
  return { user, isLoading, isAuthenticated, error };
}

/**
 * Hook to check if user has specific role
 */
export function useUserRole(requiredRole?: string) {
  const { user, isLoading, isAuthenticated } = useEduMylesAuth();

  const hasRole = useCallback((role: string) => {
    if (!user || !isAuthenticated) return false;
    return user.role === role || user.role === 'master_admin' || user.role === 'super_admin';
  }, [user, isAuthenticated]);

  const hasRequiredRole = requiredRole ? hasRole(requiredRole) : isAuthenticated;

  return {
    user,
    isLoading,
    isAuthenticated,
    hasRole,
    hasRequiredRole,
  };
}

/**
 * Hook for tenant-specific operations
 */
export function useTenantContext() {
  const { user, isAuthenticated, isLoading } = useEduMylesAuth();

  return {
    tenantId: user?.tenantId,
    isAuthenticated,
    isLoading,
    isPlatformAdmin: user?.role === 'master_admin' || user?.role === 'super_admin',
    user,
  };
}
