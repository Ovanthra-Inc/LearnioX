'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { BookOpen, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const provider = params?.provider || 'google';

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const { loginWithCode } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (error) {
      setStatus('error');
      setErrorMessage(`Authentication was declined or failed: ${error}`);
      toast.error(`Authentication failed: ${error}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMessage('No authorization code was found in callback URL.');
      return;
    }

    let isMounted = true;

    async function processCallback() {
      try {
        await loginWithCode(code as string);
        if (isMounted) {
          setStatus('success');
          toast.success('Successfully authenticated!');
          setTimeout(() => {
            router.push('/dashboard');
          }, 800);
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus('error');
          const msg = err?.message || 'Failed to exchange authorization code with server';
          setErrorMessage(msg);
          toast.error(msg);
        }
      }
    }

    processCallback();

    return () => {
      isMounted = false;
    };
  }, [code, error, loginWithCode, router]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="w-full max-w-sm space-y-6 text-center">
        {/* Brand */}
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md mb-3">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
            Learnio<span className="text-primary">X</span> Auth
          </h2>
          <p className="text-xs text-muted-foreground mt-1 capitalize">
            Verifying {String(provider)} authentication...
          </p>
        </div>

        {/* Status Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">Exchanging Credentials</p>
                <p className="text-[11px] text-muted-foreground">
                  Securing your session with API Gateway...
                </p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-8 w-8 text-emerald-500 animate-bounce" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">Authentication Verified</p>
                <p className="text-[11px] text-muted-foreground">
                  Redirecting to your dashboard...
                </p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-destructive">Authentication Error</p>
                <p className="text-[11px] text-muted-foreground max-w-xs">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/auth/login')}
                className="mt-2 w-full rounded-md bg-primary hover:bg-primary/90 px-3 py-2 text-xs font-medium text-primary-foreground transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center space-x-2 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Processing authentication callback...</span>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
