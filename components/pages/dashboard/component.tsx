"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import RepositoriesView from "@/components/pages/dashboard/repositories/component";
import CanvasComponent from "@/components/pages/dashboard/repositories/canvas/component";

export function Dashboard() { 
  const currentUser = useQuery(api.auth.currentUser);
  const router = useRouter();
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<Id<"repository"> | null>(null);

  // Get repositories (this already includes document data via the by_user query)
  // Extract the first part of the subject (before the first pipe) to match database format
  const userId = currentUser?.subject?.split('|')[0];
  const repositories = useQuery(api.githubAccount.repository.query.by_user.repositories, {
    userId: userId || undefined,
    fallbackToDefault: false,
  });

  // Redirect to main page if not authenticated
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

  // Find the selected repository to get its document data
  const selectedRepository = selectedRepositoryId
    ? repositories?.find(repo => repo._id === selectedRepositoryId)
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
          {selectedRepositoryId && selectedRepository ? (
            <CanvasComponent
              repositoryId={selectedRepositoryId}
              documentData={selectedRepository.document}
              onBack={() => setSelectedRepositoryId(null)}
              onDocumentCreated={(documentId) => {
                console.log("Document created:", documentId);
                // Force a refresh of the repositories data to get the new document
                window.location.reload();
              }}
            />
                  ) : (
          <RepositoriesView
            repositories={repositories}
            onSelectRepository={setSelectedRepositoryId}
            currentUser={currentUser}
          />
        )}
        </CardContent>
      </Card>
    </div>
  );
}
