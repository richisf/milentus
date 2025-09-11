"use client";

import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { SignUpForm } from "./form/component";

export function SignUp() {
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

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
      <div className="flex justify-center">
        <Card
          className="h-full w-full max-w-none"
          style={{
            height: 'calc(100vh - 32px)',
            overflow: 'hidden'
          }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="flex items-start gap-28">
              <div className="h-56 flex items-start justify-center">
                <Image
                  src="/name.svg"
                  alt="White Node Logo"
                  width={2827}
                  height={1040}
                  className="h-full w-auto object-contain"
                />
              </div>
              <div className="h-56 max-w-md flex flex-col justify-between">
                <SignUpForm />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
