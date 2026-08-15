'use client';

import React, { useState, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function LoginContent() {
  const { fetchGoogleAuthUrl, loginWithCode, isLoggingIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const [devCodeInput, setDevCodeInput] = useState('');

  // Handle Google redirect code
  React.useEffect(() => {
    if (code) {
      const toastId = toast.loading('Authenticating via Google...');
      loginWithCode(code)
        .then(() => {
          toast.success('Signed in successfully!', { id: toastId });
          router.push('/dashboard');
        })
        .catch((err) => {
          toast.error(err.message || 'Google authentication failed', { id: toastId });
        });
    }
  }, [code, loginWithCode, router]);

  const handleGoogleLogin = async () => {
    try {
      const authUrl = await fetchGoogleAuthUrl();
      if (!authUrl) {
        throw new Error('Google authorization URL was not returned by server');
      }
      toast.loading('Redirecting to Google OAuth...');
      window.location.href = authUrl;
    } catch (err: any) {
      console.error('Google login initiation error:', err);
      const msg = err?.response?.data?.message || err?.message || 'Failed to initiate Google OAuth';
      toast.error(msg);
    }
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const testCode = devCodeInput.trim() || 'dev_user_admin';
    const toastId = toast.loading('Signing in via Dev mode...');
    try {
      await loginWithCode(testCode);
      toast.success('Dev session authenticated!', { id: toastId });
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Dev authentication failed', { id: toastId });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md mb-3">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
            Sign in to Learnio<span className="text-primary">X</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Enterprise multi-tenant learning & institution platform
          </p>
        </div>

        {/* OAuth Box */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center space-x-2 rounded-md border border-input bg-secondary hover:bg-accent px-4 py-2.5 text-xs font-semibold text-foreground transition-colors shadow-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoggingIn ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{isLoggingIn ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <span className="relative bg-card px-2 text-[11px] font-medium text-muted-foreground uppercase">
              Or Local Developer Bypass
            </span>
          </div>

          {/* Dev Login Form */}
          <form onSubmit={handleDevLogin} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Development Bypass Key / Username
              </label>
              <input
                type="text"
                value={devCodeInput}
                onChange={(e) => setDevCodeInput(e.target.value)}
                placeholder="dev_user_admin"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center space-x-1.5 rounded-md bg-primary hover:bg-primary/90 px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoggingIn ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <span>Authenticate Dev Mode</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          By signing in, you agree to our Terms of Service & Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center space-x-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Loading authentication...</span>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

