"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type MessageInputProps = {
  applicationId: Id<"application">;
  documentId: Id<"document">;
  conversationId?: Id<"conversation">;
  onDocumentUpdated?: (documentId: Id<"document">, nodes?: Array<{
    id: string;
    parentId: string;
    label: string;
    collapsed?: boolean;
  }>) => void;
};

export default function MessageInput({ applicationId, documentId, conversationId, onDocumentUpdated }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const updateDocument = useAction(api.githubAccount.application.document.action.update.document);

  const handleSend = async () => {
    if (!message.trim()) return;

    // Only send message if conversation exists
    if (!conversationId) {
      alert("No conversation available. Please create a conversation first.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateDocument({
        documentId,
        applicationId: applicationId, // Pass applicationId for consistency
        conversationId,
        message: message.trim()
      });

      if (result.success) {
        if (result.response) {
          // Handle AI response
          console.log("✅ AI Response received:", result.response);
          setAiResponse(result.response);
        } else if (result.documentId) {
          // Handle document update (for other operations)
          console.log("✅ Document updated:", result.documentId);
          onDocumentUpdated?.(result.documentId, result.nodes);
        }
        setMessage(""); // Clear the input after successful response
      } else {
        console.error("❌ Failed to process message:", result.error);
        alert(`Failed to process message: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("❌ Error updating document:", error);
      alert("Failed to update document. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Only show message input if conversation exists
  if (!conversationId) {
    return null;
  }

  return (
    <div className="px-4 py-3">
      {/* AI Response - Using Alert component */}
      {aiResponse && (
        <Alert className="mb-2 flex items-center justify-between border border-gray-200">
          <AlertDescription className="whitespace-pre-wrap flex-1">
            {aiResponse}
          </AlertDescription>
          <Button
            onClick={() => setAiResponse(null)}
            size="sm"
            variant="ghost"
            className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
            title="Close response"
          >
            ✕
          </Button>
        </Alert>
      )}

      {/* Message input */}
      <div className="flex items-center gap-3">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe what you want to plan..."
          className="flex-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 placeholder:text-gray-400"
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          size="sm"
          variant="ghost"
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <PaperAirplaneIcon className="w-4 h-4 text-gray-500 hover:text-gray-700" />
          )}
        </Button>
      </div>
    </div>
  );
}
