"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import ApplicationsView from "@/components/pages/dashboard/applications/component";
import Document from "@/components/pages/dashboard/applications/application/document/component";

export function Dashboard() {
  const currentUser = useQuery(api.auth.currentUser);
  const router = useRouter();
  const [selectedApplicationId, setSelectedApplicationId] = useState<Id<"application"> | null>(null);

  const stableUserId = currentUser?.subject ? currentUser.subject.split('|')[0] : undefined;

  const applications = useQuery(api.githubAccount.application.query.by_user.applications, {
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

  // Find the selected application to get its document data
  const selectedApplication = selectedApplicationId
    ? applications?.find(app => app._id === selectedApplicationId)
    : null;

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
          {selectedApplicationId && selectedApplication && selectedApplication.document ? (
            <Document
              documentData={{
                _id: selectedApplication.document._id,
                _creationTime: selectedApplication.document._creationTime,
                applicationId: selectedApplication._id,
                nodes: selectedApplication.document.nodes
              }}
              onBack={() => setSelectedApplicationId(null)}
            />
          ) : (
            <ApplicationsView
              applications={applications}
              onApplicationSelected={setSelectedApplicationId}
              stableUserId={stableUserId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
