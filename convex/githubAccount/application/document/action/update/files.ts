import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { processFilesWithGemini } from "@/convex/githubAccount/application/document/action/update/services/files";

export const document = internalAction({
  args: {
    applicationId: v.id("application"),
    path: v.string(),
    dependencyPath: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    nodes: v.array(v.object({
      id: v.string(),
      parentId: v.string(),
      label: v.string(),
      collapsed: v.optional(v.boolean())
    })),
    processedFiles: v.number(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    nodes: {
      id: string;
      parentId: string;
      label: string;
      collapsed?: boolean;
    }[],
    processedFiles: number,
    error?: string
  }> => {
    try {
      console.log(`📁 Starting file-based processing for application: ${args.applicationId}`);

      const createFilesResult = await ctx.runAction(internal.githubAccount.application.repository.files.action.create.files, {
        applicationId: args.applicationId,
        path: args.path,
        dependencyPath: args.dependencyPath
      });

      if (!createFilesResult.success || !createFilesResult.files) {
        return {
          success: false,
          nodes: [],
          processedFiles: 0,
          error: createFilesResult.error || "Failed to fetch files"
        };
      }

      const files = createFilesResult.files;

      if (files.length === 0) {
        return {
          success: false,
          nodes: [],
          processedFiles: 0,
          error: "No files provided"
        };
      }

      const processingOrderPaths = createFilesResult.processingOrder || [];

      const pathToFile = new Map<string, typeof files[0]>();
      files.forEach((file: typeof files[0]) => {
        pathToFile.set(file.path, file);
      });

      const processingOrder = processingOrderPaths
        .map((path: string) => pathToFile.get(path))
        .filter((file: typeof files[0] | undefined): file is typeof files[0] => file !== undefined);

      console.log(`📋 Using pre-calculated processing order:`, processingOrder.map((f: typeof files[0]) => f.path));

      // Process files with Gemini using the extracted function
      const geminiResult = await processFilesWithGemini(processingOrder);

      if (!geminiResult.success) {
        return {
          success: false,
          nodes: [],
          processedFiles: 0,
          error: geminiResult.error || "Failed to process files with Gemini"
        };
      }

      console.log(`📤 Returning nodes for document update`);

      return {
        success: true,
        nodes: geminiResult.nodes,
        processedFiles: geminiResult.processedFiles
      };
    } catch (error) {
      console.error("❌ File-based document processing error:", error);
      return {
        success: false,
        nodes: [],
        processedFiles: 0,
        error: error instanceof Error ? error.message : "Failed to process files into nodes",
      };
    }
  },
});
