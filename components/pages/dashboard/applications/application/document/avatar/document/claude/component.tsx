"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

type Node = {
  id: string;
  parentId: string;
  label: string;
  collapsed?: boolean;
};

type NodesData = {
  nodes: Node[];
};

interface ClaudeComponentProps {
  applicationId: Id<"application">;
  documentId?: Id<"document">;
  nodesData: NodesData;
}

// Helper function to calculate node depth
const getDepth = (nodes: Node[], nodeId: string, depth = 0): number => {
  const node = nodes.find(n => n.id === nodeId);
  if (!node || node.parentId === "") return depth;
  return getDepth(nodes, node.parentId, depth + 1);
};

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
      // Create simplified instruction message with readable node structure
      const simplifiedNodes = nodesData.nodes.map(node => {
        const indent = '  '.repeat(getDepth(nodesData.nodes, node.id));
        return `${indent}${node.label}`;
      }).join('\n');

      const instructionMessage = `Build a complete application with these features:

${simplifiedNodes}

Requirements:
1. Generate ALL missing backend code (mutations, queries, actions)
2. Generate corresponding frontend components and pages
3. Create proper TypeScript interfaces and types
4. Implement form handling and validation
5. Add proper error handling and loading states
6. Follow existing project patterns and conventions
7. Create reusable UI components where appropriate
8. Ensure proper data flow between frontend and backend

Focus on complete, production-ready implementation with both backend and frontend.`;

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
