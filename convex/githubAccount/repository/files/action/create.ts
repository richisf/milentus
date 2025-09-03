"use node";

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { fetchAllFiles } from "./services/traversion";

export const files = action({
  args: {
    repositoryId: v.id("repository"),
    filterCode: v.optional(v.string()), // JavaScript code for the filter function
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    fileCount: v.optional(v.number()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    error?: string;
    fileCount?: number;
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

      const allFiles = await fetchAllFiles(
        githubAccount.token,
        githubAccount.username,
        repository.name,
        args.filterCode
      );

      // Store each file in database
      let storedCount = 0;
      for (const file of allFiles) {
        await ctx.runMutation(internal.githubAccount.repository.files.mutation.create.file, {
          repositoryId: args.repositoryId,
          path: file.path,
          content: file.content,
        });
        storedCount++;
      }

      console.log(`✅ Successfully fetched and stored ${storedCount} files for ${repository.name}`);

      return {
        success: true,
        fileCount: storedCount,
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
