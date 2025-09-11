"use node";

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const create = action({
  args: {
    name: v.string(),
    userId: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    applicationId: v.optional(v.id("application")),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    applicationId?: Id<"application">
  }> => {
    try {
      // Create the application first (mutation)
      const applicationId = await ctx.runMutation(internal.application.mutation.create.create, {
        name: args.name,
        userId: args.userId,
      });

      const actionsResult = await ctx.runAction(internal.application.action.services.create.create, {
        applicationId: applicationId,
        name: args.name,
        userId: args.userId,
      }); 

      if (!actionsResult.success) {
        throw new Error(`Application created but repository/machine creation failed`);
      }

      return {
        success: true,  
        applicationId,
      };
    } catch (error) {
      console.error("Application creation error:", error);
      throw error;
    }
  },
});
