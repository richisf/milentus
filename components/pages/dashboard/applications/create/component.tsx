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
  applicationId?: Id<"application">,
  machineId?: string,
  machineName?: string,
  machineZone?: string,
  error?: string,
  repositoryUrl?: string,
  instructions?: string
};

interface CreateApplicationProps {
  currentUser: { subject: string; issuer: string; tokenIdentifier?: string; email?: string; name?: string } | null;
  isCreating: boolean;
  setIsCreating: (creating: boolean) => void;
}

export function CreateApplication({ currentUser, isCreating, setIsCreating }: CreateApplicationProps) {
  const createApplication = useAction(api.githubAccount.application.action.create.create);

  const [appName, setAppName] = useState("");
  const [result, setResult] = useState<CreateResult | null>(null);

  const handleCreateNamedApplication = async () => {
    if (!appName.trim()) {
      setResult({ success: false, error: "Please enter an application name" });
      return;
    }

    if (!currentUser?.subject) {
      setResult({ success: false, error: "Please sign in again." });
      return;
    }

    setIsCreating(true);
    setResult(null);

    try {
      const response = await createApplication({
        name: appName.trim(),
        userId: currentUser.subject
      });

      setResult(response);
      if (response.success) {
        setAppName("");
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create application"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Application Name */}
      <div>
        <Label className="text-lg font-medium">Create Application</Label>
      </div>

      {/* Input and Button Row */}
      <div className="flex gap-2 w-full items-end">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Enter application name"
            className="placeholder:text-gray-400 placeholder:text-sm"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            disabled={isCreating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isCreating && appName.trim()) {
                handleCreateNamedApplication();
              }
            }}
          />
        </div>

        <Button
          onClick={handleCreateNamedApplication}
          disabled={isCreating || !appName.trim()}
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
