"use node";

import { controlVMInstance } from "@/convex/githubAccount/repository/machine/action/services/update/machine";
import { suspendDevServer } from "@/convex/githubAccount/repository/machine/action/services/update/suspend";
import { resumeDevServer } from "@/convex/githubAccount/repository/machine/action/services/update/resume";
import { MachineState } from "@/convex/githubAccount/repository/machine/action/services/create";
import { setupWhiteNodeDNS } from "@/convex/githubAccount/repository/machine/action/services/create/dns";
import { cleanupDNSRecord } from "@/convex/githubAccount/repository/machine/action/services/remove/dns";
import { NodeSSH } from 'node-ssh';
import { InstancesClient, ZoneOperationsClient } from '@google-cloud/compute';

export interface OrchestrateMachineUpdateParams {
  machineId: string;
  newState: string;
  currentMachine: {
    name: string;
    zone: string;
    ipAddress?: string;
    domain?: string;
  };
  repoName?: string; // Repository name for dev server operations
}

export async function machine(params: OrchestrateMachineUpdateParams): Promise<string | undefined> {
  const { machineId, newState, currentMachine, repoName } = params;

  console.log(`🎯 Orchestrating machine update: ${machineId} → ${newState}`);

  try {
    // Decode Google credentials (same pattern as create service)
    const encodedCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!encodedCredentials) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not found');
    }
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString();
    const credentials: { project_id: string; client_email: string; private_key: string } = JSON.parse(decodedCredentials);

    const sshPrivateKey = process.env.GCP_SSH_PRIVATE_KEY;

    const vmConfig = {
      vmName: currentMachine.name,
      zone: currentMachine.zone,
      projectId: credentials.project_id,
      credentials,
    };

    const machineState = {
      machineName: currentMachine.name,
      projectId: credentials.project_id,
      zone: currentMachine.zone,
      credentials,
      instancesClient: {} as InstancesClient, // Not needed for SSH operations
      operationsClient: {} as ZoneOperationsClient, // Not needed for SSH operations
      ssh: new NodeSSH(),
      sshUser: 'ubuntu',
      sshPrivateKeyContent: sshPrivateKey,
      sshKeyPassphrase: process.env.GCP_SSH_KEY_PASSPHRASE,
      ip: currentMachine.ipAddress,
    } as MachineState;

    const repoPath = repoName ? `/home/ubuntu/${repoName}` : `/home/ubuntu/${machineId}`;

    let newIpAddress: string | undefined;

    if (newState === "suspended") {

        console.log(`🔗 Establishing SSH connection to ${machineState.ip} for suspension...`);
      try {
        await machineState.ssh.connect({
          host: machineState.ip!,
          username: machineState.sshUser,
          privateKey: machineState.sshPrivateKeyContent,
          passphrase: machineState.sshKeyPassphrase,
          readyTimeout: 20000,
        });
        try {
          await suspendDevServer({ machineState, repoPath });
        } catch (devServerError) {
          console.log("⚠️ Dev server suspension failed, continuing with VM suspension:", devServerError);
        }
      } catch (sshError) {
        console.log("❌ SSH connection failed for suspension:", sshError);
      }
      await controlVMInstance(vmConfig, true);

    } else if (newState === "running") {

        console.log("▶️ Orchestrating VM resumption...");
      const resumeResult = await controlVMInstance(vmConfig, false);

      if (resumeResult.ipAddress && resumeResult.ipAddress !== currentMachine.ipAddress) {
        console.log(`🌐 IP address changed: ${currentMachine.ipAddress} → ${resumeResult.ipAddress}`);
        newIpAddress = resumeResult.ipAddress;

        machineState.ip = resumeResult.ipAddress;

        if (repoName) {
          console.log("🔄 Updating DNS records for new IP address...");
          try {
            await cleanupDNSRecord(repoName, vmConfig.credentials);
            console.log("🗑️ Old DNS record cleaned up");

            const updatedDomain = await setupWhiteNodeDNS(repoName, resumeResult.ipAddress, vmConfig.credentials);
            console.log(`✅ DNS record updated: ${updatedDomain} → ${resumeResult.ipAddress}`);
          } catch (dnsError) {
            console.log("⚠️ DNS update failed, domain may still point to old IP:", dnsError);
          }
        }
      }

      console.log(`⏳ Waiting 30 seconds for VM to be fully ready after resumption...`);
      await new Promise(resolve => setTimeout(resolve, 10000));

      let sshConnected = false;
      const sshRetries = 3;

      for (let attempt = 1; attempt <= sshRetries; attempt++) {
        try {
          console.log(`🔗 SSH connection attempt ${attempt}/${sshRetries}...`);
          await machineState.ssh.connect({
            host: machineState.ip!,
            username: machineState.sshUser,
            privateKey: machineState.sshPrivateKeyContent,
            passphrase: machineState.sshKeyPassphrase,
            readyTimeout: 20000,
          });
          console.log(`✅ SSH connection established for post-resume operations`);
          sshConnected = true;
          break;
        } catch (sshError) {
          console.log(`❌ SSH connection attempt ${attempt} failed:`, sshError);
          if (attempt < sshRetries) {
            console.log(`⏳ Waiting 10 seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
          }
        }
      }

      if (sshConnected) {
        try {
          await machineState.ssh.execCommand(`sudo nginx -s reload || true`);
          console.log("🔄 Nginx configuration reloaded");
        } catch (nginxError) {
          console.log("⚠️ Nginx reload failed:", nginxError);
        }
      } else {
        console.log("❌ SSH connection failed after all retries for post-resume operations");
        console.log("⚠️ Continuing with dev server resumption despite SSH failure...");
      }

      if (sshConnected) {
        console.log("▶️ Orchestrating dev server resumption...");
        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
          await resumeDevServer({ machineState, repoPath });
        } catch (devServerError) {
          console.log("⚠️ Dev server resumption failed:", devServerError);
        }
      } else {
        console.log("⚠️ Skipping dev server resumption - SSH connection not available");
      }
    }

    console.log(`✅ Machine orchestration completed for: ${machineId}`);
    return newIpAddress;

  } catch (error) {
    console.error("❌ Machine orchestration failed:", error);
    throw new Error(`Orchestration failed: ${error instanceof Error ? error.message : error}`);
  }
}


