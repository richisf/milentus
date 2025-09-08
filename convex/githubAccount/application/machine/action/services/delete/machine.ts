"use node";

import { InstancesClient } from '@google-cloud/compute';
import { GoogleCredentials } from '@/convex/githubAccount/application/machine/action/services/create';

export async function cleanupVMInstance(vmName: string, zone: string, credentials: GoogleCredentials): Promise<void> {
  console.log(`🗑️ Starting VM cleanup for: ${vmName} in ${zone}`);

  try {
    const instancesClient = new InstancesClient({
      projectId: credentials.project_id,
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    });

    // Delete the VM instance
    const [deleteOperation] = await instancesClient.delete({
      project: credentials.project_id,
      zone: zone,
      instance: vmName,
    });

    console.log(`🗑️ VM instance deletion initiated: ${vmName} in ${zone}`);
    console.log(`📝 Operation: ${deleteOperation.name}`);
  } catch (vmError) {
    console.log(`⚠️ VM cleanup failed (might not exist): ${vmError instanceof Error ? vmError.message : vmError}`);
  }

  console.log(`✅ VM cleanup completed for: ${vmName}`);
}
