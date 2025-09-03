"use node";

import { InstancesClient, ZoneOperationsClient } from '@google-cloud/compute';
import { NodeSSH } from 'node-ssh';

import { create } from "@/convex/githubAccount/repository/machine/action/services/create/machine";
import { setupSystem } from "@/convex/githubAccount/repository/machine/action/services/create/setupSystem";
import { setupRepository } from "@/convex/githubAccount/repository/machine/action/services/create/repository";
import { startDevServer } from "@/convex/githubAccount/repository/machine/action/services/create/devServer";
import { setupSSL } from "@/convex/githubAccount/repository/machine/action/services/create/ssl";  
import { setupWhiteNodeDNS } from "@/convex/githubAccount/repository/machine/action/services/create/dns";
import { cleanupDNSRecord } from "@/convex/githubAccount/repository/machine/action/services/remove/dns";
import { cleanupVMInstance } from "@/convex/githubAccount/repository/machine/action/services/remove/machine";

export interface RepositoryInfo {
  _id: string;
  name: string; // GitHub repository name
  displayName: string; // User-friendly display name
  githubAccountId: string;
  userId?: string;
  isDefault?: boolean;
  _creationTime?: number;
  // GitHub information populated by the query
  accessToken?: string;
  githubUsername?: string;
  envVars?: Array<{ key: string; value: string }>;
}

export interface VMCreateResult {
  success: boolean;
  name: string;
  zone: string;
  domain: string;
  ip?: string;
  machineState?: MachineState;
  devServer?: {
    httpUrl: string;
    httpsUrl?: string;
    convexUrl?: string;
    convexProjectId?: number;
  };
  error?: string;
}

export interface GoogleCredentials {
  project_id: string;
  client_email: string;
  private_key: string;
}

export interface MachineState {
  machineName: string;
  projectId: string;
  zone: string;
  credentials: GoogleCredentials;
  instancesClient: InstancesClient;
  operationsClient: ZoneOperationsClient;
  ssh: NodeSSH;
  sshUser: string;
  sshPrivateKeyContent?: string;
  sshKeyPassphrase?: string;
  ip?: string;
  convexUrl?: string;
  convexProjectId?: number;
}

const ZONES = [
  'us-central1-a',
  'us-central1-b',
  'us-central1-c',
  'us-central1-f',
  'us-west1-a',
  'us-west1-b',
  'us-west1-c',
  'europe-west1-a',
  'europe-west4-a',
  'europe-west3-b',
  'europe-west4-b',
  'europe-west5-a',
  'europe-west1-b',
  'europe-west2-a',
  'europe-west2-b',
  'europe-west3-a',

];

export async function machine(
  repository: RepositoryInfo
): Promise<VMCreateResult> {

  const machineName = `${repository.name}-vm-${Date.now()}`;
  let machineState: MachineState | undefined;

  // Decode Google credentials once for reuse
  const encodedCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!encodedCredentials) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not found');
  }
  const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString();
  const credentials: GoogleCredentials = JSON.parse(decodedCredentials);

  try {

    for (const zone of ZONES) {
      try {
        machineState = await create(machineName, zone, credentials);
        break;
      } catch (error) {
        console.error(`❌ Failed to create VM in zone ${zone}:`, error);
        machineState = undefined; 
      }
    }

    if (!machineState) {
      throw new Error("Failed to create VM in any available zone");
    }

    await new Promise(resolve => setTimeout(resolve, 10000));

    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔗 Connecting to ${machineState.ip}... (attempt ${attempt}/${maxAttempts})`);
        await machineState.ssh.connect({
          host: machineState.ip!,
          username: machineState.sshUser,
          privateKey: machineState.sshPrivateKeyContent,
          passphrase: machineState.sshKeyPassphrase,
          readyTimeout: 20000,
        });
        console.log(`✅ Connected to ${machineState.ip}`);
        break;
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new Error(`Failed to connect after ${maxAttempts} attempts: ${error instanceof Error ? error.message : error}`);
        }
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    await setupSystem(machineState);

    if (!machineState.ip) {
      throw new Error("Machine IP not available for DNS record creation");
    }

    const generatedDomain = await setupWhiteNodeDNS(repository.name, machineState.ip, credentials);
    console.log(`🌐 DNS record created: ${generatedDomain} → ${machineState.ip}`);

    let devServerResult;

    if (repository.accessToken && repository.githubUsername) {
      console.log(`✅ Repository setup conditions met - proceeding with repo setup`);

      const repoResult = await setupRepository(machineState, repository.githubUsername!, repository.name, repository.accessToken, repository.name);

      devServerResult = await startDevServer(machineState, repoResult.repoPath, generatedDomain, repository.githubUsername!, repository.name);

      try {
        const sslResult = await setupSSL(machineState, generatedDomain, repository.name);

        if (sslResult.certPath) {
          console.log(`🔒 SSL certificate configured for ${sslResult.domain}`);
          devServerResult.httpsUrl = `https://${sslResult.domain}`;
        } else {
          console.log('⚠️ SSL setup failed, continuing with HTTP only');
        }
      } catch (sslError) {
        console.log('⚠️ SSL setup failed, continuing with HTTP only:', sslError);
      }
    } else {
      console.log(`❌ Repository setup SKIPPED - missing required data:`);
    }

    return {
      success: true,
      name: machineName,
      zone: machineState.zone,
      domain: generatedDomain,
      ip: machineState.ip,
      machineState: machineState,
      devServer: devServerResult
    };
  } catch (error) {
    console.error("❌ Machine setup failed:", error);

    // Clean up any resources that were created before the error
    try {
      console.log(`🧹 Starting cleanup for repository: ${repository.name}`);

      // 1. Delete DNS record first (if it exists)
      await cleanupDNSRecord(repository.name, credentials);

      // 2. Delete VM instance (if it exists)
      if (machineName && machineState?.zone) {
        await cleanupVMInstance(machineName, machineState.zone, credentials);
      }

      console.log(`✅ Cleanup completed for repository: ${repository.name}`);
    } catch (cleanupError) {
      console.error("❌ Cleanup failed:", cleanupError);
    }

    return {
      success: false,
      name: "",
      zone: "",
      domain: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}




