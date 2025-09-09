"use node";

import { NodeSSH } from 'node-ssh';
import { MachineDetails } from './create';

export interface GitPushResult {
  success: boolean;
  error?: string;
}

/**
 * Handle git operations - commit and push changes to GitHub
 */
export async function handleGitPush(
  machineDetails: MachineDetails,
  repositoryName: string
): Promise<GitPushResult> {
  const ssh = new NodeSSH();

  try {
    console.log(`🚀 Pushing repository changes to GitHub for: ${repositoryName}`);

    // Connect to VM using dynamic IP
    if (!machineDetails.ipAddress) {
      throw new Error('Machine IP address not available');
    }

    await ssh.connect({
      host: machineDetails.ipAddress,
      username: 'ubuntu',
      privateKey: process.env.GCP_SSH_PRIVATE_KEY,
      passphrase: process.env.GCP_SSH_KEY_PASSPHRASE,
      readyTimeout: 20000,
    });

    const repoPath = `/home/ubuntu/${repositoryName}`;

    // Check if repository exists
    const repoCheck = await ssh.execCommand(`test -d "${repoPath}" && echo "EXISTS" || echo "NOT_EXISTS"`);
    if (!repoCheck.stdout.includes('EXISTS')) {
      throw new Error(`Repository not found at ${repoPath}`);
    }

    console.log('🔍 Checking for uncommitted changes...');

    // Check git status
    const statusResult = await ssh.execCommand(`cd "${repoPath}" && git status --porcelain`);
    const hasChanges = statusResult.stdout.trim().length > 0;

    if (hasChanges) {
      console.log('📝 Found uncommitted changes, committing first...');

      // Add all changes
      await ssh.execCommand(`cd "${repoPath}" && git add .`);

      // Commit with a simple message
      await ssh.execCommand(`cd "${repoPath}" && git commit -m "feat: code updates"`);

      console.log('✅ Changes committed locally');
    } else {
      console.log('📝 No uncommitted changes found');
    }

    // Push to remote
    console.log('🚀 Pushing to GitHub...');
    const pushResult = await ssh.execCommand(`cd "${repoPath}" && git push origin main`);

    if (pushResult.code === 0) {
      console.log('✅ Successfully pushed to GitHub');
      return {
        success: true,
      };
    } else {
      const error = `Git push failed: ${pushResult.stderr || 'Unknown error'}`;
      console.error('❌ Push failed:', error);
      return {
        success: false,
        error: error,
      };
    }

  } catch (error) {
    console.error("❌ Git push operation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    try {
      ssh.dispose();
    } catch (disposeError) {
      console.log('SSH dispose error (harmless):', disposeError);
    }
  }
}
