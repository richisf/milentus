"use node";

import { MachineState } from "@/convex/githubAccount/repository/machine/action/services/create";

import { configureNginxSite } from "@/convex/githubAccount/repository/machine/action/services/create/ssl/siteConfig";

import { configureWebSocket } from "@/convex/githubAccount/repository/machine/action/services/create/ssl/websocket";

export async function setupSSL(
  machineState: MachineState,
  domain: string,
  repoDir?: string
): Promise<{ domain: string; certPath?: string }> {
  console.log(`🔒 Setting up SSL certificate for ${domain}`);

  const email = "admin@dokimint.com";
  const port = 3000;

  console.log('📦 Installing certbot and nginx...');
  await machineState.ssh.execCommand('sudo apt update && sudo apt install -y certbot nginx');
  console.log('✅ SSL tools installed');

  await machineState.ssh.execCommand(`sudo systemctl stop nginx || true`);

  const certResult = await machineState.ssh.execCommand(
    `sudo certbot certonly --standalone -d ${domain} --non-interactive --agree-tos --email ${email}`
  );

  await machineState.ssh.execCommand(`sudo systemctl start nginx || true`);

  if (certResult.code === 0) {
    console.log('✅ SSL certificate obtained successfully');
    const finalCertPath = `/etc/letsencrypt/live/${domain}`;
    console.log('🔒 Updating nginx configuration to include HTTPS...');
    await configureNginxSite(machineState, domain, finalCertPath, port);
    await machineState.ssh.execCommand(`sudo systemctl restart nginx`);
    const repoDirFinal = repoDir || "claude_repo";
    await machineState.ssh.execCommand(`cd /home/${machineState.sshUser}/${repoDirFinal} && pm2 restart dev-server || true`);
    await configureWebSocket(machineState, domain);
    console.log('✅ HTTPS and WebSocket configuration completed');
    return { domain, certPath: finalCertPath };
  } else {
    console.log('❌ SSL certificate generation failed');
    throw new Error(`Failed to obtain SSL certificate for ${domain}`);
  }
}


