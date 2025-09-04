"use node";

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { getAllFilePaths } from "@/convex/githubAccount/repository/files/action/services/files";
import { getMatchingFilesWithContent } from "@/convex/githubAccount/repository/files/action/services/file";
import { recursive } from "@/convex/githubAccount/repository/files/action/services/recurive";

export const files = action({
  args: {
    repositoryId: v.id("repository"),
    path: v.string(),
    dependencyPath: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
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
      const initialFiles = await getMatchingFilesWithContent(
        githubAccount.token,
        githubAccount.username,
        repository.name,
        allPaths,
        args.path
      );

      const allCollectedFiles = await recursive(
        githubAccount.token,
        githubAccount.username,
        repository.name,
        initialFiles,
        args.dependencyPath
      );

      for (const file of allCollectedFiles) {
        await ctx.runMutation(internal.githubAccount.repository.files.mutation.create.file, {
          repositoryId: args.repositoryId,
          path: file.path,
          content: file.content,
        });
      }

      return {
        success: true,
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
