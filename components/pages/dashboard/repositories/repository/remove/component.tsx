"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface RemoveRepositoryProps {
  repositoryId: Id<"repository">;
  onRemoveSuccess?: () => void;
}

export function RemoveRepository({ repositoryId, onRemoveSuccess }: RemoveRepositoryProps) {
  const removeRepositoryAction = useAction(api.githubAccount.repository.action.remove.repository);

  const [isRemoving, setIsRemoving] = useState(false);
  const [removeResponse, setRemoveResponse] = useState<string | null>(null);

  const handleRemoveClick = async () => {
    setIsRemoving(true);
    setRemoveResponse(null);

    try {
      const result = await removeRepositoryAction({
        repositoryId: repositoryId,
      });

      if (result.success) {
        setRemoveResponse("✅ Repository removed successfully!");
        // Call the success callback if provided
        onRemoveSuccess?.();
      } else {
        setRemoveResponse(`❌ Failed to remove repository: ${result.error}`);
      }
    } catch (error) {
      setRemoveResponse(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        onClick={handleRemoveClick}
        disabled={isRemoving}
        variant="ghost"
        size="sm"
        className="text-xs px-3 py-2 h-8 flex items-center w-full justify-start bg-[#F7F8F4] hover:bg-[#F7F8F4]/80"
      >
        {isRemoving ? "Removing..." : "Remove Repository"}
      </Button>

      {removeResponse && (
        <div className="text-xs px-3 py-2 rounded text-gray-600" style={{ backgroundColor: '#F7F8F4' }}>
          {removeResponse}
        </div>
      )}
    </div>
  );
}
