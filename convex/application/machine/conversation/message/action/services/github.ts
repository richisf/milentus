"use node";

import { NodeSSH } from 'node-ssh';
import { MachineDetails } from './create';

export interface GitPushResult {
  success: boolean;
  error?: string;
}

export interface GitPullResult {
  success: boolean;
  error?: string;
}

/**
 * Handle git pull operations - fetch and merge latest changes from GitHub
 */
export async function handleGitPull(
  machineDetails: MachineDetails,
  repositoryName: string
): Promise<GitPullResult> {
  const ssh = new NodeSSH();

  try {
    console.log(`📥 Pulling latest changes from GitHub for: ${repositoryName}`);

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

    console.log('🔄 Checking for remote changes...');

    // Fetch latest changes from remote
    const fetchResult = await ssh.execCommand(`cd "${repoPath}" && git fetch origin main`);
    if (fetchResult.code !== 0) {
      console.warn('⚠️ Git fetch failed, but continuing:', fetchResult.stderr);
    }

    // Check if there are any incoming changes
    const statusResult = await ssh.execCommand(`cd "${repoPath}" && git status -uno`);
    const hasIncomingChanges = statusResult.stdout.includes('Your branch is behind') ||
                              statusResult.stdout.includes('have diverged');

    if (hasIncomingChanges) {
      console.log('📥 Pulling latest changes...');

      // Pull with rebase to avoid merge commits
      const pullResult = await ssh.execCommand(`cd "${repoPath}" && git pull --rebase origin main`);

      if (pullResult.code === 0) {
        console.log('✅ Successfully pulled latest changes from GitHub');
        return {
          success: true,
        };
      } else {
        // If rebase fails due to conflicts, abort and try a regular pull
        console.log('⚠️ Rebase failed, trying regular pull...');
        await ssh.execCommand(`cd "${repoPath}" && git rebase --abort`).catch(() => {}); // Ignore errors

        const regularPullResult = await ssh.execCommand(`cd "${repoPath}" && git pull origin main`);

        if (regularPullResult.code === 0) {
          console.log('✅ Successfully pulled latest changes (with merge commit)');
          return {
            success: true,
          };
        } else {
          const error = `Git pull failed: ${regularPullResult.stderr || 'Unknown error'}`;
          console.error('❌ Pull failed:', error);
          return {
            success: false,
            error: error,
          };
        }
      }
    } else {
      console.log('📝 Repository is already up to date');
      return {
        success: true,
      };
    }

  } catch (error) {
    console.error("❌ Git pull operation failed:", error);
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
