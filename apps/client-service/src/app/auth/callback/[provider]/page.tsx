'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const { loginWithCode } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (error) {
      setErrorMessage(`Authentication failed: ${error}`);
      toast.error(`Authentication failed: ${error}`);
      return;
    }

    if (!code) {
      setErrorMessage('No authorization code found in callback URL.');
      return;
    }

    let isMounted = true;

    async function processCallback() {
      try {
        await loginWithCode(code as string);
        if (isMounted) {
          toast.success('Successfully authenticated!');
          router.replace('/dashboard');
        }
      } catch (err: any) {
        if (isMounted) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            'Failed to authenticate with server';
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

  if (errorMessage) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center p-6 text-center bg-background">
        <div className="w-full max-w-xs space-y-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-bold font-sans text-foreground">Authentication Error</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => router.replace('/login')}
            className="w-full rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background text-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        <p className="text-xs font-medium text-muted-foreground tracking-wide">
          Signing you in...
        </p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh flex-col items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-foreground" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
