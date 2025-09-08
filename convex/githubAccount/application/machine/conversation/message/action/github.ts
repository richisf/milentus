"use node";

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { NodeSSH } from 'node-ssh';

export const push = action({
  args: {
    applicationId: v.id("application"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    error?: string,
  }> => {
    try {
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

      const machineDetails = machine;
      const ssh = new NodeSSH();

      try {
        console.log(`🚀 Pushing repository changes to GitHub for: ${repository.name}`);

        // Connect to VM using dynamic IP
        if (!machineDetails.ipAddress) {
          throw new Error('Machine IP address not available');
        }

        await ssh.connect({
          host: machineDetails.ipAddress,
          username: 'ubuntu',
          privateKey: process.env.GCP_SSH_PRIVATE_KEY,
          passphrase: process.env.GCP_SSH_KEY_PASSPHRASE,
          readyTimeout: 20000,
        });

        const repoPath = `/home/ubuntu/${repository.name}`;

        // Check if repository exists
        const repoCheck = await ssh.execCommand(`test -d "${repoPath}" && echo "EXISTS" || echo "NOT_EXISTS"`);
        if (!repoCheck.stdout.includes('EXISTS')) {
          throw new Error(`Repository not found at ${repoPath}`);
        }

        console.log('🔍 Checking for uncommitted changes...');

        // Check git status
        const statusResult = await ssh.execCommand(`cd "${repoPath}" && git status --porcelain`);
        const hasChanges = statusResult.stdout.trim().length > 0;

        if (hasChanges) {
          console.log('📝 Found uncommitted changes, committing first...');

          // Add all changes
          await ssh.execCommand(`cd "${repoPath}" && git add .`);

          // Commit with a simple message
          await ssh.execCommand(`cd "${repoPath}" && git commit -m "feat: code updates"`);

          console.log('✅ Changes committed locally');
        } else {
          console.log('📝 No uncommitted changes found');
        }

        // Push to remote
        console.log('🚀 Pushing to GitHub...');
        const pushResult = await ssh.execCommand(`cd "${repoPath}" && git push origin main`);

        if (pushResult.code === 0) {
          console.log('✅ Successfully pushed to GitHub');
          return {
            success: true,
          };
        } else {
          const error = `Git push failed: ${pushResult.stderr || 'Unknown error'}`;
          console.error('❌ Push failed:', error);
          return {
            success: false,
            error: error,
          };
        }

      } finally {
        try {
          ssh.dispose();
        } catch (disposeError) {
          console.log('SSH dispose error (harmless):', disposeError);
        }
      }

    } catch (error) {
      console.error("❌ Push operation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
