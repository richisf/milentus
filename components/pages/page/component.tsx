"use client";

import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { SignInSection as SignIn } from "./signin/component";
import { useIsMobile } from "@/components/hooks/isMobile";

export function Page() {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/user");
    }
  }, [isAuthenticated, router]);

  // Show loading while redirecting authenticated users
  if (isAuthenticated) {
    return (
      <div className="flex flex-col">
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#F7F8F4', padding: '12px' }}
    >
      <div className=" flex justify-center">
        <Card
          className="h-full w-full max-w-none"
          style={{
            height: 'calc(100vh - 32px)',
            overflow: 'hidden'
          }}
        >
          <SignIn isMobile={isMobile} />
        </Card>
      </div>
    </div>
  );
}
