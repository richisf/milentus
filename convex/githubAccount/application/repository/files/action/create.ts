"use node";

import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { createFilesService } from "@/convex/githubAccount/application/repository/files/action/services/create";

export const files = internalAction({
  args: {
    applicationId: v.id("application"),
    path: v.string(),
    dependencyPath: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    files: v.optional(v.array(v.object({
      _id: v.id("files"),
      _creationTime: v.number(),
      repositoryId: v.id("repository"),
      path: v.string(),
      content: v.string(),
      imports: v.optional(v.array(v.id("files")))
    }))),
    processingOrder: v.optional(v.array(v.string())), // File paths in processing order
    processedFiles: v.number(), // Number of files processed
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    files?: {
      _id: Id<"files">;
      _creationTime: number;
      repositoryId: Id<"repository">;
      path: string;
      content: string;
      imports?: Id<"files">[];
    }[];
    processingOrder?: string[];
    processedFiles: number;
    error?: string;
  }> => {
    try {
      
      const repository = await ctx.runQuery(internal.githubAccount.application.repository.query.by_application.repository, {
        applicationId: args.applicationId,
      });

      if (!repository) {
        throw new Error("Application not found");
      }

      const githubAccount = await ctx.runQuery(internal.githubAccount.query.by_user.githubAccount, {
        userId: repository.githubAccountId,
        fallbackToDefault: true,
      });

      if (!githubAccount) {
        throw new Error(`GitHub account not found. Please make sure you have a GitHub account linked or a default account is configured.`);
      }

      // Call the service function to get files that need to be created
      const serviceResult = await createFilesService({
        path: args.path,
        dependencyPath: args.dependencyPath,
        token: githubAccount.token,
        username: githubAccount.username,
        repositoryName: repository.name,
      });

      if (!serviceResult.success || !serviceResult.files) {
        return {
          success: false,
          error: serviceResult.error || "Failed to process files",
          processedFiles: 0,
        };
      }

      // Create files in reverse order (dependencies first)
      const reversedFiles = [...serviceResult.files].reverse();
      const pathToFileId = new Map<string, string>();
      const createdFiles: {
        _id: Id<"files">;
        _creationTime: number;
        repositoryId: Id<"repository">;
        path: string;
        content: string;
        imports?: Id<"files">[];
      }[] = [];

      for (const file of reversedFiles) {
        console.log(`📝 Creating file: ${file.path}`);

        const importFileIds: Id<"files">[] = [];
        for (const depPath of file.dependencies) {
          const depFileId = pathToFileId.get(depPath);
          if (depFileId) {
            importFileIds.push(depFileId as Id<"files">);
            console.log(`  📎 ${file.path} imports ${depPath}`);
          }
        }

        const fileId = await ctx.runMutation(internal.githubAccount.application.repository.files.mutation.create.file, {
          repositoryId: repository._id,
          path: file.path,
          content: file.content,
          imports: importFileIds.length > 0 ? importFileIds : undefined,
        });

        pathToFileId.set(file.path, fileId);

        createdFiles.push({
          _id: fileId,
          repositoryId: repository._id,
          path: file.path,
          content: file.content,
          imports: importFileIds.length > 0 ? importFileIds : undefined,
          _creationTime: Date.now()
        });
      }

      // Return files without creating document
      console.log(`📁 Returning ${createdFiles.length} files for processing...`);

      return {
        success: true,
        files: createdFiles,
        processingOrder: serviceResult.processingOrder,
        processedFiles: createdFiles.length
      };
    } catch (error) {
      console.error("❌ File fetch error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch files",
        processedFiles: 0,
      };
    }
  },
});
