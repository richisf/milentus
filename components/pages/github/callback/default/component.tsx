"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateResult {
  success: boolean;
  applicationId?: string;
  error?: string;
  instructions?: string;
  repositoryUrl?: string;
}

export function DefaultApplicationCreator() {
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<CreateResult | null>(null);

  const createApplication = useAction(api.githubAccount.application.action.create.create);

  const handleCreateDefaultApplication = async () => {
    setIsCreating(true);
    setCreateResult(null);

    try {
      const result = await createApplication({
        name: "whitenode-template",
        userId: undefined // This will create a default application
      });
      setCreateResult(result);
    } catch (error) {
      setCreateResult({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create application"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <Button
        onClick={handleCreateDefaultApplication}
        disabled={isCreating}
        className="w-full"
        size="lg"
      >
        {isCreating ? "Creating Application..." : "Create Default Application"}
      </Button>

      {createResult && (
        <Alert variant={createResult.success ? "default" : "destructive"} className="max-w-md text-center w-full">
          <AlertDescription>
            {createResult.success ? (
              <div>
                <p className="font-medium">Application created successfully!</p>
                <p className="text-sm mt-1">Application ID: {createResult.applicationId}</p>
                {createResult.instructions && (
                  <div className="mt-3 p-3 bg-muted rounded text-sm">
                    <p className="font-medium mb-2">📝 Instructions:</p>
                    <pre className="text-xs whitespace-pre-wrap">{createResult.instructions}</pre>
                  </div>
                )}
                {createResult.repositoryUrl && (
                  <p className="text-xs mt-2">
                    <a href={createResult.repositoryUrl} target="_blank" rel="noopener noreferrer" className="underline">
                      View Repository on GitHub →
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="font-medium">Failed to create application</p>
                <p className="text-sm mt-1">{createResult.error}</p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
