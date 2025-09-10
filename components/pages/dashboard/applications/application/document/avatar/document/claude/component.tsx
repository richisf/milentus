"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { buildNumberedStructure, Node } from "./hierarchy/helper";

type NodesData = {
  nodes: Node[];
};

interface ClaudeProps {
  applicationId: Id<"application">;
  documentId?: Id<"document">;
  nodesData: NodesData;
}

export function Claude({ applicationId, nodesData }: ClaudeProps) {
  const sendClaudeAction = useAction(api.githubAccount.application.machine.conversation.message.action.create.message); 

  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [claudeOutput, setClaudeOutput] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

      const instructionMessage = `Application Features: ${numberedStructure}. Create the schema and the folders with the endpoints at @/convex, then the components at @/components, and integrate the components so that they are visible inside current components that can be viewed inside a page in @/pages, or if necessary, create a new page. Note create all of thefrontend, backend and database components. Note always run npx tsc --noEmit and npm run lint to check for Typescript checks before ending the task - fix the errors if any are present.`;

      const result = await sendClaudeAction({
        applicationId: applicationId,
        message: instructionMessage
      });

      // Capture Claude output for display
      if (result.output) {
        console.log('🎯 Frontend received Claude output:', result.output.length, 'characters');
        console.log('📄 Output preview (first 200 chars):', result.output.substring(0, 200));
        setClaudeOutput(result.output);
      } else {
        console.log('⚠️ No Claude output received in frontend');
      }

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
      <div className="flex gap-1">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleSendToClaude();
          }}
          disabled={isSending || !nodesData.nodes || nodesData.nodes.length === 0}
          variant="ghost"
          size="sm"
          className="text-xs px-3 py-2 h-8 flex items-center justify-start bg-white hover:bg-gray-50 flex-1"
        >
          {isSending ? "Sending to Claude..." : "Send to Claude"}
        </Button>

        {claudeOutput && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-3 py-2 h-8 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDialogOpen(true);
                }}
              >
                📋 View Claude Output ({claudeOutput.length} chars)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  🤖 Claude Code Session Output
                  <span className="text-sm font-normal text-gray-500">
                    ({claudeOutput.length} characters)
                  </span>
                </DialogTitle>
              </DialogHeader>
              <div className="h-[80vh] w-full overflow-y-auto border rounded-lg bg-gray-50">
                <div className="p-4">
                  <div className="mb-4 text-sm text-gray-600 bg-white p-3 rounded border">
                    <strong>📊 Complete Claude Output:</strong> {claudeOutput.length.toLocaleString()} characters
                    <br />
                    <strong>🔍 Status:</strong> No truncation - showing 100% of output
                  </div>
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-white p-4 rounded border leading-relaxed">
                    {claudeOutput}
                  </pre>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {response && (
        <div className="text-xs px-3 py-2 rounded text-gray-600 bg-white">
          {response}
        </div>
      )}
    </div>
  );
}
