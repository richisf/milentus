"use node";

import { SSHConnection } from '@/convex/application/machine/action/services/create';

export async function suspendDevServer(sshConnection: SSHConnection, repoPath: string): Promise<void> {
  const escapedRepoPath = repoPath.replace(/'/g, "\\'");

  console.log('🛑 Suspending dev server...');

  try {
    // Stop the PM2 process
    console.log('🔄 Stopping PM2 dev-server process...');
    const stopResult = await sshConnection.ssh.execCommand(
      `cd '${escapedRepoPath}' && pm2 stop dev-server || pm2 delete dev-server || true`
    );

    if (stopResult.code === 0) {
      console.log('✅ Dev server suspended successfully');
    } else {
      console.log('⚠️ Dev server stop command completed with warnings:', stopResult.stderr);
    }

    // Verify the process is stopped
    const statusResult = await sshConnection.ssh.execCommand(
      `cd '${escapedRepoPath}' && pm2 status dev-server || echo "Process not found"`
    );

    if (statusResult.stdout.includes('stopped') || statusResult.stdout.includes('Process not found')) {
      console.log('✅ Dev server confirmed stopped');
    } else {
      console.log('⚠️ Dev server may still be running');
    }

  } catch (error) {
    console.error('❌ Failed to suspend dev server:', error);
    throw new Error(`Dev server suspension failed: ${error instanceof Error ? error.message : error}`);
  }
}
