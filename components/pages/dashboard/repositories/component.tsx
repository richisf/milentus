"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import RepositoriesAvatarComponent from "@/components/pages/dashboard/avatar/component";
import RepositorySettings from "@/components/pages/dashboard/repositories/repository/component";
import { CreateRepository } from "@/components/pages/dashboard/repositories/create/component";  

interface RepositoriesViewProps {
  repositories: Array<{
    _id: Id<"repository">;
    _creationTime: number;
    userId?: string;
    githubAccountId: Id<"githubAccount">;
    name: string;
    displayName: string;
    isDefault?: boolean;
    machine?: {
      _id: Id<"machine">;
      _creationTime: number;
      repositoryId: Id<"repository">;
      name: string;
      zone: string;
      state: string;
      ipAddress?: string;
      domain?: string;
      convexUrl?: string;
      convexProjectId?: number;
    };
    document?: {
      _id: Id<"document">;
      _creationTime: number;
      repositoryId: Id<"repository">;
      nodes: Array<{
        id: string;
        parentId: string;
        label: string;
        collapsed?: boolean;
      }>;
    };
  }> | undefined;
  onRepositorySelected: (repositoryId: Id<"repository">) => void;
  currentUser: { subject: string; issuer: string; tokenIdentifier?: string; email?: string; name?: string };
}

export default function RepositoriesView({ repositories, onRepositorySelected, currentUser }: RepositoriesViewProps) {
  const [isCreating, setIsCreating] = useState(false);

  const createDocument = useAction(api.githubAccount.repository.document.action.create.document);

  // Handler to select a repository and ensure it has a document
  const handleSelectRepository = async (repositoryId: Id<"repository">) => {
    const repository = repositories?.find(repo => repo._id === repositoryId);
    if (!repository) return;

    // If repository doesn't have a document, create one in the background
    if (!repository.document) {
      createDocument({ repositoryId }).then((result) => {
        if (result.success && result.documentId) {
          console.log("Document created:", result.documentId);
        } else {
          console.error("Failed to create document:", result.error);
        }
      }).catch((error) => {
        console.error("Error creating document:", error);
      });
    }

    // Set the selected repository (this will trigger the canvas view immediately)
    onRepositorySelected(repositoryId);
  };

  if (repositories === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">

      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Avatar component in top right */}
      <div className="absolute top-0 right-0 z-50">
        <RepositoriesAvatarComponent />
      </div>

      {/* Create repository section at top */}
      <div className="pt-20 pb-8">
        <div className="max-w-2xl mx-auto">

          {/* Create repository component */}
          <div className="mb-8">
            <CreateRepository
              currentUser={currentUser}
              isCreating={isCreating}
              setIsCreating={setIsCreating}
            />
          </div>
        </div>
      </div>

      {/* Repository grid - centered with margins */}
      <div className="flex justify-center">
        <div className="max-w-6xl w-full px-8">
          {/* Repository subtitle */}
          <div className="mb-6">
            <Label className="text-lg font-medium">Your Repositories</Label>
          </div>

          {repositories.length === 0 ? (
            <div className="">
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {repositories.map((repo) => (
                <Card
                  key={repo._id}
                  className="cursor-pointer flex flex-col items-center justify-center text-center min-h-[140px] relative group border-gray-300 bg-[#F7F8F4]"
                  onClick={() => handleSelectRepository(repo._id)}
                >
                  <CardContent className="p-6">
                    {/* Settings button */}
                    <div className="absolute top-3 right-3">
                      <RepositorySettings repository={repo} onRepositoryRemoved={() => {
                        window.location.reload();
                      }} />
                    </div>

                    <h3 className="text-lg font-medium">{repo.displayName}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}