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

  console.log('📦 Installing certbot and nginx...');
  await sshConnection.ssh.execCommand('sudo apt update && sudo apt install -y certbot nginx');
  console.log('✅ SSL tools installed');

  await sshConnection.ssh.execCommand(`sudo systemctl stop nginx || true`);

  const certResult = await sshConnection.ssh.execCommand(
    `sudo certbot certonly --standalone -d ${config.domain} --non-interactive --agree-tos --email ${email}`
  );

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


