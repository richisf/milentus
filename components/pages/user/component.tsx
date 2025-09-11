"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import ApplicationsView from "@/components/pages/user/applications/component";
import { SignOut } from "@/components/pages/user/mutations/signout/component";

export function User() {
  const currentUser = useQuery(api.auth.currentUser);
  const router = useRouter();

  const stableUserId = currentUser?.subject ? currentUser.subject.split('|')[0] : undefined;

  const applications = useQuery(api.application.query.by_user.applications, {
    userId: stableUserId,
  });

  useEffect(() => {
    if (currentUser === null) {
      router.push("/");
    }
  }, [currentUser, router]);

  // Show loading state while checking auth
  if (currentUser === undefined) {
    return (
      <div
      className="min-h-screen"
      style={{ backgroundColor: '#F7F8F4', padding: '12px' }}
    >
      <Card
        className="h-full"
        style={{
          height: 'calc(100vh - 32px)',
          overflow: 'hidden'
        }}
      >
      </Card>
    </div>
    );
  }

  if (currentUser === null) {
    return null;
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#F7F8F4', padding: '12px' }}
    >
      <Card
        className="h-full"
        style={{
          height: 'calc(100vh - 32px)',
          overflow: 'hidden'
        }}
      >
        <CardContent className="h-full overflow-y-auto">
          {/* Sign out button in top right */}
          <div className="flex justify-end mb-4">
            <SignOut />
          </div>

          <ApplicationsView
            applications={applications}
            stableUserId={stableUserId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
