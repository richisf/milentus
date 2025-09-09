"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { buildNumberedStructure, Node } from "./hierarchy/helper";

type NodesData = {
  nodes: Node[];
};

interface ClaudeComponentProps {
  applicationId: Id<"application">;
  documentId?: Id<"document">;
  nodesData: NodesData;
}

export function ClaudeComponent({ applicationId, nodesData }: ClaudeComponentProps) {
  const sendClaudeAction = useAction(api.githubAccount.application.machine.conversation.message.action.create.message); 

  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleSendToClaude = async () => {
    if (!nodesData.nodes || nodesData.nodes.length === 0) {
      setResponse("❌ No document structure to send");
      return;
    }

    setIsSending(true);
    setResponse(null);

    try {
      // Create instruction message with numbered hierarchical structure
      const numberedStructure = buildNumberedStructure(nodesData.nodes);

      const instructionMessage = `Application Features: ${numberedStructure}. Create the schema and the folders with the endpoints at @/convex, then the components at @/components, then the pages at @/pages to display the component`;

      const result = await sendClaudeAction({
        applicationId: applicationId,
        message: instructionMessage
      });

      if (result.success) {
        setResponse("✅ Requirements sent to Claude successfully!");
      } else {
        setResponse(`❌ Failed to send to Claude: ${result.error}`);
      }
    } catch (error) {
      setResponse(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        onClick={(e) => {
          e.stopPropagation();
          handleSendToClaude();
        }}
        disabled={isSending || !nodesData.nodes || nodesData.nodes.length === 0}
        variant="ghost"
        size="sm"
        className="text-xs px-3 py-2 h-8 flex items-center w-full justify-start bg-white hover:bg-gray-50"
      >
        {isSending ? "Sending to Claude..." : "Send to Claude"}
      </Button>

      {response && (
        <div className="text-xs px-3 py-2 rounded text-gray-600 bg-white">
          {response}
        </div>
      )}
    </div>
  );
}
