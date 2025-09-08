import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const conversation = internalMutation({
  args: {
    conversationId: v.id("conversation"),
    userMessage: v.string(),
    aiResponse: v.string(),
    conversation: v.object({
      _id: v.id("conversation"),
      _creationTime: v.number(),
      documentId: v.id("document"),
    }),
    existingMessages: v.array(v.object({
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
    userMessageId: v.id("message"),
    aiMessageId: v.id("message"),
    conversation: v.object({
      _id: v.id("conversation"),
      _creationTime: v.number(),
      documentId: v.id("document"),
      messages: v.array(v.object({
        _id: v.id("message"),
        _creationTime: v.number(),
        conversationId: v.id("conversation"),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        order: v.number(),
      })),
    }),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    userMessageId: Id<"message">;
    aiMessageId: Id<"message">;
    conversation: {
      _id: Id<"conversation">;
      _creationTime: number;
      documentId: Id<"document">;
      messages: Array<{
        _id: Id<"message">;
        _creationTime: number;
        conversationId: Id<"conversation">;
        role: "user" | "assistant";
        content: string;
        order: number;
      }>;
    };
  }> => {
    console.log(`💾 Saving messages for conversation: ${args.conversationId}`);

    // Use provided data instead of querying
    const conversation = args.conversation;
    const existingMessages = args.existingMessages;

    // Create user message
    const userMessageId = await ctx.runMutation(
      internal.githubAccount.application.document.conversation.message.mutation.create.message,
      {
        conversationId: args.conversationId,
        role: "user",
        content: args.userMessage
      }
    );

    // Create AI response message
    const aiMessageId = await ctx.runMutation(
      internal.githubAccount.application.document.conversation.message.mutation.create.message,
      {
        conversationId: args.conversationId,
        role: "assistant",
        content: args.aiResponse
      }
    );

    // Query the newly created messages to get their real data
    const userMessage = await ctx.db.get(userMessageId);
    const aiMessage = await ctx.db.get(aiMessageId);

    if (!userMessage || !aiMessage) {
      throw new Error("Failed to retrieve created messages");
    }

    // Return complete conversation with real data
    const completeConversation = {
      _id: conversation._id,
      _creationTime: conversation._creationTime,
      documentId: conversation.documentId,
      messages: [...existingMessages, userMessage, aiMessage]
    };

    console.log(`✅ Messages saved and conversation updated: User=${userMessageId}, AI=${aiMessageId}`);

    return {
      success: true,
      userMessageId,
      aiMessageId,
      conversation: completeConversation,
    };
  },
});
