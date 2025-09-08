import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const document = action({
  args: {
    documentId: v.id("document"),
    applicationId: v.id("application"),
    message: v.optional(v.string()),
    conversationId: v.optional(v.id("conversation")),
    path: v.optional(v.string()),
    dependencyPath: v.optional(v.string()),
    delete: v.optional(v.boolean()),
    replace: v.optional(v.boolean()),
    nodes: v.optional(v.array(v.object({
      id: v.string(),
      parentId: v.string(),
      label: v.string(),
      collapsed: v.optional(v.boolean())
    })))
  },
  returns: v.object({
    success: v.boolean(),
    documentId: v.optional(v.id("document")),
    nodes: v.optional(v.array(v.object({
      id: v.string(),
      parentId: v.string(),
      label: v.string(),
      collapsed: v.optional(v.boolean())
    }))),
    response: v.optional(v.string()),
    conversation: v.optional(v.object({
      _id: v.id("conversation"),
      _creationTime: v.float64(),
      documentId: v.id("document"),
      messages: v.array(v.object({
        _id: v.id("message"),
        _creationTime: v.float64(),
        conversationId: v.id("conversation"),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.optional(v.string()), // Optional for empty messages
        order: v.float64(),
        contextRestarted: v.optional(v.boolean()), // Whether this message used fresh context
      })),
    })),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    documentId?: Id<"document">,
    nodes?: Array<{
      id: string;
      parentId: string;
      label: string;
      collapsed?: boolean;
    }>,
    response?: string,
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
        contextRestarted?: boolean; // Whether this message used fresh context
      }>;
    },
    error?: string
  }> => {
    try {

      const mutationArgs: {
        documentId: Id<"document">;
        delete?: boolean;
        nodes?: Array<{
          id: string;
          parentId: string;
          label: string;
          collapsed?: boolean;
        }>;
        replace?: boolean;
      } = {
        documentId: args.documentId
      };

      let finalNodes: Array<{
        id: string;
        parentId: string;
        label: string;
        collapsed?: boolean;
      }> = [];

      if (args.delete) {
        console.log(`🗑️ Preparing delete operation for document: ${args.documentId}`);
        mutationArgs.delete = true;
        finalNodes = [];
      }
      else if (args.nodes && args.replace) {
        console.log(`🔄 Preparing replace operation with ${args.nodes.length} nodes for document: ${args.documentId}`);
        mutationArgs.nodes = args.nodes;
        mutationArgs.replace = true;
        finalNodes = args.nodes;
      }
      else if (args.nodes && !args.replace) {
        console.log(`➕ Preparing extend operation with ${args.nodes.length} nodes for document: ${args.documentId}`);
        mutationArgs.nodes = args.nodes;
        mutationArgs.replace = false;
      }

      else if (args.message) {
        console.log(`💬 Processing message for conversation: ${args.conversationId}`);

        // Pass to conversation action for message processing
        const messageProcessingResult = await ctx.runAction(internal.githubAccount.application.document.conversation.action.update.conversation, {
          conversationId: args.conversationId!,
          message: args.message,
          // No validation needed - conversation exists
        });

        if (!messageProcessingResult.success) {
          return {
            success: false,
            error: messageProcessingResult.error
          };
        }

        // After conversation processing, get the updated document nodes
        const updatedDocument = await ctx.runQuery(internal.githubAccount.application.document.query.by_id.document, {
          documentId: args.documentId
        });

        // Handle optional response and conversation (may be undefined during transitions)
        // Note: response can be empty string during stage transitions, which is valid
        if (messageProcessingResult.response === undefined || !messageProcessingResult.conversation) {
          return {
            success: false,
            error: "No response or conversation returned from message processing"
          };
        }

        return {
          success: true,
          documentId: args.documentId,
          response: messageProcessingResult.response,
          conversation: messageProcessingResult.conversation,
          nodes: updatedDocument?.nodes || [] // Include updated nodes
        };
      }

      else if (args.path && args.dependencyPath) {
        console.log(`📁 Processing files for document: ${args.documentId}`);

        const filesProcessingResult = await ctx.runAction(internal.githubAccount.application.document.action.update.files.document, {
          applicationId: args.applicationId,
          path: args.path,
          dependencyPath: args.dependencyPath
        });

        if (!filesProcessingResult.success || !filesProcessingResult.nodes) {
          return {
            success: false,
            error: filesProcessingResult.error || "Failed to process files"
          };
        }

        mutationArgs.nodes = filesProcessingResult.nodes;
        finalNodes = filesProcessingResult.nodes;
      }

      console.log(`📄 Executing document update with args:`, mutationArgs);
      const updatedDocumentId = await ctx.runMutation(internal.githubAccount.application.document.mutation.update.document, mutationArgs);

      // For extend operation, get the combined nodes from the updated document
      if (args.nodes && !args.replace && !args.delete) {
        const updatedDocument = await ctx.runQuery(internal.githubAccount.application.document.query.by_id.document, {
          documentId: updatedDocumentId
        });
        finalNodes = updatedDocument?.nodes || [];
      }

      return {
        success: true,
        documentId: updatedDocumentId,
        nodes: finalNodes
      };
    } catch (error) {
      console.error("❌ Document update error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update document",
      };
    }
  },
});
