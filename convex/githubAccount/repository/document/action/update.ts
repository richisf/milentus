import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const document = action({
  args: {
    documentId: v.id("document"),
    repositoryId: v.id("repository"),
    message: v.optional(v.string()),
    path: v.optional(v.string()),
    dependencyPath: v.optional(v.string())
  },
  returns: v.object({
    success: v.boolean(),
    documentId: v.optional(v.id("document")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    documentId?: Id<"document">,
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

        const messageProcessingResult = await ctx.runAction(internal.githubAccount.repository.document.action.update.message.processMessage, {
          message: args.message
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

        const filesProcessingResult = await ctx.runAction(internal.githubAccount.repository.document.action.update.files.document, {
          repositoryId: args.repositoryId,
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

      const updatedDocumentId = await ctx.runMutation(internal.githubAccount.repository.document.mutation.update.document, {
        documentId: args.documentId,
        nodes: nodes
      });

      return {
        success: true,
        documentId: updatedDocumentId
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
