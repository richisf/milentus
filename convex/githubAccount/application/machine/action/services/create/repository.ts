"use node";

import { MachineState } from "@/convex/githubAccount/application/machine/action/services/create";

export async function setupRepository(
  machineState: MachineState,
  username: string,
  repoName: string,
  accessToken: string,
  repoDir?: string
): Promise<{ repoPath: string; repoUrl: string }> {

  const repoDirFinal = repoDir || "claude_repo";


  const repoPath = `/home/${machineState.sshUser}/${repoDirFinal}`;
  const repoUrl = `https://${accessToken}@github.com/${username}/${repoName}.git`;

  console.log('📂 Cloning repository...');

  // Ensure clean directory before cloning
  console.log('🧹 Ensuring clean directory...');
  await machineState.ssh.execCommand(`rm -rf ${repoPath}`);

  const cloneResult = await machineState.ssh.execCommand(`git clone ${repoUrl} ${repoPath}`);

  if (cloneResult.code !== 0) {
    console.error('❌ Git clone failed:', cloneResult.stderr);
    throw new Error(`Repository clone failed: ${cloneResult.stderr}`);
  }
  console.log('✅ Repository cloned successfully');

  console.log('🧹 Cleaning any existing node_modules...');
  await machineState.ssh.execCommand(`cd ${repoPath} && rm -rf node_modules package-lock.json 2>/dev/null || true`);

  console.log('📦 Installing dependencies...');
  const installResult = await machineState.ssh.execCommand(`cd ${repoPath} && npm install`);
  if (installResult.code !== 0) {
    console.error('❌ npm install failed:', installResult.stderr);
    throw new Error(`npm install failed: ${installResult.stderr}`);
  }

  return { repoPath, repoUrl };
}


