"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface GitHubComponentProps {
  applicationId: Id<"application">;
}

export function GitHubComponent({ applicationId }: GitHubComponentProps) {
  const pushAction = useAction(api.githubAccount.application.machine.conversation.message.action.github.push);

  const [isPushing, setIsPushing] = useState(false);
  const [pushResponse, setPushResponse] = useState<string | null>(null);

  const handlePushToGitHub = async () => {
    setIsPushing(true);
    setPushResponse(null);

    try {
      const result = await pushAction({
        applicationId: applicationId
      });

      if (result.success) {
        setPushResponse("✅ Successfully pushed to GitHub!");
      } else {
        setPushResponse(`❌ Failed to push to GitHub: ${result.error}`);
      }
    } catch (error) {
      setPushResponse(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        onClick={(e) => {
          e.stopPropagation();
          handlePushToGitHub();
        }}
        disabled={isPushing}
        variant="ghost"
        size="sm"
        className="text-xs px-3 py-2 h-8 flex items-center w-full justify-start bg-white hover:bg-gray-50"
      >
        {isPushing ? "Pushing to GitHub..." : "Push to GitHub"}
      </Button>

      {pushResponse && (
        <div className="text-xs px-3 py-2 rounded text-gray-600 bg-white">
          {pushResponse}
        </div>
      )}
    </div>
  );
}
