"use node";

import { SSHConnection } from "@/convex/githubAccount/application/machine/action/services/create";
import { setupConvexProject } from "@/convex/githubAccount/application/machine/action/services/create/devServer/convexProject";
import { setupDevStableScript } from "@/convex/githubAccount/application/machine/action/services/create/devServer/packageManager";
import { ensureNextConfig } from "@/convex/githubAccount/application/machine/action/services/create/devServer/nextjsConfig";
import { setupPM2Process } from "@/convex/githubAccount/application/machine/action/services/create/devServer/pm2Manager";
import { setupConvexAuth } from "@/convex/githubAccount/application/machine/action/services/create/devServer/convexAuth";
import { setEnvironmentVariable } from "@/convex/githubAccount/application/machine/action/services/create/devServer/envManager";

interface DevServerConfig {
  repoPath: string;
  domain: string;
  username?: string;
  repoName?: string;
}

export async function startDevServer(
  sshConnection: SSHConnection,
  config: DevServerConfig
): Promise<{ httpUrl: string; httpsUrl?: string; convexUrl?: string; convexDevUrl?: string; convexProjectId?: number; convexDeployKey?: string; convexDeploymentIdentifier?: string }> {
  console.log('🚀 Starting dev server with PM2...');

  const port = 3000;
  // HTTPS is always set up by default, so we always configure for HTTPS
  const httpsUrl = config.domain ? `https://${config.domain}` : undefined;

  // Step 1: Setup complete Convex project (creation, deploy key, initialization)
  let convexUrl: string | undefined;
  let convexDevUrl: string | undefined;
  let convexProjectId: number | undefined;
  let convexDeployKey: string | undefined;
  let convexDeploymentIdentifier: string | undefined;
  if (config.username && config.repoName) {
    const convexResult = await setupConvexProject(sshConnection, config.username, config.repoName, config.repoPath);
    convexUrl = convexResult.convexUrl;
    convexDevUrl = convexResult.convexDevUrl;
    convexProjectId = convexResult.projectId;
    convexDeployKey = convexResult.deployKey;
    convexDeploymentIdentifier = convexResult.deploymentIdentifier;
  }

  // Step 2: Setup Convex authentication (only if we have a Convex project)
  let jwtKeys: { jwtPrivateKey?: string; jwks?: string } = {};
  if (convexUrl) {
    jwtKeys = await setupConvexAuth(sshConnection, config.repoPath, convexDeployKey);
  }

  // Step 5: Configure project files
  await setupDevStableScript(sshConnection, config.repoPath, port);
  await ensureNextConfig(sshConnection, config.repoPath);

  // Step 5.5: Set up environment variables in .env.local
  console.log('🔧 Setting essential environment variables in .env.local...');

  // Set basic Next.js environment variables
  await setEnvironmentVariable(sshConnection, config.repoPath, 'PORT', port.toString());
  await setEnvironmentVariable(sshConnection, config.repoPath, 'HOST', '0.0.0.0');
  await setEnvironmentVariable(sshConnection, config.repoPath, 'NODE_ENV', 'development');

  // Set the essential Convex URL that Next.js needs to connect
  if (convexUrl) {
    await setEnvironmentVariable(sshConnection, config.repoPath, 'NEXT_PUBLIC_CONVEX_URL', convexUrl);
  }

  // Note: JWT_PRIVATE_KEY and JWKS are managed in Convex cloud, not locally
  console.log('✅ Essential environment variables set in .env.local');

  // Step 6: Setup and start PM2 (both Next.js and Convex dev servers)
  await setupPM2Process(sshConnection, {
    repoPath: config.repoPath,
    port,
    domain: config.domain,
    convexUrl,
    convexDeployment: convexDeploymentIdentifier,
    convexDeployKey,
    jwtPrivateKey: jwtKeys.jwtPrivateKey,
    jwks: jwtKeys.jwks
  });

  const httpUrl = `http://${sshConnection.ip}:${port}`;

  console.log('ℹ️ WebSocket configuration will be applied when SSL is set up');
  console.log(`🌐 Server: ${httpUrl}`);
  console.log(`🔒 HTTPS: ${httpsUrl}`);
  if (convexUrl) {
    console.log(`📊 Convex URL: ${convexUrl}`);
  }

  return { httpUrl, httpsUrl, convexUrl, convexDevUrl, convexProjectId, convexDeployKey, convexDeploymentIdentifier };
}
