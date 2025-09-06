"use node";

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { claude } from "@/convex/githubAccount/repository/machine/conversation/message/action/services/create";

export const message = action({  
  args: {
    repositoryId: v.id("repository"),
    message: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    output: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    error?: string,
    output?: string,
  }> => {
    try {
      // Validate inputs
      if (!args.message || args.message.trim().length === 0) {
        throw new Error("Message cannot be empty");
      }

      if (args.message.length > 10000) {
        throw new Error("Message is too long (max 10000 characters)");
      }
      // Get repository info using query
      const repository = await ctx.runQuery(internal.githubAccount.repository.query.by_id.repository, {
        repositoryId: args.repositoryId,
      });

      if (!repository) {
        throw new Error(`Repository not found: ${args.repositoryId}`);
      }

      // Find the machine for this repository using query
      const machines = await ctx.runQuery(internal.githubAccount.repository.machine.query.by_repository.machine, {
        repositoryId: args.repositoryId,
      });

      if (!machines) {
        throw new Error("No machine found for this repository");
      }

      // Use the first machine (should be the only one for this repo)
      const machineDetails = machines;

      console.log(`🤖 Running Claude Code on machine: ${machineDetails.name}`);

      // Construct HTTPS URL using the machine's domain
      const httpsUrl = machineDetails.domain ? `https://${machineDetails.domain}` : undefined;
      console.log(`🔗 Using HTTPS URL for HMR: ${httpsUrl || 'domain not yet assigned'}`);

      const result = await claude(machineDetails, args.message, httpsUrl, repository.name);

      console.log(`✅ Claude Code command executed successfully`);

      // Log result summary
      if (result.output) {
        console.log(`📝 Claude returned ${result.output.length} characters of output`);
      }
      if (result.error) {
        console.log(`⚠️ Claude returned error/warning: ${result.error}`);
      }

      return {
        success: true,
        output: result.output,
        error: result.error,
      };
    } catch (error) {
      console.error("❌ Claude Code execution failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
