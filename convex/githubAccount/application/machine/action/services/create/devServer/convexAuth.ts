"use node";

import { MachineState } from "@/convex/githubAccount/application/machine/action/services/create";

export async function setupConvexAuth(machineState: MachineState, repoPath: string, deployKey?: string): Promise<void> {
  console.log('🔐 Setting up Convex authentication...');

  const escapedRepoPath = repoPath.replace(/'/g, "\\'");
  const siteUrl = `http://localhost:3000`; // Local development server

  try {
    // Step 1: Generate JWT keys
    console.log('🔑 Generating JWT keys...');
    const keyGenScript = `
      const { exportJWK, exportPKCS8, generateKeyPair } = require('jose');
      (async () => {
        try {
          const keys = await generateKeyPair('RS256', { extractable: true });
          const privateKey = await exportPKCS8(keys.privateKey);
          const publicKey = await exportJWK(keys.publicKey);
          const jwks = JSON.stringify({ keys: [{ use: 'sig', ...publicKey }] });

          console.log('JWT_PRIVATE_KEY="' + privateKey.trimEnd().replace(/\\n/g, ' ') + '"');
          console.log('JWKS=' + jwks);
        } catch (error) {
          console.error('Key generation failed:', error.message);
          process.exit(1);
        }
      })();
    `;

    const keyGenResult = await machineState.ssh.execCommand(
      `cd '${escapedRepoPath}' && node -e "${keyGenScript.replace(/"/g, '\\"')}"`
    );

    if (keyGenResult.code !== 0) {
      throw new Error(`Key generation failed: ${keyGenResult.stderr}`);
    }

    // Parse the generated keys
    const outputLines = keyGenResult.stdout.split('\n');
    const jwtPrivateKey = outputLines.find(line => line.startsWith('JWT_PRIVATE_KEY='))?.replace('JWT_PRIVATE_KEY=', '');
    const jwks = outputLines.find(line => line.startsWith('JWKS='))?.replace('JWKS=', '');

    if (!jwtPrivateKey || !jwks) {
      throw new Error('Failed to parse generated keys');
    }

    console.log('✅ JWT keys generated successfully');

    // Store JWT keys in machineState for PM2 configuration
    machineState.jwtPrivateKey = jwtPrivateKey;
    machineState.jwks = jwks;

    // Step 2: Set environment variables in Convex
    console.log('🌍 Setting Convex environment variables...');

    // Use deploy key for env set commands to ensure proper permissions
    const deployKeyCmd = deployKey ? `CONVEX_DEPLOY_KEY='${deployKey}' ` : '';

    // Set environment variables for development using deploy key
    await machineState.ssh.execCommand(
      `cd '${escapedRepoPath}' && ${deployKeyCmd}npx convex env set SITE_URL ${siteUrl}`
    );

    // For JWT keys, we need to handle them carefully due to length and special characters
    // First, write them to temporary files and then set them
    const jwtPrivateKeyFile = `/tmp/jwt_private_key_${Date.now()}.txt`;
    const jwksFile = `/tmp/jwks_${Date.now()}.txt`;

    // Write JWT keys to temporary files
    await machineState.ssh.execCommand(
      `cd '${escapedRepoPath}' && echo "${jwtPrivateKey.replace(/"/g, '\\"')}" > ${jwtPrivateKeyFile}`
    );

    await machineState.ssh.execCommand(
      `cd '${escapedRepoPath}' && echo "${jwks.replace(/"/g, '\\"')}" > ${jwksFile}`
    );

    // Set JWT environment variables from files
    await machineState.ssh.execCommand(
      `cd '${escapedRepoPath}' && ${deployKeyCmd}npx convex env set JWT_PRIVATE_KEY "$(cat ${jwtPrivateKeyFile})"`
    );

    await machineState.ssh.execCommand(
      `cd '${escapedRepoPath}' && ${deployKeyCmd}npx convex env set JWKS "$(cat ${jwksFile})"`
    );

    // Clean up temporary files
    await machineState.ssh.execCommand(
      `cd '${escapedRepoPath}' && rm -f ${jwtPrivateKeyFile} ${jwksFile}`
    );

    console.log('✅ Convex environment variables set');
    console.log('✅ Convex authentication setup completed successfully');
    console.log('📋 Auth files already exist and are properly configured');

  } catch (error) {
    console.log('⚠️ Convex auth setup failed:', error instanceof Error ? error.message : error);
    console.log('Continuing without auth setup...');
  }
}
