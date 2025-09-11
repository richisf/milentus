"use node";

import { NodeSSH } from 'node-ssh';
import { internalAction, ActionCtx } from "@/convex/_generated/server";
import { v } from "convex/values";
import { Id } from "@/convex/_generated/dataModel";
import { internal } from "@/convex/_generated/api";
import { SchedulableFunctionReference } from "convex/server";

import { create } from "@/convex/application/machine/action/services/create/machine";
import { setupSystem } from "@/convex/application/machine/action/services/create/setupSystem";
import { setupRepository } from "@/convex/application/machine/action/services/create/repository";
import { startDevServer } from "@/convex/application/machine/action/services/create/devServer";
import { setupSSL } from "@/convex/application/machine/action/services/create/ssl";
import { setupWhiteNodeDNS } from "@/convex/application/machine/action/services/create/dns";

// Simplified interfaces - only essential data
export interface GoogleCredentials {
  project_id: string;
  client_email: string;
  private_key: string;
}

// Core connection info that all services need
export interface SSHConnection {
  ssh: NodeSSH;
  sshUser: string;
  ip: string;
}

// Minimal data passed between phases
export interface PhaseData {
  ip: string;
  sshUser: string;
  sshPrivateKeyContent: string;
  sshKeyPassphrase?: string;
  domain: string;
  zone: string;
}

const ZONES = [
  'us-central1-a',
  'us-central1-b',
  'us-central1-c',
  'us-central1-f',
  'us-west1-a',
  'us-west1-b',
  'us-west1-c',
  'us-east1-a',
  'us-east1-b',
  'us-east1-c',
  'us-east4-a',
  'us-east4-b',
  'europe-west1-a',
  'europe-west4-a',
  'europe-west3-b',
  'europe-west4-b',
  'europe-west5-a',
  'europe-west1-b',
  'europe-west2-a',
  'europe-west2-b',
  'europe-west3-a',
  'europe-west3-c',
  
];

async function executePhase<T, R>(
  ctx: ActionCtx,
  machineId: Id<"machine">,
  initialState: string,
  workFn: () => Promise<R>,
  repository: { name: string; _id: Id<"repository"> },
  nextPhase?: SchedulableFunctionReference,
  nextPhaseArgsFn?: (result: R) => T
) {
  // Handle phase errors
  async function handlePhaseError() {
    // Update machine status to failed
    await ctx.runMutation(internal.application.machine.mutation.batch.machine, {
      machineId,
      updateData: { state: "failed" },
    });

    // Get machine details for cleanup
    const machine = await ctx.runQuery(internal.application.machine.query.by_id.machine, {
      machineId,
    });

    if (machine) {
      // Trigger cleanup using the delete action
      await ctx.runAction(internal.application.machine.action.delete.machine, {
        machine,
      });
    }
  }

  try {
    // Update machine status
    await ctx.runMutation(internal.application.machine.mutation.batch.machine, {
      machineId,
      updateData: { state: initialState },
    });

    // Execute the phase work
    const result = await workFn();

    // Schedule next phase if provided
    if (nextPhase && nextPhaseArgsFn) {
      const nextArgs = nextPhaseArgsFn(result);
      await ctx.scheduler.runAfter(0, nextPhase, nextArgs);
      console.log(`✅ Phase completed, next phase scheduled for machine ${machineId}`);
    }

  } catch (error) {
    console.error(`❌ Phase failed for machine ${machineId}:`, error);
    await handlePhaseError();
  }
}

