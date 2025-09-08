"use node";

import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { repository as deleteRepository } from "@/convex/githubAccount/application/repository/action/services/delete";

export const repository = internalAction({
  args: {
    repository: v.object({
      _id: v.id("repository"),
      _creationTime: v.number(),
      applicationId: v.id("application"),
      githubAccountId: v.id("githubAccount"),
      name: v.string(),
      accessToken: v.optional(v.string()),
      githubUsername: v.optional(v.string()),
    }),
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
      console.log(`🗑️ Starting repository removal process for application: ${args.repository.applicationId}`);

      const existing = args.repository;

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

      // Delete the repository record from database
      console.log(`🗃️ Deleting repository database record: ${existing._id}`);
      const repoDeleteResult = await ctx.runMutation(internal.githubAccount.application.repository.mutation.delete.repository, {
        repositoryId: existing._id,
      });

      if (!repoDeleteResult.success) {
        throw new Error(`Failed to delete repository record: ${repoDeleteResult.error}`);
      }

      console.log(`✅ Repository removal completed for application: ${args.repository.applicationId}`);

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
