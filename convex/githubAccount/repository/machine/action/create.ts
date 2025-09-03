"use node";

import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { VMCreateResult } from "@/convex/githubAccount/repository/machine/action/services/create";
import { machine as createMachine } from "@/convex/githubAccount/repository/machine/action/services/create"

export const machine = internalAction({
  args: {
    repositoryId: v.id("repository"),
  },
  returns: v.object({
    success: v.boolean(),
    machineId: v.optional(v.id("machine")),
    error: v.optional(v.string()),
    name: v.optional(v.string()),
    zone: v.optional(v.string()),
    domain: v.optional(v.string()),
    ip: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    machineId?: Id<"machine">,
    error?: string,
    name?: string,
    zone?: string,
    domain?: string,
    ip?: string
  }> => {
    let machineId: Id<"machine"> | undefined;
    let result: VMCreateResult | undefined;

    try {
      const repository = await ctx.runQuery(internal.githubAccount.repository.query.by_id.repository, {
        repositoryId: args.repositoryId,
      });

      if (!repository) {
        throw new Error(`Repository not found: ${args.repositoryId}`);
      }

      result = await createMachine(repository);

      if (!result.success) {
        console.error(`❌ VM creation failed: ${result.error}`);
        return {
          success: false,
          error: result.error || "VM creation failed",
        };
      }

      machineId = await ctx.runMutation(internal.githubAccount.repository.machine.mutation.create.machine, {
        repositoryId: args.repositoryId,
        name: result.name,
        zone: result.zone,
        ipAddress: result.ip,
        domain: result.domain,
        convexUrl: result.devServer?.convexUrl,
        convexProjectId: result.devServer?.convexProjectId,
        state: "running",
      });

      return {
        success: true,
        machineId,
        name: result.name,
        zone: result.zone,
        domain: result.domain,
        ip: result.ip,
      };
    } catch (error) {
      console.error("❌ Machine creation error:", error);

      if (machineId && result) {
        try {
          console.log(`🧹 Cleaning up partially created machine: ${machineId}`);
          const removeResult = await ctx.runAction(internal.githubAccount.repository.machine.action.remove.machine, {
            repositoryId: args.repositoryId,
          });

          if (!removeResult.success) {
            console.error(`❌ Remove action failed: ${removeResult.error}`);
          }
          console.log(`✅ Cleanup completed for machine: ${machineId}`);
        } catch (cleanupError) {
          console.error("❌ Cleanup failed:", cleanupError);
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create machine",
      };
    }
  },
});