export const phase1 = internalAction({
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log(`🚀 Phase 1: VM + System + DNS setup for machine ${args.machineId}`);

    await executePhase(ctx, args.machineId, "creating_infrastructure", async () => {
      // Decode Google credentials
      const encodedCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (!encodedCredentials) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not found');
      }
      const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString();
      const credentials: GoogleCredentials = JSON.parse(decodedCredentials);

      // Get the machine name from database to ensure consistency
      const machine = await ctx.runQuery(internal.application.machine.query.by_id.machine, {
        machineId: args.machineId,
      });

      if (!machine) {
        throw new Error(`Machine ${args.machineId} not found`);
      }

      let vmInfo: {
        machineName: string;
        projectId: string;
        zone: string;
        ip: string;
        sshUser: string;
        sshPrivateKeyContent: string;
        sshKeyPassphrase?: string;
      } | undefined;

      // Create VM in available zones
      for (const zone of ZONES) {
        try {
          console.log(`🏗️ Creating VM in zone ${zone}`);
          const machineState = await create(machine.name, zone, credentials);
          vmInfo = {
            machineName: machineState.machineName,
            projectId: machineState.projectId,
            zone: machineState.zone,
            ip: machineState.ip,
            sshUser: machineState.sshUser,
            sshPrivateKeyContent: machineState.sshPrivateKeyContent,
            sshKeyPassphrase: machineState.sshKeyPassphrase,
          };
          console.log(`✅ VM created in zone ${zone}: ${vmInfo.ip}`);
          break;
        } catch (error) {
          console.error(`❌ Failed to create VM in zone ${zone}:`, error);
          vmInfo = undefined;
        }
      }

      if (!vmInfo) {
        throw new Error("Failed to create VM in any available zone");
      }

      // Wait for VM to be ready
      console.log(`⏳ Waiting for VM to be ready...`);
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Create SSH connection
      const ssh = new NodeSSH();
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`🔗 Connecting to ${vmInfo.ip}... (attempt ${attempt}/${maxAttempts})`);
          await ssh.connect({
            host: vmInfo.ip,
            username: vmInfo.sshUser,
            privateKey: vmInfo.sshPrivateKeyContent,
            passphrase: vmInfo.sshKeyPassphrase,
            readyTimeout: 20000,
          });
          console.log(`✅ Connected to ${vmInfo.ip}`);
          break;
        } catch (error) {
          if (attempt === maxAttempts) {
            throw new Error(`Failed to connect after ${maxAttempts} attempts: ${error instanceof Error ? error.message : error}`);
          }
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      // Setup system
      const sshConnection = {
        ssh,
        sshUser: vmInfo.sshUser,
        ip: vmInfo.ip,
      };
      await setupSystem(sshConnection);

      // Setup DNS
      const generatedDomain = await setupWhiteNodeDNS(args.repository.name, vmInfo.ip, credentials);
      console.log(`🌐 DNS record created: ${generatedDomain} → ${vmInfo.ip}`);

      // Update machine with all details
      await ctx.runMutation(internal.application.machine.mutation.batch.machine, {
        machineId: args.machineId,
        updateData: {
          state: "infrastructure_ready",
          zone: vmInfo.zone,
          ipAddress: vmInfo.ip,
          domain: generatedDomain,
        },
      });

      // Return minimal data for next phase
      return {
        ip: vmInfo.ip,
        sshUser: vmInfo.sshUser,
        sshPrivateKeyContent: vmInfo.sshPrivateKeyContent,
        sshKeyPassphrase: vmInfo.sshKeyPassphrase,
        domain: generatedDomain,
        zone: vmInfo.zone
      };
    }, { name: args.repository.name, _id: args.repository._id }, internal.application.machine.action.services.create.phase2, (result) => ({
      machineId: args.machineId,
      repository: args.repository,
      setupResult: result,
    }));
  },
});

export const phase2 = internalAction({
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

    await executePhase(ctx, args.machineId, "setting_up_application", async () => {
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
      await ctx.runMutation(internal.application.machine.mutation.batch.machine, {
        machineId: args.machineId,
        updateData: {
          state: "running",
          convexUrl: devServerResult?.convexUrl,
          convexProjectId: devServerResult?.convexProjectId,
          deployKey: devServerResult?.convexDeployKey, // Store the deploy key in the machine record
        },
      });

      console.log(`✅ Machine ${args.machineId} setup completed successfully!`);
      return {};
    }, { name: args.repository.name, _id: args.repository._id }, undefined, undefined);
  },
});

