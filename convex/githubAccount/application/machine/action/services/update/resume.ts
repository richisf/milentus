"use node";

import { SSHConnection } from '@/convex/githubAccount/application/machine/action/services/create';

export async function resumeDevServer(sshConnection: SSHConnection, repoPath: string): Promise<void> {
  const escapedRepoPath = repoPath.replace(/'/g, "\\'");

  console.log('▶️ Resuming dev server...');

  try {
    // Check if ecosystem config exists
    const configCheck = await sshConnection.ssh.execCommand(
      `cd '${escapedRepoPath}' && ls -la ecosystem.config.json || echo "Config not found"`
    );

    if (configCheck.stdout.includes('Config not found')) {
      throw new Error('PM2 ecosystem config not found. Dev server may need to be set up first.');
    }

    // Try to restart first, then start if restart fails
    console.log('🔄 Attempting to restart dev server...');
    const restartResult = await sshConnection.ssh.execCommand(
      `cd '${escapedRepoPath}' && pm2 restart dev-server || echo "Restart failed"`
    );

    if (restartResult.stdout.includes('Restart failed') || restartResult.code !== 0) {
      console.log('🔄 Restart failed, attempting to start dev server...');
      const startResult = await sshConnection.ssh.execCommand(
        `cd '${escapedRepoPath}' && pm2 start ecosystem.config.json`
      );

      if (startResult.code !== 0) {
        throw new Error(`Failed to start dev server: ${startResult.stderr}`);
      }
    }

    // Wait a moment for startup
    console.log('⏳ Waiting for dev server to initialize...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify the process is running
    const statusResult = await sshConnection.ssh.execCommand(
      `cd '${escapedRepoPath}' && pm2 status dev-server`
    );

    if (statusResult.stdout.includes('online') || statusResult.stdout.includes('running')) {
      console.log('✅ Dev server resumed and running successfully');
    } else if (statusResult.stdout.includes('stopped') || statusResult.stdout.includes('errored')) {
      throw new Error('Dev server failed to start. Check PM2 logs for details.');
    } else {
      console.log('⚠️ Dev server status unclear, but process appears to be running');
    }

  } catch (error) {
    console.error('❌ Failed to resume dev server:', error);
    throw new Error(`Dev server resume failed: ${error instanceof Error ? error.message : error}`);
  }
}
