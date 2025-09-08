"use node";

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";

export const application = action({
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
      // Get repository data to pass to services
      const repository = await ctx.runQuery(internal.githubAccount.application.repository.query.by_application.repository, {
        applicationId: args.applicationId,
      });

      // Get machine data to pass to services
      const machine = await ctx.runQuery(internal.githubAccount.application.machine.query.by_application.machine, {
        applicationId: args.applicationId,
      });

      // Get document data to pass to services
      const document = await ctx.runQuery(internal.githubAccount.application.document.query.by_application.document, {
        applicationId: args.applicationId,
      });

      const actionsResult = await ctx.runAction(internal.githubAccount.application.action.services.delete.application, {
        applicationId: args.applicationId,
        repository: repository,
        machine: machine,
        document: document,
      });

      if (!actionsResult.success) {
        throw new Error(`Application removal actions failed`);
      }

      const deleteResult = await ctx.runMutation(internal.githubAccount.application.mutation.delete.application, {
        applicationId: args.applicationId,
      });

      if (!deleteResult.success) {
        throw new Error(`Failed to delete application: ${deleteResult.error}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("❌ Complete application removal failed:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove application",
      };
    }
  },
});

