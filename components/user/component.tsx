"use client";

import { useState } from "react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Application from "@/components/user/application/component";
import { SignOut } from "@/components/user/session/delete/component";
import { SignIn } from "@/components/user/session/create/component";
import { SignUpForm } from "@/components/user/action/create/component";
import { WnAdmin } from "@/components/user/wnAdmin/component";
import { useIsMobile } from "@/components/hooks/isMobile";
import { api } from "@/convex/_generated/api";
import Image from "next/image";

export function User() {
  const isMobile = useIsMobile();
  const [showSignIn, setShowSignIn] = useState(true);

  // Get current user info
  const user = useQuery(api.auth.getMe);
  const isAdmin = user?.role === "whitenode-admin";

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
          {isMobile ? (
            <div className="p-4 flex items-center justify-center h-full">
              <Image
                src="/name.svg"
                alt="White Node Logo"
                width={2827}
                height={1040}
                className="h-32 w-auto object-contain"
              />
            </div>
          ) : (
            <>
              <Authenticated>
                <CardContent className="h-full overflow-y-auto">
                  <div className="flex justify-end mb-4">
                    <SignOut />
                  </div>
                  {isAdmin ? (
                    <div className="space-y-8">
                        <WnAdmin />
                    </div>
                  ) : (
                    <Application />
                  )}
                </CardContent>
              </Authenticated>
              <Unauthenticated>
                <div className="p-4 flex items-center justify-center h-full">
                  <div className="flex items-start gap-16">
                    <div className="h-64 flex items-start justify-center">
                      <Image
                        src="/name.svg"
                        alt="White Node Logo"
                        width={2827}
                        height={1040}
                        className="h-full w-auto object-contain"
                      />
                    </div>
                    <div className="h-64 flex flex-col items-center justify-center">
                      <div className="flex-1 w-full max-w-md">
                        {showSignIn ? <SignIn /> : <SignUpForm />}
                      </div>
                      <Button
                        onClick={() => setShowSignIn(!showSignIn)}
                        variant="link"
                        className="text-sm text-gray-600 hover:text-gray-800 underline underline-offset-2 cursor-pointer transition-colors mt-2 p-0 h-auto"
                      >
                        {showSignIn ? "Sign up" : "Sign in"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Unauthenticated>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
