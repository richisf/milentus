"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import RepositoriesAvatarComponent from "@/components/pages/dashboard/avatar/component";
import { CreateApplication } from "@/components/pages/dashboard/applications/create/component";  

interface ApplicationsViewProps {
  applications: Array<{
    _id: Id<"application">;
    _creationTime: number;
    userId?: string;
    name: string;
    machine: {
      _id: Id<"machine">;
      _creationTime: number;
      applicationId: Id<"application">;
      name: string;
      zone: string;
      state: string;
      ipAddress?: string;
      domain?: string;
      convexUrl?: string;
      convexProjectId?: number;
    } | null;
    repository: {
      _id: Id<"repository">;
      _creationTime: number;
      applicationId: Id<"application">;
      githubAccountId: Id<"githubAccount">;
      name: string;
      accessToken?: string;
      githubUsername?: string;
    } | null;
    document: {
      _id: Id<"document">;
      _creationTime: number;
      applicationId: Id<"application">;
      nodes: Array<{
        id: string;
        parentId: string;
        label: string;
        collapsed?: boolean;
        fileId?: Id<"files">;
      }>;
    } | null;
  }> | undefined;
  onApplicationSelected: (applicationId: Id<"application">) => void;
  currentUser: { subject: string; issuer: string; tokenIdentifier?: string; email?: string; name?: string };
}

export default function ApplicationsView({ applications, onApplicationSelected, currentUser }: ApplicationsViewProps) {
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectApplication = (applicationId: Id<"application">) => {
    onApplicationSelected(applicationId);
  };

  if (applications === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        Loading applications...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Avatar component in top right */}
      <div className="absolute top-0 right-0 z-50">
        <RepositoriesAvatarComponent />
      </div>

      {/* Create application section at top */}
      <div className="pt-20 pb-8">
        <div className="max-w-2xl mx-auto">

          {/* Create application component */}
          <div className="mb-8">
            <CreateApplication
              currentUser={currentUser}
              isCreating={isCreating}
              setIsCreating={setIsCreating}
            />
          </div>
        </div>
      </div>

      {/* Application grid - centered with margins */}
      <div className="flex justify-center">
        <div className="max-w-6xl w-full px-8">
          {/* Application subtitle */}
          <div className="mb-6">
            <Label className="text-lg font-medium">Your Applications</Label>
          </div>

          {applications.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No applications found. Create your first application above.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {applications.map((app) => (
                <Card
                  key={app._id}
                  className="cursor-pointer flex flex-col items-center justify-center text-center min-h-[140px] relative group border-gray-300 bg-[#F7F8F4]"
                  onClick={() => handleSelectApplication(app._id)}
                >
                  <CardContent className="p-6">
                    <h3 className="text-lg font-medium">{app.name}</h3>
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