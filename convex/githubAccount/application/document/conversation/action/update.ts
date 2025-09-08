import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const conversation = internalAction({
  args: {
    conversationId: v.id("conversation"),
    message: v.optional(v.string()),
    clear: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    response: v.optional(v.string()),
    messageId: v.optional(v.id("message")),
    conversation: v.optional(v.object({
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
    })),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    response?: string;
    messageId?: Id<"message">;
    conversation?: {
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
    error?: string;
  }> => {
    console.log(`${args.clear ? '🗑️ Clearing' : '💬 Processing'} conversation for conversation: ${args.conversationId}`);

    // Query conversation object
    const conversation = await ctx.runQuery(
      internal.githubAccount.application.document.conversation.query.by_document.by_id,
      { conversationId: args.conversationId }
    );
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Handle clear conversation case
    if (args.clear) {
      console.log(`🗑️ Clearing all messages from conversation: ${args.conversationId}`);

      const conversationHistory = await ctx.runQuery(
        internal.githubAccount.application.document.conversation.message.query.by_conversation.messages,
        { conversationId: args.conversationId }
      );

      // Delete all messages via mutation
      for (const message of conversationHistory) {
        await ctx.runMutation(
          internal.githubAccount.application.document.conversation.message.mutation.delete.message,
          { messageId: message._id }
        );
      }

      // Return empty conversation
      return {
        success: true,
        conversation: {
          _id: conversation._id,
          _creationTime: conversation._creationTime,
          documentId: conversation.documentId,
          messages: []
        }
      };
    }

    const conversationHistory = await ctx.runQuery(
      internal.githubAccount.application.document.conversation.message.query.by_conversation.messages,
      { conversationId: args.conversationId }
    );

    console.log(`✅ Queried conversation and ${conversationHistory.length} messages`);

    // Ensure we have a message to process
    if (!args.message) {
      return {
        success: false,
        error: "No message provided"
      };
    }

    // Process message with AI using the context
    const messageResult = await ctx.runAction(
      internal.githubAccount.application.document.conversation.message.action.create.message,
      {
        message: args.message,
        conversationHistory, // Pass context to message action
      }
    );

    if (!messageResult.success) {
      return {
        success: false,
        error: messageResult.error
      };
    }

    // Save both messages via conversation mutation (pass data to avoid re-querying)
    const saveResult = await ctx.runMutation(
      internal.githubAccount.application.document.conversation.mutation.update.conversation,
      {
        conversationId: args.conversationId,
        userMessage: messageResult.userMessage,
        aiResponse: messageResult.aiResponse,
        conversation: conversation, // Pass conversation object
        existingMessages: conversationHistory, // Pass message history
      }
    );

    const completeConversation = saveResult.conversation;

    return {
      success: true,
      response: messageResult.aiResponse,
      messageId: saveResult.aiMessageId,
      conversation: completeConversation,
    };
  },
});
