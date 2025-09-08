import { sendMessageToGemini } from "@/convex/githubAccount/application/document/conversation/message/action/services/create";
import { Schema } from "@/convex/githubAccount/application/document/conversation/message/action/services/configuration/schema";
import { Instruction } from "@/convex/githubAccount/application/document/conversation/message/action/services/configuration/system";
import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";

export const message = internalAction({
  args: {
    message: v.string(),
    conversationHistory: v.array(v.object({
      _id: v.id("message"),
      _creationTime: v.number(),
      conversationId: v.id("conversation"),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    })),
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
      console.log(`💬 Processing message with ${args.conversationHistory.length} messages context`);

      // Use provided conversation history (no query needed)
      const conversationHistory = args.conversationHistory;

      console.log(`✅ Using provided conversation data with ${conversationHistory.length} messages`);

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
