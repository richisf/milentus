"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { Card, CardContent } from "@/components/ui/card";
import Application from "@/components/user/application/component";
import { SignOut } from "@/components/user/session/delete/component";
import { SignIn } from "@/components/user/session/create/component";
import { useIsMobile } from "@/components/hooks/isMobile";
import Image from "next/image";

export function User() {

  const isMobile = useIsMobile();

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
            <div className="flex items-center justify-center h-full">
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
                  <Application />
                </CardContent>
              </Authenticated>
              <Unauthenticated>
                <SignIn />
              </Unauthenticated>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
