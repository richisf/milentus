import { internal } from "@/convex/_generated/api";
import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";

export const machine = internalMutation({
  args: {
    applicationId: v.id("application"),
    state: v.string(),
    ipAddress: v.optional(v.string()),
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
      // Verify machine exists
      const machine = await ctx.runQuery(internal.application.machine.query.by_application.machine, {
        applicationId: args.applicationId,
      });
      if (!machine) {
        throw new Error(`Machine not found for application: ${args.applicationId}`);
      }

      // Prepare update object
      const updateData: { state: string; ipAddress?: string } = {
        state: args.state,
      };

      // Add IP address if provided
      if (args.ipAddress !== undefined) {
        updateData.ipAddress = args.ipAddress;
      }

      // Update the machine
      await ctx.db.patch(machine._id, updateData);

      console.log(`✅ Machine ${args.applicationId} updated - State: ${args.state}${args.ipAddress ? `, IP: ${args.ipAddress}` : ''}`);

      return {
        success: true,
      };
    } catch (error) {
      console.error("❌ Machine update failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update machine",
      };
    }
  },
});

