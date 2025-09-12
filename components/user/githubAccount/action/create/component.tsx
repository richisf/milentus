"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GithubAccountCreateProps {
  code: string;
  state: string;
}

export function GithubAccountCreate({ code, state }: GithubAccountCreateProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processed, setProcessed] = useState(false);

  const creategithubAccount = useAction(api.githubAccount.action.create.githubAccount);

  useEffect(() => {
    if (processed) return;

    if (code && state) {
      setProcessed(true);
      setLoading(true);

      creategithubAccount({
        code,
      })
        .then((result) => {
          if (!result.success) throw new Error(result.error || 'Failed to connect GitHub account');

          // Clean URL and redirect immediately
          const url = new URL(window.location.href);
          ['code', 'state'].forEach(param => url.searchParams.delete(param));
          window.history.replaceState({}, '', url.toString());

          // Redirect to dashboard immediately
          router.push('/user');
        })
        .catch((err) => {
          console.error('OAuth error:', err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to connect GitHub account';

          // If authentication failed during OAuth callback, show login prompt
          if (errorMessage.includes('Authentication required') || errorMessage.includes('Not signed in')) {
            setError('Please log in first to connect your GitHub account');
            setLoading(false);
            return;
          }

          setError(errorMessage);
          setLoading(false);
        });
    }
  }, [code, state, router, creategithubAccount, processed]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Connecting your GitHub account...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="text-destructive mb-2 text-2xl">❌</div>
            <CardTitle>Connection Failed</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/github')} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return null;
}
