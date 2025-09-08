import { sendMessageToGemini } from "@/convex/githubAccount/application/document/conversation/message/action/services/create";
import { Schema } from "@/convex/githubAccount/application/document/conversation/message/action/services/configuration/schema";
import { Instruction } from "@/convex/githubAccount/application/document/conversation/message/action/services/configuration/system";
import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const message = internalAction({
  args: {
    message: v.string(),
    conversationId: v.id("conversation"),
  },
  returns: v.object({
    success: v.boolean(),
    userMessage: v.string(),
    aiResponse: v.string(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    userMessage: string;
    aiResponse: string;
    error?: string;
  }> => {
    try {
      console.log(`💬 Processing message for conversation: ${args.conversationId}`);

      // Get conversation history for context
      const conversationHistory: Array<{
        _id: Id<"message">;
        _creationTime: number;
        conversationId: Id<"conversation">;
        role: "user" | "assistant";
        content: string;
      }> = await ctx.runQuery(
        internal.githubAccount.application.document.conversation.message.query.by_conversation.messages,
        { conversationId: args.conversationId }
      );

      // Format conversation for Gemini
      const geminiConversation: Array<{
        role: "user" | "assistant";
        content: string;
      }> = conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content
      }));

      console.log(`📚 Conversation history length: ${geminiConversation.length} messages`);

      // Send to Gemini API
      const geminiResponse: {
        response: string;
      } = await sendMessageToGemini<{
        response: string;
        }>(
        Instruction,
        Schema,
        geminiConversation
      );

      console.log(`✅ Gemini response:`, geminiResponse);

      // Validate response and return messages
      if (geminiResponse && geminiResponse.response) {
        return {
          success: true,
          userMessage: args.message,
          aiResponse: geminiResponse.response
        };
      } else {
        throw new Error("Invalid response format from Gemini");
      }

    } catch (error) {
      console.error("❌ Message processing error:", error);
      return {
        success: false,
        userMessage: "",
        aiResponse: "",
        error: error instanceof Error ? error.message : "Failed to process message",
      };
    }
  },
});
