"use node";

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { claude } from "@/convex/githubAccount/application/machine/conversation/message/action/services/create";

export const message = action({
  args: {
    applicationId: v.id("application"),
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
      const repository = await ctx.runQuery(internal.githubAccount.application.repository.query.by_application.repository, {
        applicationId: args.applicationId,
      });

      if (!repository) {
        throw new Error(`Repository not found for application: ${args.applicationId}`);
      }

      // Find the machine for this application using query
      const machine = await ctx.runQuery(internal.githubAccount.application.machine.query.by_application.machine, { 
        applicationId: args.applicationId,
      });

      if (!machine) {
        throw new Error("No machine found for this application");
      }

      // Use the machine
      const machineDetails = machine;

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
