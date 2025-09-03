"use node";

import { InstancesClient, ZoneOperationsClient } from '@google-cloud/compute';
import { NodeSSH } from 'node-ssh';
import { GoogleCredentials, MachineState } from '@/convex/githubAccount/repository/machine/action/services/create';

export async function create(name: string, zone: string, credentials: GoogleCredentials): Promise<MachineState> {
  const gcpProjectId = credentials.project_id;

  const clientOptions = {
    projectId: gcpProjectId,
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
  };

  const instancesClient = new InstancesClient(clientOptions);
  const operationsClient = new ZoneOperationsClient(clientOptions);

  const machineState: MachineState = {
    machineName: name,
    projectId: gcpProjectId,
    zone: zone,
    credentials,
    instancesClient,
    operationsClient,
    ssh: new NodeSSH(),
    sshUser: 'ubuntu',
    sshPrivateKeyContent: process.env.GCP_SSH_PRIVATE_KEY,
    sshKeyPassphrase: process.env.GCP_SSH_KEY_PASSPHRASE,
    ip: undefined,
  };

  // SSH Configuration
  const sshPublicKeyPath = process.env.GCP_SSH_PUBLIC_KEY_PATH;
  const sshPublicKeyContent = process.env.GCP_SSH_PUBLIC_KEY;

  if (!sshPublicKeyContent) {
    throw new Error(`SSH public key not found at: ${sshPublicKeyPath} and no GCP_SSH_PUBLIC_KEY environment variable provided.`);
  }

  // COMPLETE VM CONFIGURATION (creation + SSH + network + security)
  const instanceResource = {
    name: name,
    machineType: `zones/${zone}/machineTypes/n1-standard-2`,
    disks: [
      {
        boot: true,
        autoDelete: true,
        initializeParams: {
          sourceImage: 'projects/ubuntu-os-cloud/global/images/family/ubuntu-2204-lts',
        },
      },
    ],
    networkInterfaces: [
      {
        name: 'global/networks/default',
        accessConfigs: [{
          name: 'External NAT',
          type: 'ONE_TO_ONE_NAT',
          // Let GCP assign dynamic IP
        }],
      },
    ],
    metadata: {
      items: [
        {
          key: 'ssh-keys',
          value: `${machineState.sshUser}:${sshPublicKeyContent}`,
        },
      ],
    },
    tags: {
      items: ['https-dev-server']
    }
  };

  // Create VM instance
  const [insertCallResponse] = await instancesClient.insert({
    project: gcpProjectId,
    zone: zone,
    instanceResource,
  });

  const operationName = insertCallResponse.latestResponse?.name;

  // Wait for operation to complete
  const [operation] = await operationsClient.wait({
    operation: operationName,
    project: gcpProjectId,
    zone: zone,
  });

  if (operation.error) {
    const errorDetails = operation.error.errors?.map(e => e.message ?? 'Unknown error detail').join(', ');
    throw new Error(`Failed to create VM: ${errorDetails ?? operation.httpErrorMessage ?? 'Unknown error'}`);
  }

  // Capture the assigned dynamic IP
  const instancesClientForIp = new InstancesClient({
    projectId: credentials.project_id,
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
  });

  const [instance] = await instancesClientForIp.get({
    project: gcpProjectId,
    zone: zone,
    instance: name,
  });

  const externalIp = instance.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP;
  if (!externalIp) {
    throw new Error('Failed to get external IP from GCP');
  }

  return {
    ...machineState,
    ip: externalIp,
  };
}



