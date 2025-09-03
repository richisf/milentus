"use node";

import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { cleanupDNSRecord } from "@/convex/githubAccount/repository/machine/action/services/remove/dns";
import { cleanupVMInstance } from "@/convex/githubAccount/repository/machine/action/services/remove/machine";
import { GoogleCredentials } from "@/convex/githubAccount/repository/machine/action/services/create";
import { removeConvexProject } from "@/convex/githubAccount/repository/machine/action/services/remove/convexProject";  

export const machine = internalAction({
  args: {
    repositoryId: v.id("repository"),
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
      // Get machine details using repository ID (one-to-one relationship)
      const machine = await ctx.runQuery(internal.githubAccount.repository.machine.query.by_repository.machine, {
        repositoryId: args.repositoryId,
      });

      if (!machine) {
        throw new Error(`Machine not found for repository: ${args.repositoryId}`);
      }

      console.log(`🗑️ Starting machine removal process for machine: ${machine._id}`);

      // Get repository details for DNS cleanup
      const repository = await ctx.runQuery(internal.githubAccount.repository.query.by_id.repository, {
        repositoryId: args.repositoryId,
      });

      if (!repository) {
        throw new Error(`Repository not found: ${args.repositoryId}`);
      }

      // Decode Google credentials (same as in create.ts)
      const encodedCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (!encodedCredentials) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not found');
      }
      const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString();
      const credentials: GoogleCredentials = JSON.parse(decodedCredentials);

      console.log(`🧹 Starting cleanup for machine: ${machine.name}`);

      // 1. Delete DNS record first (if it exists)
      try {
        await cleanupDNSRecord(repository.name, credentials);
      } catch (dnsError) {
        console.error(`⚠️ Failed to delete DNS record for ${repository.name}:`, dnsError);
        // Don't throw - DNS cleanup failure shouldn't block the entire cleanup
      }

      // 2. Delete VM instance (if it exists)
      if (machine.name && machine.zone) {
        try {
          await cleanupVMInstance(machine.name, machine.zone, credentials);
        } catch (vmError) {
          console.error(`⚠️ Failed to delete VM instance ${machine.name}:`, vmError);
          // Don't throw - VM cleanup failure shouldn't block the entire cleanup
        }
      }

      // 3. Delete Convex project (if it exists)
      if (machine.convexUrl) {
        try {
          await removeConvexProject(machine.convexUrl, machine.convexProjectId);
        } catch (convexError) {
          console.error(`⚠️ Failed to delete Convex project ${machine.convexUrl}:`, convexError);
          // Don't throw - Convex project deletion failure shouldn't block the entire cleanup
        }
      }

      console.log(`✅ Cleanup completed for machine: ${machine.name}`);

      // Delete the machine record from database
      const deleteResult = await ctx.runMutation(internal.githubAccount.repository.machine.mutation.remove.machine, {
        repositoryId: args.repositoryId,
      });

      if (!deleteResult.success) {
        throw new Error(`Failed to delete machine: ${deleteResult.error}`);
      }

      console.log(`✅ Machine removal completed: ${machine._id}`);

      return {
        success: true,
      };
    } catch (error) {
      console.error("❌ Machine removal cleanup failed:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to cleanup machine",
      };
    }
  },
});
