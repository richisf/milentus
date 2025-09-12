"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");

  const handleInitialRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering application card click
    setIsPopoverOpen(true);
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
        setIsPopoverOpen(false);
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
    setIsPopoverOpen(false);
    setConfirmationInput("");
    setRemoveResponse(null);
  };

  // Compact mode: show small button with popover
  if (compact) {
    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            onClick={handleInitialRemoveClick}
            variant="ghost"
            size="sm"
            className="text-xs px-2 py-1 h-6 opacity-70 hover:opacity-100 bg-white"
          >
            ✕
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" side="bottom" align="start">
          <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm text-gray-700 font-medium" onClick={(e) => e.stopPropagation()}>
              Confirm deletion by typing the application name:
            </div>
            <div className="text-sm text-red-600 bg-red-100 px-3 py-2 rounded" onClick={(e) => e.stopPropagation()}>
              {applicationDisplayName || applicationName}
            </div>
            <Input
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Type application name here..."
              className="text-sm h-9 bg-white border-gray-300 focus-visible:ring-0 focus-visible:border-gray-300"
              disabled={isRemoving}
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
                className="text-sm h-8 px-3"
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
                className="text-sm h-8 px-3"
              >
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Normal mode: show full button with popover
  return (
    <div className="flex flex-col gap-1">
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            onClick={handleInitialRemoveClick}
            disabled={isRemoving}
            variant="ghost"
            size="sm"
            className="text-xs px-3 py-2 h-8 flex items-center w-full justify-start bg-white hover:bg-gray-50"
          >
            {isRemoving ? "Removing..." : "Remove Application"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96" side="bottom" align="start">
          <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm text-gray-700 font-medium" onClick={(e) => e.stopPropagation()}>
              Confirm deletion by typing the application name:
            </div>
            <div className="text-sm text-red-600 bg-red-100 px-3 py-2 rounded" onClick={(e) => e.stopPropagation()}>
              {applicationDisplayName || applicationName}
            </div>
            <Input
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Type application name here..."
              className="text-sm h-9 bg-white border-gray-300 focus-visible:ring-0 focus-visible:border-gray-300"
              disabled={isRemoving}
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
                className="text-sm h-8 px-3"
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
                className="text-sm h-8 px-3"
              >
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {removeResponse && (
        <div className="text-xs px-3 py-2 rounded text-gray-600 bg-gray-50">
          {removeResponse}
        </div>
      )}
    </div>
  );
}
