"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GithubAccountCreate } from "./action/create/component";

export function Github() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorMessage = searchParams.get('error_message');

  // Handle OAuth callback
  if (code && state) {
    return <GithubAccountCreate code={code} state={state} />;
  }

  // Handle OAuth errors from provider
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" style={{ backgroundColor: '#F7F8F4' }}>
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="text-destructive mb-2 text-2xl">❌</div>
            <CardTitle>OAuth Error</CardTitle>
            <CardDescription>{errorMessage || error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/user/githubAccount'} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initiateGithubOAuth = () => {
    setLoading(true);

    const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const clientId = 'Ov23li8Gt88cHjYDTWlT';
    const callbackUrl = `${window.location.origin}/user/githubAccount`;
    const scope = "user,repo,delete_repo";

    const url = `https://github.com/login/oauth/authorize?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${encodeURIComponent(state)}`;

    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" style={{ backgroundColor: '#F7F8F4' }}>
      <Card className="w-full max-w-md bg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Connect GitHub</CardTitle>
          <CardDescription>
            Connect your GitHub account to link your repositories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <Button
            onClick={initiateGithubOAuth}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Connect GitHub Account
              </>
            )}
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => router.push('/user')}
              className="text-sm"
            >
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
