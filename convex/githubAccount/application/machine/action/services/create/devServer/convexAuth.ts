"use node";

import { MachineState } from "@/convex/githubAccount/application/machine/action/services/create";

export async function setupConvexAuth(machineState: MachineState, repoPath: string, convexUrl: string): Promise<void> {
  console.log('🔐 Setting up Convex authentication...');

  const escapedRepoPath = repoPath.replace(/'/g, "\\'");
  const escapedConvexUrl = convexUrl.replace(/'/g, "\\'");

  // Run the Convex auth setup command on the remote server
  const authCommand = `cd '${escapedRepoPath}' && printf '${escapedConvexUrl}\\ny\\n' | npx @convex-dev/auth --skip-git-check`;

  const authResult = await machineState.ssh.execCommand(authCommand);

  if (authResult.code !== 0) {
    console.log('⚠️ Convex auth setup completed with warnings:', authResult.stderr);
    console.log('Output:', authResult.stdout);
  } else {
    console.log('✅ Convex authentication setup completed successfully');
    console.log('Output:', authResult.stdout);
  }
}
