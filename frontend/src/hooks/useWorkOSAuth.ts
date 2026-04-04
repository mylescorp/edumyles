// ============================================================
// EduMyles — WorkOS Authentication Hook
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export interface UseWorkOSAuthOptions {
  redirectTo?: string;
  onError?: (error: Error) => void;
  onSuccess?: (user: WorkOSUser) => void;
}

export interface WorkOSUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
}

export interface WorkOSAuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: WorkOSUser | null;
  error: Error | null;
}

/**
 * Hook for WorkOS authentication operations
 */
export function useWorkOSAuth(options: UseWorkOSAuthOptions = {}) {
  const [state, setState] = useState<WorkOSAuthState>({
    isLoading: false,
    isAuthenticated: false,
    user: null,
    error: null,
  });

  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Initiate WorkOS authentication with specified provider
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
      const authUrl = response.url;
      window.location.href = authUrl;
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
   * Send magic link authentication
   */
  const sendMagicLink = useCallback(async (email: string, returnTo?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/auth/login/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          returnTo: returnTo || options.redirectTo || '/platform',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send magic link');
      }

      const result = await response.json();
      
      setState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: 'Magic Link Sent',
        description: `Check your email at ${email} for the sign-in link.`,
      });

      return result;
    } catch (error) {
      const err = error as Error;
      setState(prev => ({ ...prev, isLoading: false, error: err }));
      options.onError?.(err);
      toast({
        title: 'Magic Link Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
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
      });

      router.push('/auth/login');
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
   * Check authentication status on mount and handle callback
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
        }));
        return;
      }

      if (code) {
        // The callback route will handle the authentication
        // and set cookies. We just need to redirect.
        const returnTo = searchParams.get('returnTo') || options.redirectTo || '/platform';
        router.push(returnTo);
        return;
      }

      // Check existing authentication status
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const user = await response.json();
          setState({
            isLoading: false,
            isAuthenticated: true,
            user,
            error: null,
          });
          options.onSuccess?.(user);
        } else {
          setState({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            error: null,
          });
        }
      } catch (error) {
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: null,
        });
      }
    };

    handleCallback();
  }, [searchParams, router, options]);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    sendMagicLink,
  };
}

/**
 * Hook to get current authenticated user
 */
export function useWorkOSUser() {
  const [user, setUser] = useState<WorkOSUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  return { user, isLoading, refetch: fetchUser };
}
