"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Default } from "@/components/pages/github/callback/default/component";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function Callback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processed, setProcessed] = useState(false);

  const currentUser = useQuery(api.auth.currentUser);
  const creategithubAccount = useAction(api.githubAccount.action.create.githubAccount);

  useEffect(() => {
    if (processed) return;

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    // Handle OAuth errors
    if (errorParam) {
      setError(searchParams.get('error_message') || errorParam);
      setProcessed(true);
      return;
    }

    // Handle OAuth callback
    if (code && state && currentUser !== undefined) {
      setProcessed(true);
      setLoading(true);

      // Pass userId only if authenticated, otherwise create default account
      const userId = currentUser ? (currentUser.subject as Id<"users">) : undefined;

      creategithubAccount({
        userId,
        code,
      })
        .then((result) => {
          if (!result.success) throw new Error(result.error || 'Failed to connect GitHub account');

          setSuccess('GitHub account successfully connected!');
          setLoading(false);

          // Clean URL
          const url = new URL(window.location.href);
          ['code', 'state'].forEach(param => url.searchParams.delete(param));
          window.history.replaceState({}, '', url.toString());
        })
        .catch((err) => {
          console.error('OAuth error:', err);
          setError(err instanceof Error ? err.message : 'Failed to connect GitHub account');
          setLoading(false);
        });
    }
  }, [searchParams, router, creategithubAccount, currentUser, processed]);

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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-green-500 mb-2 text-2xl">✅</div>
            <CardTitle>GitHub Connected!</CardTitle>
            <CardDescription>{success}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!currentUser && <Default />}

            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
