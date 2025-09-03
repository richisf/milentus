"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type CreateResult = {
  success: boolean,
  repositoryId?: Id<"repository">,
  machineId?: string,
  machineName?: string,
  machineZone?: string,
  error?: string,
  repositoryUrl?: string,
  instructions?: string
};

interface CreateRepositoryProps {
  currentUser: { subject: string; issuer: string; tokenIdentifier?: string; email?: string; name?: string } | null;
  isCreating: boolean;
  setIsCreating: (creating: boolean) => void;
}

export function CreateRepository({ currentUser, isCreating, setIsCreating }: CreateRepositoryProps) {
  const createRepository = useAction(api.githubAccount.repository.action.create.repository);

  const [repoName, setRepoName] = useState("");
  const [result, setResult] = useState<CreateResult | null>(null);

  const handleCreateNamedRepository = async () => {
    if (!repoName.trim()) {
      setResult({ success: false, error: "Please enter a repository name" });
      return;
    }

    if (!currentUser?.subject) {
      setResult({ success: false, error: "Please sign in again." });
      return;
    }

    setIsCreating(true);
    setResult(null);

    try {
      const response = await createRepository({
        name: repoName.trim(),
        userId: currentUser.subject,
        createMachine: true
      });

      setResult(response);
      if (response.success) {
        setRepoName("");
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create repository"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Repository Name */}
      <div>
        <Label className="text-lg font-medium">Create Repository</Label>
      </div>

      {/* Input and Button Row */}
      <div className="flex gap-2 w-full items-end">
        <div className="flex-1">
          <Input
            type="text"
            placeholder=""
            className="placeholder:text-gray-400 placeholder:text-sm"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            disabled={isCreating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isCreating && repoName.trim()) {
                handleCreateNamedRepository();
              }
            }}
          />
        </div>

        <Button
          onClick={handleCreateNamedRepository}
          disabled={isCreating || !repoName.trim()}
          variant="secondary"
          className="whitespace-nowrap bg-[#F7F8F4] hover:bg-[#E8E2D1] text-gray-800 border-gray-300"
        >
          {isCreating ? "Creating..." : "Create"}
        </Button>
      </div>

      {result?.error && (
        <Alert variant="destructive">
          <AlertDescription className="text-sm">
            ❌ {result.error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
