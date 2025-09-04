"use node";

import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getAllFilePaths } from "@/convex/githubAccount/repository/document/files/action/services/files";
import { getMatchingFilesWithContent } from "@/convex/githubAccount/repository/document/files/action/services/file";
import { dependencies } from "@/convex/githubAccount/repository/document/files/action/services/dependencies";

export const files = internalAction({
  args: {
    repositoryId: v.id("repository"),
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
    error?: string;
  }> => {
    try {
      const repository = await ctx.runQuery(internal.githubAccount.repository.query.by_id.repository, {
        repositoryId: args.repositoryId,
      });

      if (!repository) {
        throw new Error("Repository not found");
      }

      // Get GitHub account using by_user query with fallback to default
      const githubAccount = await ctx.runQuery(internal.githubAccount.query.by_user.githubAccount, {
        userId: repository.userId,
        fallbackToDefault: true,
      });

      if (!githubAccount) {
        throw new Error(`GitHub account not found. Please make sure you have a GitHub account linked or a default account is configured.`);
      }

      const allPaths = await getAllFilePaths(
        githubAccount.token,
        githubAccount.username,
        repository.name
      );

      // Get initial matching files and recursively collect all dependencies
      console.log(`🔍 Searching for files matching path pattern: "${args.path}"`);
      const initialFiles = await getMatchingFilesWithContent(
        githubAccount.token,
        githubAccount.username,
        repository.name,
        allPaths,
        args.path
      );
      console.log(`📁 Found ${initialFiles.length} initial files:`, initialFiles.map(f => f.path));

      console.log(`🔗 Recursively collecting dependencies with pattern: "${args.dependencyPath}"`);
      const allCollectedFiles = await dependencies(
        githubAccount.token,
        githubAccount.username,
        repository.name,
        initialFiles,
        args.dependencyPath
      );
      console.log(`📦 Total collected files: ${allCollectedFiles.length}`, allCollectedFiles.map(f => f.path));

      const reversedFiles = [...allCollectedFiles].reverse();
      console.log(`🔄 Creating files in reverse order (dependencies first)...`);

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

        const fileId = await ctx.runMutation(internal.githubAccount.repository.document.files.mutation.create.file, {
          repositoryId: args.repositoryId,
          path: file.path,
          content: file.content,
          imports: importFileIds.length > 0 ? importFileIds : undefined,
        });

        pathToFileId.set(file.path, fileId);

        // Store the created file data
        createdFiles.push({
          _id: fileId,
          repositoryId: args.repositoryId,
          path: file.path,
          content: file.content,
          imports: importFileIds.length > 0 ? importFileIds : undefined,
          _creationTime: Date.now() // Approximate creation time
        });
      }

      return {
        success: true,
        files: createdFiles
      };
    } catch (error) {
      console.error("❌ File fetch error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch files",
      };
    }
  },
});
