"use node";

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { repository as deleteRepository } from "@/convex/githubAccount/repository/action/services/delete";
export const repository = action({
  args: {
    repositoryId: v.id("repository"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    error?: string
  }> => {
    try {
      console.log(`🗑️ Starting repository removal process for repository: ${args.repositoryId}`);

      // Verify repository exists and get GitHub user details
      const existing = await ctx.runQuery(internal.githubAccount.repository.query.by_id.repository, {
        repositoryId: args.repositoryId,
      });
      if (!existing) {
        throw new Error(`Repository not found: ${args.repositoryId}`);
      }

      // Delete repository from GitHub (if we have the access token and username)
      if (existing.accessToken && existing.githubUsername) {

        const githubDeleteResult = await deleteRepository(existing.accessToken, existing.githubUsername, existing.name);

        if (!githubDeleteResult.success) {
          console.error(`❌ GitHub repository deletion failed: ${githubDeleteResult.error}`);
        } else {
          console.log(`✅ GitHub repository deletion completed: ${existing.githubUsername}/${existing.name}`);
        }
      } else {
        console.log(`⚠️ GitHub deletion skipped - accessToken: ${!!existing.accessToken}, githubUsername: "${existing.githubUsername}"`);
      }

      // Find the machine associated with this repository (one-to-one relationship)
      const machine = await ctx.runQuery(internal.githubAccount.repository.machine.query.by_repository.machine, {
        repositoryId: args.repositoryId,
      });

      if (!machine) {
        console.log(`ℹ️ No machine found for repository: ${existing.name}`);
        return {
          success: true,
        };
      }

      console.log(`🧹 Cleaning up machine: ${machine.name} (${machine._id})`);

      // Clean up the machine (DNS records and VM instances)
      const cleanupResult = await ctx.runAction(internal.githubAccount.repository.machine.action.remove.machine, {
        repositoryId: args.repositoryId,
      });

      if (cleanupResult.success) {
        console.log(`✅ Machine cleanup completed: ${machine.name}`);
      } else {
        console.error(`❌ Machine cleanup failed: ${machine.name} - ${cleanupResult.error}`);
        throw new Error(`Machine cleanup failed: ${cleanupResult.error}`);
      }

      // Delete the repository record from database
      const deleteResult = await ctx.runMutation(internal.githubAccount.repository.mutation.remove.repository, {
        repositoryId: args.repositoryId,
      });

      if (!deleteResult.success) {
        throw new Error(`Failed to delete repository: ${deleteResult.error}`);
      }

      console.log(`✅ Repository removal completed: ${args.repositoryId}`);

      return {
        success: true,
      };
    } catch (error) {
      console.error("❌ Repository removal failed:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove repository",
      };
    }
  },
});
