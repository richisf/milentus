"use node";

import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const create = internalAction({
  args: {
    applicationId: v.id("application"),
    name: v.string(),
    userId: v.string(), // Always required for user applications
    githubAccountId: v.id("githubAccount"), // Passed down to avoid refetching
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean
  }> => {
    try {

      const repositoryResult = await ctx.runAction(internal.application.repository.action.create.repository, {
        applicationId: args.applicationId,
        userId: args.userId,
        name: args.name,
      });

      if (!repositoryResult.success) {
        throw new Error(`Repository creation failed`);
      }

      const machineResult = await ctx.runAction(internal.application.machine.action.create.machine, { 
        applicationId: args.applicationId,
        repository: repositoryResult.repository as {
          _id: Id<"repository">;
          _creationTime: number;
          applicationId: Id<"application">;
          name: string;
          accessToken?: string;
          githubUsername?: string;
        },
      });

      if (!machineResult.success) {
        throw new Error(`Repository created but machine creation failed`);
      }

      const documentResult = await ctx.runAction(internal.application.document.action.create.document, {
        applicationId: args.applicationId,
      });

      if (!documentResult.success) {
        console.warn(`Repository and machine created but document creation failed: ${documentResult.error}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Application creation actions error:", error);
      throw error;
    }
  },
});
