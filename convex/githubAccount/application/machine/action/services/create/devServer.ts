"use node";

import { MachineState } from "@/convex/githubAccount/application/machine/action/services/create";
import { setupConvexProject } from "@/convex/githubAccount/application/machine/action/services/create/devServer/convexProject";
import { setupDevStableScript } from "@/convex/githubAccount/application/machine/action/services/create/devServer/packageManager";
import { ensureNextConfig } from "@/convex/githubAccount/application/machine/action/services/create/devServer/nextjsConfig";
import { setupPM2Process } from "@/convex/githubAccount/application/machine/action/services/create/devServer/pm2Manager";
import { setupConvexAuth } from "@/convex/githubAccount/application/machine/action/services/create/devServer/convexAuth";

export async function startDevServer(
  machineState: MachineState,
  repoPath: string,
  domain: string,
  username?: string,
  repoName?: string
): Promise<{ httpUrl: string; httpsUrl?: string; convexUrl?: string; convexDevUrl?: string; convexProjectId?: number; convexDeployKey?: string; convexDeploymentIdentifier?: string }> {
  console.log('🚀 Starting dev server with PM2...');

  const port = 3000;
  // HTTPS is always set up by default, so we always configure for HTTPS
  const httpsUrl = domain ? `https://${domain}` : undefined;

  // Step 1: Setup complete Convex project (creation, deploy key, initialization)
  let convexUrl: string | undefined;
  let convexDevUrl: string | undefined;
  let convexProjectId: number | undefined;
  let convexDeployKey: string | undefined;
  let convexDeploymentIdentifier: string | undefined;
  if (username && repoName) {
    const convexResult = await setupConvexProject(machineState, username, repoName, repoPath);
    convexUrl = convexResult.convexUrl;
    convexDevUrl = convexResult.convexDevUrl;
    convexProjectId = convexResult.projectId;
    convexDeployKey = convexResult.deployKey;
    convexDeploymentIdentifier = convexResult.deploymentIdentifier;

    // Store in machineState for later use
    machineState.convexUrl = convexUrl;
    machineState.convexDevUrl = convexDevUrl;
    machineState.convexProjectId = convexProjectId;
    if (convexDeployKey) {
      machineState.convexDeployKey = convexDeployKey;
      console.log('🔑 Deploy key stored in machine state');
    }
  }

  // Step 2: Setup Convex authentication (only if we have a Convex project)
  if (convexUrl) {
    await setupConvexAuth(machineState, repoPath, convexDeployKey);
  }

  // Step 5: Configure project files
  await setupDevStableScript(machineState, repoPath, port);
  await ensureNextConfig(machineState, repoPath);

  // Step 6: Setup and start PM2 (both Next.js and Convex dev servers)
  await setupPM2Process(machineState, {
    repoPath,
    port,
    domain,
    convexUrl,
    convexDeployment: convexDeploymentIdentifier,
    convexDeployKey,
    jwtPrivateKey: machineState.jwtPrivateKey,
    jwks: machineState.jwks
  });

  const httpUrl = `http://${machineState.ip}:${port}`;

  console.log('ℹ️ WebSocket configuration will be applied when SSL is set up');
  console.log(`🌐 Server: ${httpUrl}`);
  console.log(`🔒 HTTPS: ${httpsUrl}`);
  if (convexUrl) {
    console.log(`📊 Convex URL: ${convexUrl}`);
  }

  return { httpUrl, httpsUrl, convexUrl, convexDevUrl, convexProjectId, convexDeployKey, convexDeploymentIdentifier };
}
