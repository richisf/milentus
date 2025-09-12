"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import Document from "./document/component";

interface ApplicationProps {
  id: string;
}

export function Application({ id }: ApplicationProps) {
  const router = useRouter();

  // Convert string ID to proper Convex ID type
  const applicationId = id as Id<"application">;

  // Fetch application data
  const application = useQuery(api.application.query.by_id.by_id, {
    applicationId,
  });

  // Fetch current user for authentication
  const currentUser = useQuery(api.auth.currentUser);

  useEffect(() => {
    if (currentUser === null) {
      router.push("/");
    }
  }, [currentUser, router]);

  // Show loading state
  if (currentUser === undefined || application === undefined) {
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

  if (!application) {
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
          <CardContent className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Application not found</h2>
              <p className="text-gray-600">The application you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
          {application.document ? (
            <Document
              documentData={{
                _id: application.document._id,
                _creationTime: application.document._creationTime,
                applicationId: application._id,
                nodes: application.document.nodes
              }}
              conversationId={application.document?.conversation?._id}
              onBack={() => router.push('/user')}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">No Document Found</h2>
                <p className="text-gray-600">This application doesn&apos;t have a document yet.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
