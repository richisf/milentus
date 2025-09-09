"use node";

import { SSHConnection } from "@/convex/githubAccount/application/machine/action/services/create";

interface RepoConfig {
  username: string;
  repoName: string;
  accessToken: string;
  repoDir?: string;
}

export async function setupRepository(
  sshConnection: SSHConnection,
  config: RepoConfig
): Promise<{ repoPath: string; repoUrl: string }> {

  const repoDirFinal = config.repoDir || "claude_repo";

  const repoPath = `/home/${sshConnection.sshUser}/${repoDirFinal}`;
  const repoUrl = `https://${config.accessToken}@github.com/${config.username}/${config.repoName}.git`;

  console.log('📂 Cloning repository...');

  // Ensure clean directory before cloning
  console.log('🧹 Ensuring clean directory...');
  await sshConnection.ssh.execCommand(`rm -rf ${repoPath}`);

  const cloneResult = await sshConnection.ssh.execCommand(`git clone ${repoUrl} ${repoPath}`);

  if (cloneResult.code !== 0) {
    console.error('❌ Git clone failed:', cloneResult.stderr);
    throw new Error(`Repository clone failed: ${cloneResult.stderr}`);
  }
  console.log('✅ Repository cloned successfully');

  console.log('🧹 Cleaning any existing node_modules...');
  await sshConnection.ssh.execCommand(`cd ${repoPath} && rm -rf node_modules package-lock.json 2>/dev/null || true`);

  console.log('📦 Installing dependencies...');
  const installResult = await sshConnection.ssh.execCommand(`cd ${repoPath} && npm install`);
  if (installResult.code !== 0) {
    console.error('❌ npm install failed:', installResult.stderr);
    throw new Error(`npm install failed: ${installResult.stderr}`);
  }

  return { repoPath, repoUrl };
}


