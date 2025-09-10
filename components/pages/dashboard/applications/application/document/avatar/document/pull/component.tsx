"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface PullComponentProps {
  applicationId: Id<"application">;
  documentId?: Id<"document">;
}

export function PullComponent({ applicationId }: PullComponentProps) {
  const pullAction = useAction(api.githubAccount.application.machine.conversation.message.action.create.pull);

  const [isPulling, setIsPulling] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handlePull = async () => {
    setIsPulling(true);
    setResponse(null);

    try {
      const result = await pullAction({
        applicationId: applicationId,
      });

      if (result.success) {
        setResponse("✅ Repository updated successfully!");
      } else {
        setResponse(`❌ Pull failed: ${result.error}`);
      }
    } catch (error) {
      setResponse(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        onClick={(e) => {
          e.stopPropagation();
          handlePull();
        }}
        disabled={isPulling}
        variant="ghost"
        size="sm"
        className="text-xs px-3 py-2 h-8 flex items-center justify-start bg-white hover:bg-gray-50"
      >
        {isPulling ? "📥 Pulling..." : "📥 Pull Changes"}
      </Button>

      {response && (
        <div className="text-xs px-3 py-2 rounded text-gray-600 bg-white">
          {response}
        </div>
      )}
    </div>
  );
}
