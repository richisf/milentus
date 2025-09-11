import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";

export const machine = internalMutation({
  args: {
    machineId: v.id("machine"),
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
      console.log(`🗑️ Deleting machine from database: ${args.machineId}`);

      // Delete the machine record from database
      await ctx.db.delete(args.machineId);
      console.log(`✅ Machine record deleted from database: ${args.machineId}`);

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
