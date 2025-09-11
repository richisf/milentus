"use node";

import { NodeSSH } from 'node-ssh';
import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { api, internal } from "@/convex/_generated/api";

import { create } from "@/convex/application/machine/action/services/create/schedule1/machine";
import { setupSystem } from "@/convex/application/machine/action/services/create/schedule1/setupSystem";
import { setupWhiteNodeDNS } from "@/convex/application/machine/action/services/create/schedule1/dns";
import { updateMachineStatus, handlePhaseError, GoogleCredentials } from "@/convex/application/machine/action/services/create";

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

export const phase1 = action({
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

    try {
      // Update machine status to creating_infrastructure
      await updateMachineStatus(ctx, args.machineId, "creating_infrastructure");

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
      await ctx.runMutation(internal.application.machine.mutation.scheduler.machine, {
        machineId: args.machineId,
        updateData: {
          state: "infrastructure_ready",
          zone: vmInfo.zone,
          ipAddress: vmInfo.ip,
          domain: generatedDomain,
        },
      });

      // Schedule phase 2
      console.log(`✅ Phase 1 completed, scheduling Phase 2 for machine ${args.machineId}`);
      await ctx.scheduler.runAfter(0, api.application.machine.action.services.create.schedule2.phase2, {
        machineId: args.machineId,
        repository: args.repository,
        setupResult: {
          ip: vmInfo.ip,
          sshUser: vmInfo.sshUser,
          sshPrivateKeyContent: vmInfo.sshPrivateKeyContent,
          sshKeyPassphrase: vmInfo.sshKeyPassphrase,
          domain: generatedDomain,
          zone: vmInfo.zone
        },
      });

    } catch (error) {
      console.error(`❌ Phase 1 failed for machine ${args.machineId}:`, error);
      await handlePhaseError(ctx, args.machineId);
    }
  },
});
