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
      order: v.number(),
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
      

      const geminiConversation: Array<{
        role: "user" | "assistant";
        content: string;
      }> = [
        // Include previous messages
        ...args.conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content
        })),
        // Always include current user message
        {
          role: "user" as const,
          content: args.message
        }
      ];

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
