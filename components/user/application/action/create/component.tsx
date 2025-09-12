"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
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
  isCreating: boolean;
  setIsCreating: (creating: boolean) => void;
}

export function Create({ isCreating, setIsCreating }: CreateApplicationProps) {

  const createApplication = useAction(api.application.action.create.create);

  const [appName, setAppName] = useState("");
  const [result, setResult] = useState<CreateResult | null>(null);

  const handleCreateNamedApplication = async () => {
    if (!appName.trim()) {
      setResult({ success: false, error: "Please enter an application name" });
      return;
    }

    setIsCreating(true);
    setResult(null);

    try {
      const response = await createApplication({
        name: appName.trim()
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
      <div className="text-center">
        <Label className="text-lg font-medium">Create Application</Label>
      </div>

      {/* Input with integrated send button */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Name"
          className="placeholder:text-gray-400 placeholder:text-sm pr-12"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          disabled={isCreating}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isCreating && appName.trim()) {
              handleCreateNamedApplication();
            }
          }}
        />
        <button
          onClick={handleCreateNamedApplication}
          disabled={isCreating || !appName.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed p-1"
          title={isCreating ? "Creating..." : "Create application"}
        >
          {isCreating ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </button>
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
