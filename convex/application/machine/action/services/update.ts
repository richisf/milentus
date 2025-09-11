"use node";

import { controlVMInstance } from "@/convex/application/machine/action/services/update/machine";
import { suspendDevServer } from "@/convex/application/machine/action/services/update/suspend";
import { resumeDevServer } from "@/convex/application/machine/action/services/update/resume";
import { SSHConnection, GoogleCredentials } from "@/convex/application/machine/action/services/create";
import { setupWhiteNodeDNS } from "@/convex/application/machine/action/services/create/dns";
import { cleanupDNSRecord } from "@/convex/application/machine/action/services/delete/dns";
import { NodeSSH } from 'node-ssh';

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
    const credentials: GoogleCredentials = JSON.parse(decodedCredentials);

    const sshPrivateKey = process.env.GCP_SSH_PRIVATE_KEY;
    if (!sshPrivateKey) {
      throw new Error('GCP_SSH_PRIVATE_KEY environment variable not found');
    }

    const vmConfig = {
      vmName: currentMachine.name,
      zone: currentMachine.zone,
      projectId: credentials.project_id,
      credentials,
    };

    // Create SSH connection info
    const sshConnection: SSHConnection = {
      ssh: new NodeSSH(),
      sshUser: 'ubuntu',
      ip: currentMachine.ipAddress || '',
    };

    const sshCredentials = {
      privateKey: sshPrivateKey,
      passphrase: process.env.GCP_SSH_KEY_PASSPHRASE,
    };

    const repoPath = repoName ? `/home/ubuntu/${repoName}` : `/home/ubuntu/${machineId}`;

    let newIpAddress: string | undefined;

    if (newState === "suspended") {

        console.log(`🔗 Establishing SSH connection to ${sshConnection.ip} for suspension...`);
      try {
        await sshConnection.ssh.connect({
          host: sshConnection.ip,
          username: sshConnection.sshUser,
          privateKey: sshCredentials.privateKey,
          passphrase: sshCredentials.passphrase,
          readyTimeout: 20000,
        });
        try {
          await suspendDevServer(sshConnection, repoPath);
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

        sshConnection.ip = resumeResult.ipAddress;

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

      console.log(`⏳ Waiting 5 seconds for VM to be fully ready after resumption...`);
      await new Promise(resolve => setTimeout(resolve, 5000));

      let sshConnected = false;
      const sshRetries = 3;

      for (let attempt = 1; attempt <= sshRetries; attempt++) {
        try {
          console.log(`🔗 SSH connection attempt ${attempt}/${sshRetries}...`);
          await sshConnection.ssh.connect({
            host: sshConnection.ip,
            username: sshConnection.sshUser,
            privateKey: sshCredentials.privateKey,
            passphrase: sshCredentials.passphrase,
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
          await sshConnection.ssh.execCommand(`sudo nginx -s reload || true`);
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
          await resumeDevServer(sshConnection, repoPath);
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


