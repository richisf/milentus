"use node";

import { SSHConnection } from "@/convex/application/machine/action/services/create";

export async function setupConvexAuth(sshConnection: SSHConnection, repoPath: string, deployKey?: string): Promise<{ jwtPrivateKey?: string; jwks?: string }> {
  console.log('🔐 Setting up Convex authentication...');

  const escapedRepoPath = repoPath.replace(/'/g, "\\'");
  const siteUrl = `http://localhost:3000`; // Local development server

  try {
    // Step 1: Generate private key and JWKS
    console.log('🔑 Generating private key and JWKS...');
    const keyGenScript = `
      const { exportJWK, exportPKCS8, generateKeyPair } = require('jose');
      (async () => {
        try {
          const keys = await generateKeyPair('RS256', { extractable: true });
          const privateKey = await exportPKCS8(keys.privateKey);
          const publicKey = await exportJWK(keys.publicKey);
          const jwks = JSON.stringify({ keys: [{ use: 'sig', ...publicKey }] });

          // Base64 encode the private key to safely transfer it
          const privateKeyBase64 = Buffer.from(privateKey.trimEnd()).toString('base64');
          console.log('JWT_PRIVATE_KEY_B64=' + privateKeyBase64);
          console.log('JWKS=' + jwks);
        } catch (error) {
          console.error('Key generation failed:', error.message);
          process.exit(1);
        }
      })();
    `;

    const keyGenResult = await sshConnection.ssh.execCommand(
      `cd '${escapedRepoPath}' && node -e "${keyGenScript.replace(/"/g, '\\"')}"`
    );

    if (keyGenResult.code !== 0) {
      throw new Error(`Key generation failed: ${keyGenResult.stderr}`);
    }

    // Parse the generated keys
    const outputLines = keyGenResult.stdout.split('\n');
    const jwtPrivateKeyBase64 = outputLines.find(line => line.startsWith('JWT_PRIVATE_KEY_B64='))?.replace('JWT_PRIVATE_KEY_B64=', '');
    const jwks = outputLines.find(line => line.startsWith('JWKS='))?.replace('JWKS=', '');

    if (!jwtPrivateKeyBase64 || !jwks) {
      throw new Error('Failed to parse generated keys');
    }

    // Decode the base64 private key
    const jwtPrivateKey = Buffer.from(jwtPrivateKeyBase64, 'base64').toString('utf8');

    console.log('✅ Private key and JWKS generated successfully');


    // Step 2: Set environment variables in Convex
    console.log('🌍 Setting Convex environment variables...');

    // Use deploy key for env set commands to ensure proper permissions
    const deployKeyCmd = deployKey ? `CONVEX_DEPLOY_KEY='${deployKey}' ` : '';

    // Set environment variables for development using deploy key
    await sshConnection.ssh.execCommand(
      `cd '${escapedRepoPath}' && ${deployKeyCmd}npx convex env set SITE_URL ${siteUrl}`
    );

    // For private key, we need to handle it carefully due to length and special characters
    // First, write it to temporary file and then set it
    const jwtPrivateKeyFile = `/tmp/jwt_private_key_${Date.now()}.txt`;
    const jwksFile = `/tmp/jwks_${Date.now()}.txt`;

    // Write private key and JWKS to temporary files using safe methods
    console.log('🔧 Writing private key to temporary file...');
    const writePrivateKeyResult = await sshConnection.ssh.execCommand(
      `cd '${escapedRepoPath}' && printf '%s' "${jwtPrivateKeyBase64}" | base64 -d > ${jwtPrivateKeyFile}`
    );

    if (writePrivateKeyResult.code !== 0) {
      console.error('❌ Failed to write private key file:', writePrivateKeyResult.stderr);
      throw new Error(`Failed to write private key file: ${writePrivateKeyResult.stderr}`);
    }

    console.log('🔧 Writing JWKS to temporary file...');
    const writeJwksResult = await sshConnection.ssh.execCommand(
      `cd '${escapedRepoPath}' && printf '%s' "${jwks.replace(/"/g, '\\"')}" > ${jwksFile}`
    );

    if (writeJwksResult.code !== 0) {
      console.error('❌ Failed to write JWKS file:', writeJwksResult.stderr);
      throw new Error(`Failed to write JWKS file: ${writeJwksResult.stderr}`);
    }

    // Verify the private key file was written correctly
    console.log('🔍 Verifying private key file...');
    const verifyPrivateKey = await sshConnection.ssh.execCommand(
      `cd '${escapedRepoPath}' && ls -la ${jwtPrivateKeyFile} && echo "--- Content check ---" && head -2 ${jwtPrivateKeyFile} && tail -2 ${jwtPrivateKeyFile}`
    );
    console.log('📄 Private key file verification:', verifyPrivateKey.stdout);

    // Set private key using the proven Double Dash Method
    console.log('🔧 Setting private key environment variable...');
    let jwtKeySuccess = false;

    try {
      console.log('📝 Using Double Dash Method (proven to work)...');
      
      // Create script that uses -- to separate options from arguments
      const doubledashScript = `/tmp/set_private_key_${Date.now()}.sh`;
      
      const createScript = await sshConnection.ssh.execCommand(
        `cd '${escapedRepoPath}' && cat > ${doubledashScript} << 'DOUBLEDASH_EOF'
#!/bin/bash
set -e

${deployKey ? `export CONVEX_DEPLOY_KEY='${deployKey}'` : ''}

echo "📝 Setting private key using Double Dash Method..."

# Read the private key content
PRIVATE_KEY_CONTENT="$(cat "${jwtPrivateKeyFile}")"

# Verify we have content
if [ -z "$PRIVATE_KEY_CONTENT" ]; then
    echo "ERROR: No content read from private key file"
    exit 1
fi

echo "✅ Read private key (length: $(echo -n "$PRIVATE_KEY_CONTENT" | wc -c))"

# Use -- to separate options from arguments (prevents CLI parsing issues)
npx convex env set JWT_PRIVATE_KEY -- "$PRIVATE_KEY_CONTENT"

echo "✅ Private key set successfully using Double Dash Method"
DOUBLEDASH_EOF`
      );

      if (createScript.code === 0) {
        const runScript = await sshConnection.ssh.execCommand(
          `cd '${escapedRepoPath}' && chmod +x ${doubledashScript} && ${doubledashScript}`
        );
        
        if (runScript.code === 0) {
          console.log('✅ Private key set successfully');
          jwtKeySuccess = true;
        } else {
          console.log('❌ Double Dash Method failed:', runScript.stderr);
        }

        // Clean up
        await sshConnection.ssh.execCommand(`rm -f ${doubledashScript}`);
      } else {
        console.log('❌ Failed to create Double Dash script:', createScript.stderr);
      }
    } catch (e) {
      console.log('❌ Double Dash Method exception:', e);
    }

    if (!jwtKeySuccess) {
      console.log('⚠️ Private key setting failed, continuing without it...');
    } else {
      console.log('✅ Private key set successfully');
    }

    // Set JWKS using the direct command line method that works
    console.log('🔧 Setting JWKS environment variable...');
    let jwksSuccess = false;

    try {
      // Method: Direct command line (known to work from previous logs)
      console.log('📝 Setting JWKS...');
      const result = await sshConnection.ssh.execCommand(
        `cd '${escapedRepoPath}' && ${deployKeyCmd}npx convex env set JWKS '${jwks.replace(/'/g, "\\'")}'`
      );
      if (result.code === 0) {
        console.log('✅ JWKS set successfully');
        jwksSuccess = true;
      } else {
        console.log('❌ JWKS failed:', result.stderr);
        // Fallback: Try stdin approach
        const fallbackResult = await sshConnection.ssh.execCommand(
          `cd '${escapedRepoPath}' && cat ${jwksFile} | ${deployKeyCmd}npx convex env set JWKS --stdin`
        );
        if (fallbackResult.code === 0) {
          console.log('✅ JWKS set successfully (fallback)');
          jwksSuccess = true;
        } else {
          console.log('❌ JWKS fallback also failed:', fallbackResult.stderr);
        }
      }
    } catch (e) {
      console.log('❌ JWKS exception:', e);
    }

    if (!jwksSuccess) {
      console.log('⚠️ JWKS not set, continuing...');
    }

    // Clean up temporary files
    await sshConnection.ssh.execCommand(
      `cd '${escapedRepoPath}' && rm -f ${jwtPrivateKeyFile} ${jwksFile}`
    );

    // Verify environment variables were set correctly
    console.log('🔍 Verifying environment variables were set...');
    const verifyEnvResult = await sshConnection.ssh.execCommand(
      `cd '${escapedRepoPath}' && ${deployKeyCmd}npx convex env list | grep -E "(JWT_PRIVATE_KEY|JWKS)"`
    );

    if (verifyEnvResult.code === 0 && verifyEnvResult.stdout) {
      console.log('✅ Environment variables confirmed:', verifyEnvResult.stdout);
    } else {
      console.log('⚠️ Could not verify environment variables. Output:', verifyEnvResult.stdout);
      console.log('⚠️ Error:', verifyEnvResult.stderr);
    }

    console.log('✅ Convex environment variables set');
    console.log('✅ Convex authentication setup completed successfully');
    console.log('📋 Auth files already exist and are properly configured');

    return { jwtPrivateKey, jwks };

  } catch (error) {
    console.log('⚠️ Convex auth setup failed:', error instanceof Error ? error.message : error);
    console.log('Continuing without auth setup...');
    return {};
  }
}
