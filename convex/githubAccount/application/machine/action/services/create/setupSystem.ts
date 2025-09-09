"use node";

import { SSHConnection } from "@/convex/githubAccount/application/machine/action/services/create";

export async function setupSystem(sshConnection: SSHConnection): Promise<void> {
  console.log('🚀 Starting complete system setup...');

  try {
    // Step 1: Prepare system (updates + basic dependencies)
    console.log('📦 Updating system...');
    await sshConnection.ssh.execCommand(`
      sudo rm -rf /var/lib/apt/lists/* && \
      sudo apt-get clean && \
      sudo apt-get update -y && \
      sudo apt-get upgrade -y
    `);
    console.log('✅ System updated');

    console.log('📦 Installing basic dependencies...');
    await sshConnection.ssh.execCommand(`
      sudo apt-get install -y curl git python3 python3-pip build-essential netcat-openbsd
    `);
    console.log('✅ Basic dependencies installed');

    // Step 2: Install Node.js
    console.log('📥 Installing Node.js...');
    await sshConnection.ssh.execCommand(`
      curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash - && \
      sudo apt-get install -y nodejs
    `);
    console.log('✅ Node.js installed');

    // Verify Node.js installation
    console.log('🔍 Verifying Node.js installation...');
    const nodeVerify = await sshConnection.ssh.execCommand('which node && node --version && which npm && npm --version');
    if (nodeVerify.code !== 0) {
      throw new Error(`Node.js verification failed: ${nodeVerify.stderr}`);
    }
    console.log('✅ Node.js verification passed');

    // Step 3: Optimize system settings
    console.log('⚡ Optimizing system settings for Node.js...');
    await sshConnection.ssh.execCommand(`
      echo 'net.core.somaxconn=65535' | sudo tee -a /etc/sysctl.conf && \
      sudo sysctl -p
    `);
    console.log('✅ System optimized for Node.js stability');

    // Step 4: Install PM2
    console.log('⚡ Installing PM2...');
    await sshConnection.ssh.execCommand(`sudo npm install -g pm2 --force`);
    console.log('✅ PM2 installed');

    // Step 5: Setup Claude Code workspace and environment
    console.log('🤖 Setting up Claude Code workspace...');
    const sshUser = sshConnection.sshUser;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? '';

    try {
      await sshConnection.ssh.execCommand(`
        mkdir -p /home/${sshUser}/claude_workspace && \
        cd /home/${sshUser}/claude_workspace && \
        npm init -y && \
        npm install @anthropic-ai/claude-code --save
      `);
      console.log('✅ Claude Code workspace prepared');

      // Setup Claude environment with API key
      if (anthropicApiKey) {
        await sshConnection.ssh.execCommand(`
          echo 'export ANTHROPIC_API_KEY="${anthropicApiKey}"' | sudo tee /home/${sshUser}/anthropic.env && \
          sudo chown ${sshUser}:${sshUser} /home/${sshUser}/anthropic.env && \
          sudo chmod 600 /home/${sshUser}/anthropic.env
        `);
        console.log('✅ Claude API key configured');
      } else {
        console.log('⚠️ No ANTHROPIC_API_KEY found - Claude will need manual setup');
      }
    } catch (error) {
      console.log('⚠️ Claude Code setup failed, continuing without it:', error instanceof Error ? error.message : error);
    }

    console.log('✅ System setup completed successfully');

  } catch (error) {
    console.error('❌ System setup failed:', error);
    throw new Error(`System setup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}


