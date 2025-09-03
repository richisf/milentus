"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateResult {
  success: boolean;
  repositoryId?: string;
  error?: string;
  instructions?: string;
  repositoryUrl?: string;
}

export function DefaultRepositoryCreator() {
  const [isCreating, setIsCreating] = useState(false);
  const [createResult, setCreateResult] = useState<CreateResult | null>(null);

  const createRepository = useAction(api.githubAccount.repository.action.create.repository);

  const handleCreateDefaultRepository = async () => {
    setIsCreating(true);
    setCreateResult(null);

    try {
      const result = await createRepository({});
      setCreateResult(result);
    } catch (error) {
      setCreateResult({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create repository"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <Button
        onClick={handleCreateDefaultRepository}
        disabled={isCreating}
        className="w-full"
        size="lg"
      >
        {isCreating ? "Creating Repository..." : "Create Default Repository"}
      </Button>

      {createResult && (
        <Alert variant={createResult.success ? "default" : "destructive"} className="max-w-md text-center w-full">
          <AlertDescription>
            {createResult.success ? (
              <div>
                <p className="font-medium">Repository created successfully!</p>
                <p className="text-sm mt-1">Repository ID: {createResult.repositoryId}</p>
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
                <p className="font-medium">Failed to create repository</p>
                <p className="text-sm mt-1">{createResult.error}</p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
