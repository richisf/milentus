"use client";

import { useConvexAuth } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');

    if (code?.includes('WhiteNode')) {
      router.replace(`/user?code=${encodeURIComponent(code)}`);
    } else if (isAuthenticated !== undefined) {
      router.replace('/user');
    }
  }, [isAuthenticated, router, searchParams]);

  return null;
}
