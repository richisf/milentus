"use node";

import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";

export const application = internalAction({
  args: {
    applicationId: v.id("application"),
    repository: v.union(
      v.object({
        _id: v.id("repository"),
        _creationTime: v.number(),
        applicationId: v.id("application"),
        githubAccountId: v.id("githubAccount"),
        name: v.string(),
        accessToken: v.optional(v.string()),
        githubUsername: v.optional(v.string()),
      }),
      v.null()
    ),
    machine: v.union(
      v.object({
        _id: v.id("machine"),
        _creationTime: v.number(),
        applicationId: v.id("application"),
        name: v.string(),
        zone: v.string(),
        state: v.string(),
        ipAddress: v.optional(v.string()),
        domain: v.optional(v.string()),
        convexUrl: v.optional(v.string()),
        convexProjectId: v.optional(v.number()),
      }),
      v.null()
    ),
    document: v.union(
      v.object({
        _id: v.id("document"),
        _creationTime: v.number(),
        applicationId: v.id("application"),
        nodes: v.array(v.object({
          id: v.string(),
          parentId: v.string(),
          label: v.string(),
          collapsed: v.optional(v.boolean()),
          fileId: v.optional(v.id("files"))
        })),
      }),
      v.null()
    ),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean
  }> => {
    try {
      console.log(`🗑️ Removing repository for application: ${args.applicationId}`);

      if (!args.repository) {
        console.log(`ℹ️ No repository found to remove for application: ${args.applicationId}`);
        return { success: true };
      }

      const repositoryRemoveResult = await ctx.runAction(internal.githubAccount.application.repository.action.delete.repository, {
        repository: args.repository,
      });

      if (!repositoryRemoveResult.success) {
        console.error(`❌ Repository removal failed: ${repositoryRemoveResult.error}`);
        throw new Error(`Repository removal failed: ${repositoryRemoveResult.error}`);
      } else {
        console.log(`✅ Repository removal completed`);
      }

      // Handle machine cleanup if machine exists
      if (args.machine) {
        console.log(`🧹 Cleaning up machine for application: ${args.applicationId}`);
        const machineRemoveResult = await ctx.runAction(internal.githubAccount.application.machine.action.delete.machine, {
          machine: args.machine,
        });

        if (!machineRemoveResult.success) {
          console.error(`❌ Machine cleanup failed: ${machineRemoveResult.error}`);
          throw new Error(`Machine cleanup failed: ${machineRemoveResult.error}`);
        } else {
          console.log(`✅ Machine cleanup completed`);
        }
      } else {
        console.log(`ℹ️ No machine found to cleanup for application: ${args.applicationId}`);
      }

      // Handle document cleanup
      if (args.document) {
        console.log(`📄 Cleaning up document for application: ${args.applicationId}`);
        const documentRemoveResult = await ctx.runAction(internal.githubAccount.application.document.action.delete.document, {
          documentId: args.document._id,
        });

        if (!documentRemoveResult.success) {
          console.error(`❌ Document cleanup failed: ${documentRemoveResult.error}`);
          // Don't throw here as document cleanup failure shouldn't block application deletion
          console.warn(`⚠️ Continuing with application deletion despite document cleanup failure`);
        } else {
          console.log(`✅ Document cleanup completed`);
        }
      } else {
        console.log(`ℹ️ No document found to cleanup for application: ${args.applicationId}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Application removal actions error:", error);
      throw error;
    }
  },
});
