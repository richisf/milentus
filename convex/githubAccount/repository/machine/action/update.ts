"use node";

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { machine as updateMachine } from "@/convex/githubAccount/repository/machine/action/services/update";

export const machine = action({
  args: {
    repositoryId: v.id("repository"),
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

      // Get repository and machine info in single query (one-to-one relationship)
      const repository = await ctx.runQuery(internal.githubAccount.repository.query.by_id.repository, {
        repositoryId: args.repositoryId,
      });

      if (!repository) {
        throw new Error(`Repository not found: ${args.repositoryId}`);
      }

      if (!repository.machine) {
        throw new Error(`No machine found for repository: ${args.repositoryId}`);
      }


      // Validate transition logic
      if (repository.machine.state === args.newState) {
        throw new Error(`Machine is already in state: ${args.newState}`);
      }

      if (repository.machine.state !== "running" && repository.machine.state !== "suspended") {
        throw new Error(`Cannot transition from current state: ${repository.machine.state}`);
      }

      const orchestrationResult = await updateMachine({
        machineId: repository.machine._id,
        newState: args.newState,
        currentMachine: repository.machine,
        repoName: repository.name, // Repository name for internal server path operations
      });

      const updateResult = await ctx.runMutation(internal.githubAccount.repository.machine.mutation.update.machine, {
        repositoryId: args.repositoryId,
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
