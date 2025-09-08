import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const document = action({
  args: {
    documentId: v.id("document"),
    applicationId: v.id("application"),
    message: v.optional(v.string()),
    path: v.optional(v.string()),
    dependencyPath: v.optional(v.string())
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
    error?: string
  }> => {
    try {

      let nodes: Array<{
        id: string;
        parentId: string;
        label: string;
        collapsed?: boolean;
      }> = [];

      if (args.message) {

        console.log(`💬 Starting message-based document update for document: ${args.documentId}`);

        const messageProcessingResult = await ctx.runAction(internal.githubAccount.application.document.action.update.message.processMessage, {
          message: args.message,
          documentId: args.documentId
        });

        if (!messageProcessingResult.success) {
          return {
            success: false,
            error: messageProcessingResult.error
          };
        }

        nodes = messageProcessingResult.nodes;
      } else if (args.path && args.dependencyPath) {

        console.log(`📁 Starting file-based document update for document: ${args.documentId}`);

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

        nodes = filesProcessingResult.nodes;
      }

      console.log(`📄 Updating document with ${nodes.length} nodes`);

      const updatedDocumentId = await ctx.runMutation(internal.githubAccount.application.document.mutation.update.document, {
        documentId: args.documentId,
        nodes: nodes
      });

      // Get the updated document to return the combined nodes
      const updatedDocument = await ctx.runQuery(internal.githubAccount.application.document.query.by_id.document, {
        documentId: updatedDocumentId
      });

      return {
        success: true,
        documentId: updatedDocumentId,
        nodes: updatedDocument?.nodes || []
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
