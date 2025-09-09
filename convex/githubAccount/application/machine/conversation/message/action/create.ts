"use node";

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { claude } from "@/convex/githubAccount/application/machine/conversation/message/action/services/create";
import { handleGitPush, GitPushResult } from "@/convex/githubAccount/application/machine/conversation/message/action/services/github";

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

      console.log(`🤖 Running Claude Code on machine: ${machine.name}`);

      // Construct HTTPS URL using the machine's domain
      const httpsUrl = machine.domain ? `https://${machine.domain}` : undefined;
      console.log(`🔗 Using HTTPS URL for HMR: ${httpsUrl || 'domain not yet assigned'}`);

      const result = await claude(machine, args.message, httpsUrl, repository.name);

      console.log(`✅ Claude Code command executed successfully`);

      // Log result summary
      if (result.output) {
        console.log(`📝 Claude returned ${result.output.length} characters of output`);
      }
      if (result.error) {
        console.log(`⚠️ Claude returned error/warning: ${result.error}`);
      }

      // Handle git operations if Claude had any output (successful or not)
      let gitError: string | undefined;
      if (result.output) {
        console.log(`🔄 Starting git push operations...`);
        const gitPushResult: GitPushResult = await handleGitPush(machine, repository.name);
        gitError = gitPushResult.error;
      }

      // Return result - success if no Claude error occurred
      const hasClaudeError = !!result.error;
      const combinedError = [result.error, gitError].filter(Boolean).join('; ') || undefined;

      return {
        success: !hasClaudeError,
        output: result.output,
        error: combinedError,
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
