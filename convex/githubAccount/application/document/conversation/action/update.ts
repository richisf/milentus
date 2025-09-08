import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Define the expected return type from the message action
type MessageResult = {
  success: boolean;
  userMessage: string;
  aiResponse: string;
  aiJsonResponse?: string; // Full JSON response from AI
  shouldUpdateDocument: boolean;
  nodes?: Array<{
    id: string;
    parentId: string;
    label: string;
    collapsed?: boolean;
  }>;
  stage: string;
  error?: string;
};

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
        content: v.optional(v.string()), // Optional for empty messages
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
        content?: string; // Optional for empty messages
        order: number;
      }>;
    };
    error?: string;
  }> => {

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


    // Ensure we have a message to process
    if (!args.message) {
      return {
        success: false,
        error: "No message provided"
      };
    }

    // Process message with AI using the context
    const rawMessageResult = await ctx.runAction(
      internal.githubAccount.application.document.conversation.message.action.create.message,
      {
        message: args.message,
        conversationHistory: conversationHistory as Array<{ _id: Id<"message">; _creationTime: number; content: string; jsonResponse?: string | undefined; conversationId: Id<"conversation">; role: "user" | "assistant"; order: number; }>, // Pass context to message action
        documentId: conversation.documentId, // Pass document ID for stage determination
      }
    );

    // Cast to our explicit type to avoid TypeScript union type issues
    const messageResult = rawMessageResult as MessageResult;

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
        aiJsonResponse: messageResult.aiJsonResponse, // Pass full JSON response
        conversation: conversation, // Pass conversation object
        existingMessages: conversationHistory, // Pass message history as-is (with jsonResponse)
      }
    );

    const finalConversation = saveResult.conversation;
    const finalResponse = messageResult.aiResponse;
    const finalMessageId = saveResult.aiMessageId || saveResult.userMessageId; // Use user message ID if no AI message

    // If the AI suggests updating the document with nodes, do it
    console.log(`🔍 Checking document update: shouldUpdate=${messageResult.shouldUpdateDocument}, hasNodes=${Boolean(messageResult.nodes)}, nodeCount=${messageResult.nodes?.length || 0}`);
    
    if (messageResult.shouldUpdateDocument && messageResult.nodes && messageResult.nodes.length > 0) {
      console.log(`📄 Updating document with ${messageResult.nodes.length} nodes`);
      console.log(`📋 Nodes to update:`, JSON.stringify(messageResult.nodes, null, 2));

      // Determine update mode based on stage
      const isDetailsStage = messageResult.stage === "details";
      const updateMode = isDetailsStage ? false : true; // false = extend, true = replace
      
      console.log(`📝 Update mode: ${updateMode ? 'replace' : 'extend'} (stage: ${messageResult.stage})`);

      await ctx.runMutation(
        internal.githubAccount.application.document.mutation.update.document,
        {
          documentId: conversation.documentId,
          nodes: messageResult.nodes,
          replace: updateMode // Replace for features stage, extend for details stage
        }
      );
      
      console.log(`✅ Document updated successfully`);
    } else {
      console.log(`⏭️ Skipping document update - no nodes to update`);
    }

    // Auto-transition logic removed - now handled in message action with cleaner design

    return {
      success: true,
      response: finalResponse,
      messageId: finalMessageId,
      conversation: finalConversation,
    };
  },
});
