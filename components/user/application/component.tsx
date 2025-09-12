"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { Create } from "@/components/user/application/action/create/component";
import { Remove } from "@/components/user/application/action/delete/component";  

export default function Application() {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  // No longer need to pass userId - backend gets current user automatically
  const applications = useQuery(api.application.query.by_user.applications);

  const handleSelectApplication = (applicationId: Id<"application">) => {
    router.push(`/user/${applicationId}`);
  };

  const handleApplicationRemoved = () => {
  };

  if (applications === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="relative">
        <div className="flex justify-center">
          <div className="max-w-4xl w-full px-8">

            {/* Create application section at top */}
            <div className="pt-20 pb-8">
              {/* Create application component */}
              <div className="mb-8">
                <Create
                  isCreating={isCreating}
                  setIsCreating={setIsCreating}
                />
              </div>
            </div>

            {/* Application grid - centered with margins */}
            {applications.length > 0 && (
              <div className="pb-8">
                {/* Application subtitle */}
                <div className="mb-6">
                  <Label className="text-lg font-medium">Your Applications</Label>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {applications.map((app) => (
                    <Card
                      key={app._id}
                      className="cursor-pointer flex flex-col items-center justify-center text-center min-h-[140px] relative group border-gray-300 bg-[#F7F8F4]"
                      onClick={() => handleSelectApplication(app._id)}
                    >
                      {/* Remove button in top-right corner */}
                      <div className="absolute top-2 right-2 z-10">
                        <Remove
                          applicationId={app._id}
                          applicationName={app.name}
                          onRemoveSuccess={handleApplicationRemoved}
                          compact={true}
                        />
                      </div>

                      <CardContent className="p-6">
                        <h3 className="text-lg font-medium">{app.name}</h3>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}