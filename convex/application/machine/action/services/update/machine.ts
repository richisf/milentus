"use node";

import { InstancesClient, ZoneOperationsClient } from '@google-cloud/compute';

export interface VMSuspendConfig {
  vmName: string;
  zone: string;
  projectId: string;
  credentials: {
    project_id: string;
    client_email: string;
    private_key: string;
  };
}

export async function controlVMInstance(
  config: VMSuspendConfig,
  suspend: boolean
): Promise<{ ipAddress?: string }> {
  const { vmName, zone, projectId, credentials } = config;

  const action = suspend ? 'Suspending' : 'Resuming';
  const actionEmoji = suspend ? '🛑' : '▶️';
  const operationType = suspend ? 'suspend' : 'resume';

  console.log(`${actionEmoji} ${action} VM instance: ${vmName} in ${zone} (preserving memory state)`);

  try {
    const instancesClient = new InstancesClient({
      projectId: projectId,
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    });

    const zoneOperationsClient = new ZoneOperationsClient({
      projectId: projectId,
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    });

    // Suspend or resume the VM instance (preserves memory state)
    const [operation] = suspend
      ? await instancesClient.suspend({
          project: projectId,
          zone: zone,
          instance: vmName,
        })
      : await instancesClient.resume({
          project: projectId,
          zone: zone,
          instance: vmName,
        });

    console.log(`${actionEmoji} VM ${operationType} operation initiated: ${operation.name}`);

    // Wait for the operation to complete
    if (operation.name) {
      const [completedOperation] = await zoneOperationsClient.wait({
        operation: operation.name,
        project: projectId,
        zone: zone,
      });

      if (completedOperation.error) {
        const errorDetails = completedOperation.error.errors?.map(e => e.message ?? 'Unknown error detail').join(', ');
        const actionName = suspend ? 'suspend' : 'resume';
        throw new Error(`Failed to ${actionName} VM: ${errorDetails ?? completedOperation.httpErrorMessage ?? 'Unknown error'}`);
      }

      console.log(`✅ VM instance ${suspend ? 'suspended' : 'resumed'} successfully: ${vmName} (memory state preserved)`);

      // Only get IP address when resuming (not when suspending)
      if (!suspend) {
        const [instance] = await instancesClient.get({
          project: projectId,
          zone: zone,
          instance: vmName,
        });

        const ipAddress = instance.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP || undefined;
        console.log(`🌐 VM IP address: ${ipAddress || 'Not available'}`);

        return { ipAddress };
      }

      return {};
    } else {
      throw new Error(`VM ${operationType} operation did not return an operation name`);
    }

  } catch (error) {
    const actionName = suspend ? 'suspend' : 'resume';
    console.error(`❌ Failed to ${actionName} VM instance:`, error);
    throw new Error(`VM ${actionName} failed: ${error instanceof Error ? error.message : error}`);
  }
}