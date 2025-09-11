"use node";

import { NodeSSH } from 'node-ssh';
import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";

import { setupRepository } from "@/convex/application/machine/action/services/create/schedule2/repository";
import { startDevServer } from "@/convex/application/machine/action/services/create/schedule2/devServer";
import { setupSSL } from "@/convex/application/machine/action/services/create/schedule2/ssl";
import { updateMachineStatus, handlePhaseError } from "@/convex/application/machine/action/services/create";

export const phase2 = action({
  args: {
    machineId: v.id("machine"),
    repository: v.object({
      _id: v.id("repository"),
      _creationTime: v.number(),
      applicationId: v.id("application"),
      name: v.string(),
      accessToken: v.optional(v.string()),
      githubUsername: v.optional(v.string()),
    }),
    setupResult: v.object({
      ip: v.string(),
      sshUser: v.string(),
      sshPrivateKeyContent: v.string(),
      sshKeyPassphrase: v.optional(v.string()),
      domain: v.string(),
      zone: v.string()
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log(`🚀 Phase 2: Repository + Dev Server + SSL setup for machine ${args.machineId}`);

    try {
      // Update machine status to setting_up_application
      await updateMachineStatus(ctx, args.machineId, "setting_up_application");

      // Create SSH connection (fresh in each phase)
      const ssh = new NodeSSH();
      await ssh.connect({
        host: args.setupResult.ip,
        username: args.setupResult.sshUser,
        privateKey: args.setupResult.sshPrivateKeyContent,
        passphrase: args.setupResult.sshKeyPassphrase,
        readyTimeout: 20000,
      });

      let devServerResult;

      if (args.repository.accessToken && args.repository.githubUsername) {
        console.log(`✅ Repository setup conditions met - proceeding with repo setup`);

        // Setup repository
        const repoResult = await setupRepository({
          ssh,
          sshUser: args.setupResult.sshUser,
          ip: args.setupResult.ip
        }, {
          username: args.repository.githubUsername,
          repoName: args.repository.name,
          accessToken: args.repository.accessToken,
          repoDir: args.repository.name
        });

        // Setup dev server
        devServerResult = await startDevServer({
          ssh,
          sshUser: args.setupResult.sshUser,
          ip: args.setupResult.ip
        }, {
          repoPath: repoResult.repoPath,
          domain: args.setupResult.domain,
          username: args.repository.githubUsername,
          repoName: args.repository.name
        });

        // Setup SSL (optional)
        try {
          const sslConfig = {
            domain: args.setupResult.domain,
            repoDir: args.repository.name
          };

          const sslResult = await setupSSL({
            ssh,
            sshUser: args.setupResult.sshUser,
            ip: args.setupResult.ip
          }, sslConfig);
          if (sslResult.certPath) {
            console.log(`🔒 SSL certificate configured for ${sslResult.domain}`);
            if (devServerResult) {
              devServerResult.httpsUrl = `https://${sslResult.domain}`;
            }
          }
        } catch (sslError) {
          console.log('⚠️ SSL setup failed, continuing with HTTP only:', sslError);
        }

      } else {
        console.log(`❌ Repository setup SKIPPED - missing required data`);
      }

      // Final update - mark as running
      await ctx.runMutation(internal.application.machine.mutation.scheduler.machine, {
        machineId: args.machineId,
        updateData: {
          state: "running",
          convexUrl: devServerResult?.convexUrl,
          convexProjectId: devServerResult?.convexProjectId,
          deployKey: devServerResult?.convexDeployKey, // Store the deploy key in the machine record
        },
      });

      console.log(`✅ Machine ${args.machineId} setup completed successfully!`);

    } catch (error) {
      console.error(`❌ Phase 2 failed for machine ${args.machineId}:`, error);
      await handlePhaseError(ctx, args.machineId);
    }
  },
});
