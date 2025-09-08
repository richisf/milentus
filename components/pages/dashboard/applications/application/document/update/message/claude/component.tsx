"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MessageProps {
  currentUser: { subject: string; issuer: string; tokenIdentifier?: string; email?: string; name?: string } | null;
  applicationId: Id<"application">;
}

export function Message({ currentUser, applicationId }: MessageProps) {
  const sendClaudeAction = useAction(api.githubAccount.application.machine.conversation.message.action.create.message); 

  // State for Claude message
  const [claudeMessage, setClaudeMessage] = useState("");
  const [isSendingClaude, setIsSendingClaude] = useState(false);
  const [claudeMessageResponse, setClaudeMessageResponse] = useState<string | null>(null);

  const handleSendClaudeMessage = async () => {
    if (!currentUser?.subject || !claudeMessage.trim()) {
      setClaudeMessageResponse("Please enter a message and ensure you're signed in");
      return;
    }

    setIsSendingClaude(true);
    setClaudeMessageResponse(null);

    try {
      const result = await sendClaudeAction({
        applicationId: applicationId,
        message: claudeMessage.trim()
      });

      if (result.success) {
        setClaudeMessageResponse("✅ Message sent successfully!");
        setClaudeMessage("");
      } else {
        setClaudeMessageResponse(`❌ Failed to send message: ${result.error}`);
      }
    } catch (error) {
      setClaudeMessageResponse(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSendingClaude(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Message Input and Send Button */}
      <div className="flex gap-2 w-full">
        <Input
          type="text"
          value={claudeMessage}
          onChange={(e) => setClaudeMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={isSendingClaude}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isSendingClaude && claudeMessage.trim()) {
              handleSendClaudeMessage();
            }
          }}
        />

        <Button
          onClick={handleSendClaudeMessage}
          disabled={isSendingClaude || !claudeMessage.trim() || !currentUser?.subject}
          className="w-20"
        >
          {isSendingClaude ? "Sending..." : "Send"}
        </Button>
      </div>

      {claudeMessageResponse && (
        <Alert>
          <AlertDescription className="text-xs text-center">
            {claudeMessageResponse}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
