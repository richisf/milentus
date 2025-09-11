import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";

export const application = internalMutation({
    args: {
      applicationId: v.id("application"),
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
        // Delete the application record
        await ctx.db.delete(args.applicationId);
  
        return {
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to delete application",
        };
      }
    },
  });
  