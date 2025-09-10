"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

interface MachineProps {
  applicationId: Id<"application">;
  machine: {
    _id: Id<"machine">;
    state: string;
    name: string;
    domain?: string;
    ipAddress?: string;
  };
}

export function Machine({ applicationId, machine }: MachineProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const updateMachineState = useAction(api.githubAccount.application.machine.action.update.machine);

  const handleStateChange = async (newState: "running" | "suspended") => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const result = await updateMachineState({
        applicationId,
        newState,
      });

      if (!result.success) {
        console.error("Failed to update machine state:", result.error);
        alert(`Failed to update machine state: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating machine state:", error);
      alert("An error occurred while updating the machine state");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Status and Control Button */}
      {machine.state === "running" && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleStateChange("suspended");
          }}
          disabled={isUpdating}
          variant="ghost"
          size="sm"
          className="text-xs px-3 py-2 h-8 flex items-center w-full justify-start bg-[#F7F8F4] hover:bg-[#F7F8F4]/80"
        >
          {isUpdating ? "Suspending..." : "Suspend Machine"}
        </Button>
      )}

      {machine.state === "suspended" && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleStateChange("running");
          }}
          disabled={isUpdating}
          variant="ghost"
          size="sm"
          className="text-xs px-3 py-2 h-8 flex items-center w-full justify-start bg-[#F7F8F4] hover:bg-[#F7F8F4]/80"
        >
          {isUpdating ? "Activating..." : "Activate Machine"}
        </Button>
      )}

      {(machine.state === "pending" || machine.state === "terminated") && (
        <div
          className="text-left text-xs px-3 py-2 border border-gray-300 rounded text-gray-500 flex-1 h-8 flex items-center"
          style={{ backgroundColor: '#F7F8F4' }}
        >
          {machine.state === "pending" ? "Starting..." : "Terminated"}
        </div>
      )}
    </div>
  );
}
