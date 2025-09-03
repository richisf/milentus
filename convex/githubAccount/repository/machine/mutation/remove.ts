import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";

export const machine = internalMutation({
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
      // Get machine using repository ID (one-to-one relationship)
      const machine = await ctx.runQuery(internal.githubAccount.repository.machine.query.by_repository.machine, {
        repositoryId: args.repositoryId,
      });

      if (!machine) {
        throw new Error(`No machine found for repository: ${args.repositoryId}`);
      }

      console.log(`🗑️ Deleting machine from database: ${machine._id}`);

      // Delete the machine record from database
      await ctx.db.delete(machine._id);
      console.log(`✅ Machine record deleted from database: ${machine._id}`);

      return {
        success: true,
      };
    } catch (error) {
      console.error("❌ Machine database deletion failed:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete machine from database",
      };
    }
  },
});
