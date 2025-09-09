"use node";

import { SSHConnection } from "@/convex/githubAccount/application/machine/action/services/create";

import { configureNginxSite } from "@/convex/githubAccount/application/machine/action/services/create/ssl/siteConfig";

import { configureWebSocket } from "@/convex/githubAccount/application/machine/action/services/create/ssl/websocket";

interface SSLConfig {
  domain: string;
  repoDir?: string;
}

export async function setupSSL(
  sshConnection: SSHConnection,
  config: SSLConfig
): Promise<{ domain: string; certPath?: string }> {
  console.log(`🔒 Setting up SSL certificate for ${config.domain}`);

  const email = "admin@dokimint.com";
  const port = 3000;

  // Check DNS resolution
  console.log('🌐 Checking DNS resolution...');
  const dnsCheck = await sshConnection.ssh.execCommand(`nslookup ${config.domain}`);
  if (dnsCheck.code !== 0) {
    throw new Error(`DNS resolution failed for ${config.domain}`);
  }

  console.log('📦 Installing certbot and nginx...');
  await sshConnection.ssh.execCommand('sudo apt update && sudo apt install -y certbot nginx');
  console.log('✅ SSL tools installed');

  // Wait for domain DNS propagation
  console.log('⏳ Waiting for DNS propagation (10 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  // Stop nginx to free port 80 for certbot
  await sshConnection.ssh.execCommand(`sudo systemctl stop nginx || true`);

  // Run certbot to obtain SSL certificate
  console.log(`🔐 Obtaining SSL certificate for ${config.domain}...`);
  const certbotCommand = `sudo certbot certonly --standalone -d ${config.domain} --non-interactive --agree-tos --email ${email}`;
  const certResult = await sshConnection.ssh.execCommand(certbotCommand);

  if (certResult.code !== 0) {
    console.log(`❌ Certbot failed: ${certResult.stderr}`);
    throw new Error(`Failed to obtain SSL certificate for ${config.domain}`);
  }

  // Start nginx
  await sshConnection.ssh.execCommand(`sudo systemctl start nginx || true`);

  if (certResult.code === 0) {
    console.log('✅ SSL certificate obtained successfully');
    const finalCertPath = `/etc/letsencrypt/live/${config.domain}`;
    console.log('🔒 Updating nginx configuration to include HTTPS...');
    await configureNginxSite(sshConnection, config.domain, finalCertPath, port);
    await sshConnection.ssh.execCommand(`sudo systemctl restart nginx`);
    const repoDirFinal = config.repoDir || "claude_repo";
    await sshConnection.ssh.execCommand(`cd /home/${sshConnection.sshUser}/${repoDirFinal} && pm2 restart dev-server || true`);
    await configureWebSocket(sshConnection, config.domain);
    console.log('✅ HTTPS and WebSocket configuration completed');
    return { domain: config.domain, certPath: finalCertPath };
  } else {
    console.log('❌ SSL certificate generation failed');
    throw new Error(`Failed to obtain SSL certificate for ${config.domain}`);
  }
}


