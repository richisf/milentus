"use node";

import { MachineState } from "@/convex/githubAccount/repository/machine/action/services/create";
import { createConvexProject } from "@/convex/githubAccount/repository/machine/action/services/create/devServer/convexProject";
import { setupDevStableScript } from "@/convex/githubAccount/repository/machine/action/services/create/devServer/packageManager";
import { ensureNextConfig } from "@/convex/githubAccount/repository/machine/action/services/create/devServer/nextjsConfig";
import { setupPM2Process } from "@/convex/githubAccount/repository/machine/action/services/create/devServer/pm2Manager";
import { setEnvironmentVariable } from "@/convex/githubAccount/repository/machine/action/services/create/devServer/envManager";

export async function startDevServer(
  machineState: MachineState,
  repoPath: string,
  domain: string,
  username?: string,
  repoName?: string
): Promise<{ httpUrl: string; httpsUrl?: string; convexUrl?: string; convexProjectId?: number }> {
  console.log('🚀 Starting dev server with PM2...');

  const port = 3000;
  // HTTPS is always set up by default, so we always configure for HTTPS
  const httpsUrl = domain ? `https://${domain}` : undefined;

  // Step 1: Handle Convex project creation
  let convexUrl: string | undefined;
  let convexProjectId: number | undefined;
  if (username && repoName) {
    const convexResult = await createConvexProject(username, repoName);
    convexUrl = convexResult.convexUrl;
    convexProjectId = convexResult.projectId;

    // Store in machineState for later use
    machineState.convexUrl = convexUrl;
    machineState.convexProjectId = convexProjectId;
  }

  // Step 2: Configure project files
  await setupDevStableScript(machineState, repoPath, port);
  await ensureNextConfig(machineState, repoPath);

  // Step 3: Setup and start PM2
  await setupPM2Process(machineState, { repoPath, port, domain });

  // Step 4: Configure environment variables
  if (convexUrl) {
    await setEnvironmentVariable(machineState, repoPath, 'NEXT_PUBLIC_CONVEX_URL', convexUrl);
  } else {
    console.log('⚠️ No convexUrl available, skipping environment variable setup');
  }

  const httpUrl = `http://${machineState.ip}:${port}`;

  console.log('ℹ️ WebSocket configuration will be applied when SSL is set up');
  console.log(`🌐 Server: ${httpUrl}`);
  console.log(`🔒 HTTPS: ${httpsUrl}`);
  if (convexUrl) {
    console.log(`📊 Convex URL: ${convexUrl}`);
  }

  return { httpUrl, httpsUrl, convexUrl, convexProjectId };
}
