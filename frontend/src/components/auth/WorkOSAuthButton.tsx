// ============================================================
// EduMyles — WorkOS Authentication Button Component
// ============================================================

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useWorkOSAuth } from '@/hooks/useWorkOSAuth';
import { Icons } from '@/components/ui/icons';

interface WorkOSAuthButtonProps {
  provider?: string;
  mode?: 'signin' | 'signup';
  redirectTo?: string;
  className?: string;
  children?: React.ReactNode;
}

export function WorkOSAuthButton({
  provider = 'Google',
  mode = 'signin',
  redirectTo,
  className,
  children,
}: WorkOSAuthButtonProps) {
  const { signIn, signUp, isLoading } = useWorkOSAuth({ redirectTo });

  const handleClick = async () => {
    if (mode === 'signup') {
      await signUp(provider, redirectTo);
    } else {
      await signIn(provider, redirectTo);
    }
  };

  const getProviderIcon = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case 'google':
        return <Icons.google className="h-4 w-4" />;
      case 'microsoft':
        return <Icons.microsoft className="h-4 w-4" />;
      case 'github':
        return <Icons.gitHub className="h-4 w-4" />;
      case 'slack':
        return <Icons.slack className="h-4 w-4" />;
      default:
        return <Icons.user className="h-4 w-4" />;
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      variant="outline"
    >
      {getProviderIcon(provider)}
      {children || (
        <span>
          {mode === 'signup' ? 'Sign up' : 'Continue'} with {provider}
        </span>
      )}
    </Button>
  );
}

interface WorkOSMagicLinkFormProps {
  redirectTo?: string;
  onSuccess?: () => void;
}

export function WorkOSMagicLinkForm({ redirectTo, onSuccess }: WorkOSMagicLinkFormProps) {
  const [email, setEmail] = React.useState('');
  const { sendMagicLink, isLoading } = useWorkOSAuth({ redirectTo });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await sendMagicLink(email, redirectTo);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Sending...' : 'Send Magic Link'}
      </Button>
    </form>
  );
}

interface WorkOSAuthCardProps {
  title: string;
  description?: string;
  redirectTo?: string;
  showMagicLink?: boolean;
  additionalContent?: React.ReactNode;
}

export function WorkOSAuthCard({
  title,
  description,
  redirectTo,
  showMagicLink = true,
  additionalContent,
}: WorkOSAuthCardProps) {
  const [showMagicForm, setShowMagicForm] = React.useState(false);

  if (showMagicForm) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Magic Link Sign In</CardTitle>
          <CardDescription>
            Enter your email to receive a sign-in link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkOSMagicLinkForm
            redirectTo={redirectTo}
            onSuccess={() => setShowMagicForm(false)}
          />
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setShowMagicForm(false)}
              className="text-sm"
            >
              ← Back to sign-in options
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <WorkOSAuthButton
            provider="Google"
            mode="signin"
            redirectTo={redirectTo}
            className="w-full"
          />
          <WorkOSAuthButton
            provider="Microsoft"
            mode="signin"
            redirectTo={redirectTo}
            className="w-full"
          />
          <WorkOSAuthButton
            provider="GitHub"
            mode="signin"
            redirectTo={redirectTo}
            className="w-full"
          />
        </div>

        {showMagicLink && (
          <>
            <div className="relative">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-background px-2 text-xs text-muted-foreground">
                  OR
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() => setShowMagicForm(true)}
              className="w-full"
            >
              Sign in with Email Magic Link
            </Button>
          </>
        )}

        {additionalContent}
      </CardContent>
    </Card>
  );
}

interface WorkOSAuthProviderButtonsProps {
  mode?: 'signin' | 'signup';
  redirectTo?: string;
  providers?: string[];
  className?: string;
}

export function WorkOSAuthProviderButtons({
  mode = 'signin',
  redirectTo,
  providers = ['Google', 'Microsoft', 'GitHub'],
  className,
}: WorkOSAuthProviderButtonsProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {providers.map((provider) => (
        <WorkOSAuthButton
          key={provider}
          provider={provider}
          mode={mode}
          redirectTo={redirectTo}
          className="w-full"
        >
          {mode === 'signup' ? 'Sign up' : 'Continue'} with {provider}
        </WorkOSAuthButton>
      ))}
    </div>
  );
}
