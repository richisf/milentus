"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type MessageInputProps = {
  applicationId: Id<"application">;
  documentId: Id<"document">;
  onDocumentUpdated?: (documentId: Id<"document">, nodes?: Array<{
    id: string;
    parentId: string;
    label: string;
    collapsed?: boolean;
  }>) => void;
};

export default function MessageInput({ applicationId, documentId, onDocumentUpdated }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const updateDocument = useAction(api.githubAccount.application.document.action.update.document);

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const result = await updateDocument({
        documentId,
        applicationId: applicationId, // Pass applicationId for consistency
        message: message.trim()
      });

      if (result.success && result.documentId) {
        console.log("✅ Document updated from message:", result.documentId);
        onDocumentUpdated?.(result.documentId, result.nodes);
        setMessage(""); // Clear the input after successful update
      } else {
        console.error("❌ Failed to update document:", result.error);
        alert(`Failed to update document: ${result.error || "Unknown error"}`);
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

  return (
    <div className="flex items-center gap-3 px-4 py-3">
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
  );
}
