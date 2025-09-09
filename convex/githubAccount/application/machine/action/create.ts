"use node";

import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";

export const machine = internalAction({
  args: {
    applicationId: v.id("application"),
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

      // Generate machine name once to avoid timing issues
      const machineName = `${args.repository.name}-vm-${Date.now()}`;

      const machineId = await ctx.runMutation(internal.githubAccount.application.machine.mutation.create.machine, {
        applicationId: args.applicationId,
        name: machineName,
        zone: "",
        state: "pending",
      });

      console.log(`📝 Machine record created with ID: ${machineId}, status: pending`);

      await ctx.scheduler.runAfter(0, internal.githubAccount.application.machine.action.services.create.phase1, {
        machineId,
        repository: args.repository,
      });

      console.log(`🚀 Phase 1 scheduled for machine: ${machineId}`);

      return { success: true };

    } catch (error) {
      console.error("❌ Machine creation setup error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to setup machine creation",
      };
    }
  },
});
