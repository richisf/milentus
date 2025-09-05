import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const document = action({
  args: {
    repositoryId: v.id("repository"),
    path: v.optional(v.string()),
    dependencyPath: v.optional(v.string()),
    message: v.optional(v.string())
  },
  returns: v.object({
    success: v.boolean(),
    documentId: v.optional(v.id("document")),
    files: v.optional(v.array(v.object({
      _id: v.id("files"),
      _creationTime: v.number(),
      repositoryId: v.id("repository"),
      path: v.string(),
      content: v.string(),
      imports: v.optional(v.array(v.id("files")))
    }))),
    processedFiles: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    documentId?: Id<"document">,
    files?: {
      _id: Id<"files">;
      _creationTime: number;
      repositoryId: Id<"repository">;
      path: string;
      content: string;
      imports?: Id<"files">[];
    }[],
    processedFiles?: number,
    error?: string
  }> => {
    try {
      // Route based on input parameters
      if (args.path) {
        // Use file-based processing
        console.log(`🚀 Starting file-based document creation for repository: ${args.repositoryId}`);
        const fileProcessingResult = await ctx.runAction(internal.githubAccount.repository.document.action.create.files.processFiles, {
          repositoryId: args.repositoryId,
          path: args.path,
          dependencyPath: args.dependencyPath
        });

        if (!fileProcessingResult.success) {
          return {
            success: false,
            error: fileProcessingResult.error
          };
        }

        console.log(`📄 Creating document with ${fileProcessingResult.nodes.length} nodes`);

        // Create document with processed nodes
        const documentId = await ctx.runMutation(internal.githubAccount.repository.document.mutation.create.document, {
          repositoryId: args.repositoryId,
          nodes: fileProcessingResult.nodes
        });

        return {
          success: true,
          documentId,
          files: fileProcessingResult.files,
          processedFiles: fileProcessingResult.processedFiles
        };
      } else if (args.message) {
        // Use message-based processing
        console.log(`💬 Starting message-based document creation for repository: ${args.repositoryId}`);
        const messageProcessingResult = await ctx.runAction(internal.githubAccount.repository.document.action.create.nonFiles.processMessage, {
          repositoryId: args.repositoryId,
          message: args.message
        });

        if (!messageProcessingResult.success) {
          return {
            success: false,
            error: messageProcessingResult.error
          };
        }

        console.log(`📄 Creating document from message`);

        // Create document with processed nodes
        const documentId = await ctx.runMutation(internal.githubAccount.repository.document.mutation.create.document, {
          repositoryId: args.repositoryId,
          nodes: messageProcessingResult.nodes
        });

        return {
          success: true,
          documentId
        };
      } else {
        throw new Error("Either 'path' or 'message' parameter must be provided");
      }
    } catch (error) {
      console.error("❌ Document creation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create document",
      };
    }
  },
});
