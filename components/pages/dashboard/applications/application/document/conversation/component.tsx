"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";

// Using proper generated types from Convex
type ConversationData = (Doc<"conversation"> & {
  messages: Doc<"message">[];
}) | null;

type MessageInputProps = {
  applicationId: Id<"application">;
  documentId: Id<"document">;
  conversationId?: Id<"conversation">;
  conversationData?: ConversationData; // Now optional - backend queries it
  onDocumentUpdated?: (documentId: Id<"document">, nodes?: Array<{
    id: string;
    parentId: string;
    label: string;
    collapsed?: boolean;
  }>) => void;
};

export default function Conversation({ applicationId, documentId, conversationId, conversationData, onDocumentUpdated }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationData, setCurrentConversationData] = useState(conversationData);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const updateDocument = useAction(api.githubAccount.application.document.action.update.document);

  useEffect(() => {
    setCurrentConversationData(conversationData);
  }, [conversationData]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversationData?.messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    // Only send message if conversation exists
    if (!conversationId) {
      alert("No conversation available. Please create a conversation first.");
      return;
    }

    console.log(`📤 Sending message: "${message.trim()}"`);

    setMessage(""); // Clear the input immediately
    setIsLoading(true);

    try {
      const result = await updateDocument({
        documentId,
        applicationId: applicationId,
        conversationId,
        message: message.trim(),
      });

      if (result.success) {
        // Update the conversation data with the complete updated conversation from server
        if (result.conversation) {
          console.log("✅ Updated conversation received with", result.conversation.messages.length, "messages");
          setCurrentConversationData(result.conversation);
        }
        
        // Handle document node updates (can happen alongside conversation updates)
        if (result.documentId && result.nodes) {
          console.log("✅ Document updated with", result.nodes.length, "nodes");
          onDocumentUpdated?.(result.documentId, result.nodes);
        }
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
      {/* Conversation History */}
      {currentConversationData?.messages && currentConversationData.messages.length > 0 && (
        <div className="mb-3 max-h-40 overflow-y-auto space-y-2">
          {currentConversationData.messages
            .filter((msg) => msg.content && msg.content.trim() !== "") // Only show messages with actual content
            .map((msg) => (
            <Alert key={msg._id} className="border-gray-100 bg-gray-50">
              <AlertDescription className="text-sm">
                <div className="font-medium text-xs text-gray-500 mb-1">
                  {msg.role === "user" ? "You" : "AI"}
                </div>
                <div className="text-gray-800 whitespace-pre-wrap">
                  {msg.content}
                </div>
              </AlertDescription>
            </Alert>
          ))}


          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Message input */}
      <div className="flex items-center gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe your application idea..."
          className="flex-1 border-gray-200 bg-white text-sm"
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          size="sm"
          variant="ghost"
          className="p-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <PaperAirplaneIcon className="w-4 h-4 text-gray-500" />
          )}
        </Button>
      </div>
    </div>
  );
}
