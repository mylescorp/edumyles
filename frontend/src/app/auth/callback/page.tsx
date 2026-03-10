"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { workos, initializeWorkOS } from "@/lib/workos";
import { rbac } from "@/lib/rbac";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Authenticating...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage('Authentication failed');
          setError(errorDescription || error);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received');
          setError('Missing authorization code');
          return;
        }

        // Initialize WorkOS
        initializeWorkOS({
          clientId: process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID!,
          apiKey: process.env.NEXT_PUBLIC_WORKOS_API_KEY!,
          redirectUri: `${window.location.origin}/auth/callback`,
          environment: process.env.NODE_ENV as 'production' | 'development',
        });

        // Exchange code for tokens
        const response = await workos.exchangeCodeForTokens(code);
        
        // Cache user in RBAC system
        rbac.cacheUser(response.user);

        // Set session cookies
        document.cookie = `edumyles_session=${response.session.accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
        document.cookie = `edumyles_role=${response.user.role}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
        document.cookie = `edumyles_permissions=${response.user.permissions.join(',')}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
        document.cookie = `edumyles_user_id=${response.user.id}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
        document.cookie = `edumyles_user_email=${response.user.email}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;

        setStatus('success');
        setMessage('Authentication successful!');

        // Redirect to intended destination
        const returnUrl = sessionStorage.getItem('workos_return_url') || '/platform';
        sessionStorage.removeItem('workos_return_url');
        
        setTimeout(() => {
          router.push(returnUrl);
        }, 1500);

      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage('Authentication failed');
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  const handleRetry = () => {
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Authentication'}
            {status === 'success' && 'Success'}
            {status === 'error' && 'Authentication Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            {status === 'loading' && (
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-8 w-8 text-green-600" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          
          <div className="text-center">
            <p className="text-gray-600">{message}</p>
            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </div>

          {status === 'error' && (
            <div className="flex justify-center">
              <Button onClick={handleRetry} variant="outline">
                Try Again
              </Button>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Redirecting you to your dashboard...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
