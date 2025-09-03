"use node";

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const repository = action({
  args: {
    userId: v.optional(v.string()), // User ID as string (will be converted to proper format)
    name: v.optional(v.string()), // Optional - if not provided, creates default repository
    createMachine: v.optional(v.boolean()), // Whether to create a machine after repository creation
  },
  returns: v.object({
    success: v.boolean(),
    repositoryId: v.optional(v.id("repository")),
    machineId: v.optional(v.id("machine")),
    machineName: v.optional(v.string()),
    machineZone: v.optional(v.string()),
    error: v.optional(v.string()),
    instructions: v.optional(v.string()),
    repositoryUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{success: boolean, repositoryId?: Id<"repository">, machineId?: Id<"machine">, machineName?: string, machineZone?: string, error?: string, instructions?: string, repositoryUrl?: string}> => {
    try {
      // Case 1: Create default repository (no userId and no name provided)
      if (!args.userId && !args.name) {
        console.log("Routing to default repository creation...");
        return await ctx.runAction(internal.githubAccount.repository.action.create.default.repository, {});
        }

      // Case 2: Create user repository from template (userId and name provided)
      if (args.userId && args.name) {

        return await ctx.runAction(internal.githubAccount.repository.action.create.nonDefault.repository, {
          userId: args.userId,
          name: args.name, // Pass display name - transformation happens in handler
          createMachine: args.createMachine,
        });
      }

      // Invalid combination of arguments
      throw new Error("Invalid arguments: provide either no arguments (for default repo) or both userId and name (for user repo)");
    } catch (error) {
      console.error("Repository creation routing error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create repository",
      };
    }
  },
});

