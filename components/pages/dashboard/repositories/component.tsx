"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import RepositoriesAvatarComponent from "../avatar/component";
import RepositorySettings from "./repository/component";
import { CreateRepository } from "./create/component";

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
  onSelectRepository: (repositoryId: Id<"repository">) => void;
  currentUser: { subject: string; issuer: string; tokenIdentifier?: string; email?: string; name?: string };
}

export default function RepositoriesView({ repositories, onSelectRepository, currentUser }: RepositoriesViewProps) {
  const [isCreating, setIsCreating] = useState(false);

  if (repositories === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading repositories...</p>
          </CardContent>
        </Card>
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
          <h2 className="text-2xl font-bold mb-6 text-center">Your Repositories</h2>

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
          {repositories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No repositories found. Create your first repository above!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {repositories.map((repo) => (
                <Card
                  key={repo._id}
                  className="cursor-pointer flex flex-col items-center justify-center text-center min-h-[140px] relative group border-gray-300 bg-[#F7F8F4]"
                  onClick={() => onSelectRepository(repo._id)}
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