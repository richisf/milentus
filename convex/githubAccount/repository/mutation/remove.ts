import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";

export const repository = internalMutation({
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
      console.log(`🗑️ Deleting repository from database: ${args.repositoryId}`);

      // Verify repository exists
      const existing = await ctx.runQuery(internal.githubAccount.repository.query.by_id.repository, {  
        repositoryId: args.repositoryId,
      });
      if (!existing) {
        throw new Error(`Repository not found: ${args.repositoryId}`);
      }

      // Delete the repository record from database
      await ctx.db.delete(args.repositoryId);
      console.log(`✅ Repository record deleted from database: ${args.repositoryId}`);

      return {
        success: true,
      };
    } catch (error) {
      console.error("❌ Repository database deletion failed:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete repository from database",
      };
    }
  },
});
