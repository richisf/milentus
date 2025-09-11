"use node";

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { machine as updateMachine } from "@/convex/application/machine/action/services/update";

export const machine = action({
  args: {
    applicationId: v.id("application"),
    newState: v.string(),
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
      // Validate state transition
      if (!["running", "suspended"].includes(args.newState)) {
        throw new Error("Invalid state. Only 'running' and 'suspended' are allowed");
      }

      // Get repository info for internal server path operations
      const repository = await ctx.runQuery(internal.application.repository.query.by_application.repository, {
        applicationId: args.applicationId,
      });

      if (!repository) {
        throw new Error(`Repository not found for application: ${args.applicationId}`);
      }

      // Get machine info
      const machine = await ctx.runQuery(internal.application.machine.query.by_application.machine, {
        applicationId: args.applicationId,
      });

      if (!machine) {
        throw new Error(`No machine found for application: ${args.applicationId}`);
      }

      // Validate transition logic
      if (machine.state === args.newState) {
        throw new Error(`Machine is already in state: ${args.newState}`);
      }

      if (machine.state !== "running" && machine.state !== "suspended") {
        throw new Error(`Cannot transition from current state: ${machine.state}`);
      }

      const orchestrationResult = await updateMachine({
        machineId: machine._id,
        newState: args.newState,
        currentMachine: machine,
        repoName: repository.name, // Repository name for internal server path operations
      });

      const updateResult = await ctx.runMutation(internal.application.machine.mutation.update.machine, {
        applicationId: args.applicationId,
        state: args.newState,
        ipAddress: orchestrationResult,
      });

      if (!updateResult.success) {
        throw new Error(updateResult.error || "Failed to update machine state in database");
      }

      console.log(`✅ Machine state updated to: ${args.newState}`);

      return {
        success: true,
      };
    } catch (error) {
      console.error("❌ Machine state update failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update machine state",
      };
    }
  },
});
