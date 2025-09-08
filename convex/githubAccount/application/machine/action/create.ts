"use node";

import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { machine as createMachine } from "@/convex/githubAccount/application/machine/action/services/create"

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
      const result = await createMachine(args.repository);

      if (result.success) {

        if (result.devServer?.convexUrl && result.devServer?.convexProjectId) {
          const machineId = await ctx.runMutation(internal.githubAccount.application.machine.mutation.create.machine, {
            applicationId: args.applicationId,
            name: result.name!,
            zone: result.zone!,
            ipAddress: result.ip!,
            domain: result.domain!,
            convexUrl: result.devServer!.convexUrl,
            convexProjectId: result.devServer!.convexProjectId,
            state: "running",
          });

          console.log(`✅ Machine created: ${machineId}`);
          return { success: true };
        } else {
          console.error(`❌ Invalid machine data - missing required fields`);
          return {
            success: false,
            error: "Machine creation returned invalid data",
          };
        }
      } else {
        console.error(`❌ VM creation failed: ${result.error}`);
        return {
          success: false,
          error: result.error || "VM creation failed",
        };
      }
    } catch (error) {

      console.error("❌ Machine creation error:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create machine",
      };
    }
  },
});
