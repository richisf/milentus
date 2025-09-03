"use node";

import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const repository = internalAction({
  args: {},
  returns: v.object({
    success: v.boolean(),
    repositoryId: v.optional(v.id("repository")),
    error: v.optional(v.string()),
    instructions: v.optional(v.string()),
  }),
  handler: async (ctx): Promise<{success: boolean, repositoryId?: Id<"repository">, error?: string, instructions?: string}> => {
    try {
      console.log("Creating default repository...");

      // Check if default repository already exists
      const existingDefaultRepo = await ctx.runQuery(internal.githubAccount.repository.query.by_user_name.repository, {
        userId: undefined,
        name: "whitenode-template",
      });

      if (existingDefaultRepo) {
        throw new Error("Default repository already exists");
      }

      // Create the repository entry in the database
      const repositoryId: Id<"repository"> = await ctx.runMutation(internal.githubAccount.repository.mutation.create.repository, {
        userId: undefined,
        name: "whitenode-template",
        isDefault: true,
      });

      return {
        success: true,
        repositoryId,
        instructions: "✅ Default repository created successfully!",
      };
    } catch (error) {
      console.error("Default repository creation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create default repository",
      };
    }
  },
});
