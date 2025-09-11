"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RemoveProps {
  applicationId: Id<"application">;
  applicationName: string;
  applicationDisplayName?: string;
  onRemoveSuccess?: () => void;
  compact?: boolean;
}

export function Remove({
  applicationId,
  applicationName,
  applicationDisplayName,
  onRemoveSuccess,
  compact = false
}: RemoveProps) {
  const removeApplicationAction = useAction(api.application.action.delete.application);

  const [isRemoving, setIsRemoving] = useState(false);
  const [removeResponse, setRemoveResponse] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");

  const handleInitialRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering application card click
    setShowConfirmation(true);
    setRemoveResponse(null);
  };

  const handleConfirmRemove = async () => {
    if (confirmationInput !== applicationName) {
      setRemoveResponse("❌ Application name doesn't match. Please type the exact application name.");
      return;
    }

    setIsRemoving(true);
    setRemoveResponse(null);

    try {
      const result = await removeApplicationAction({
        applicationId: applicationId,
      });

      if (result.success) {
        setRemoveResponse("✅ Application removed successfully!");
        setShowConfirmation(false);
        // Call the success callback if provided
        onRemoveSuccess?.();
      } else {
        setRemoveResponse(`❌ Failed to remove application: ${result.error}`);
      }
    } catch (error) {
      setRemoveResponse(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setConfirmationInput("");
    setRemoveResponse(null);
  };

  // Compact mode: show small button, then overlay when clicked
  if (compact) {
    if (!showConfirmation) {
      return (
        <Button
          onClick={handleInitialRemoveClick}
          variant="ghost"
          size="sm"
          className="text-xs px-2 py-1 h-6 opacity-70 hover:opacity-100"
        >
          ✕
        </Button>
      );
    }

    return (
      <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center z-20 rounded-lg border">
        <div className="flex flex-col gap-2 p-3 rounded border border-red-200 bg-red-50 w-full max-w-sm mx-4">
          <div className="text-xs text-red-700 font-medium">
            Confirm deletion by typing the application name:
          </div>
          <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded font-mono">
            {applicationDisplayName || applicationName}
          </div>
          <Input
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            placeholder="Type application name here..."
            className="text-xs h-8 bg-white border-gray-300 focus-visible:ring-0 focus-visible:border-gray-300"
            disabled={isRemoving}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleConfirmRemove}
              disabled={isRemoving || confirmationInput !== applicationName}
              size="sm"
              variant="destructive"
              className="text-xs h-7 px-2"
            >
              {isRemoving ? "Deleting..." : "Delete"}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isRemoving}
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Normal mode: show full button and confirmation flow
  return (
    <div className="flex flex-col gap-1">
      {!showConfirmation ? (
        <Button
          onClick={handleInitialRemoveClick}
          disabled={isRemoving}
          variant="ghost"
          size="sm"
          className="text-xs px-3 py-2 h-8 flex items-center w-full justify-start bg-[#F7F8F4]  hover:bg-[#E8E9E4]"
        >
          {isRemoving ? "Removing..." : "Remove Application"}
        </Button>
      ) : (
        <div
          className="flex flex-col gap-2 p-3 rounded border border-red-200 bg-red-50"
          onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling up
        >
          <div className="text-xs text-red-700 font-medium">
            Confirm deletion by typing the application name:
          </div>
          <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded font-mono">
            {applicationDisplayName || applicationName}
          </div>
          <Input
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            placeholder="Type application name here..."
            className="text-xs h-8 bg-white border-gray-300 focus-visible:ring-0 focus-visible:border-gray-300"
            disabled={isRemoving}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleConfirmRemove();
              }}
              disabled={isRemoving || confirmationInput !== applicationName}
              size="sm"
              variant="destructive"
              className="text-xs h-7 px-2"
            >
              {isRemoving ? "Deleting..." : "Delete"}
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              disabled={isRemoving}
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {removeResponse && (
        <div className="text-xs px-3 py-2 rounded text-gray-600" style={{ backgroundColor: '#F7F8F4' }}>
          {removeResponse}
        </div>
      )}
    </div>
  );
}
