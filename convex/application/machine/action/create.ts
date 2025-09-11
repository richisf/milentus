"use node";

import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { api, internal } from "@/convex/_generated/api";

// Simple function that directly calls schedule1 phase1
export const machine = internalAction({
  args: {
    applicationId: v.id("application"),
    repository: v.object({
      _id: v.id("repository"),
      _creationTime: v.number(),
      applicationId: v.id("application"),
      name: v.string(),
      accessToken: v.optional(v.string()),
      githubUsername: v.optional(v.string()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    console.log(`🚀 Creating machine for ${args.repository.name}`);

    // Create machine record
    const machineName = `${args.repository.name}-vm-${Date.now()}`;
    const machineId = await ctx.runMutation(internal.application.machine.mutation.create.machine, {
      applicationId: args.applicationId,
      name: machineName,
      zone: "",
      state: "pending",
    });

    console.log(`📝 Machine record created: ${machineId}`);

    // Schedule schedule1 phase1
    await ctx.scheduler.runAfter(0, api.application.machine.action.services.create.schedule1.phase1, {
      machineId,
      repository: args.repository,
    });

    console.log(`✅ Machine creation completed for ${machineId}`);
    return { success: true };
  },
});

