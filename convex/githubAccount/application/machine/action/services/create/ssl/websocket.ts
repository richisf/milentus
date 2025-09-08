"use node";

import { MachineState } from "@/convex/githubAccount/application/machine/action/services/create";

export async function configureWebSocket(machineState: MachineState, domain: string): Promise<void> {
  console.log('🔧 Adding WebSocket upgrade map to nginx.conf...');
  const mapCheck = await machineState.ssh.execCommand(`grep -c "map.*http_upgrade.*connection_upgrade" /etc/nginx/nginx.conf || echo "0"`);
  if (parseInt(mapCheck.stdout.trim()) === 0) {
    // Use a simpler approach for the WebSocket map
    const mapConfig = `
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }`;
    await machineState.ssh.execCommand(
      `sudo sed -i '/http {/a\\${mapConfig.replace(/\n/g, '\\n').replace(/\$/g, '\\$')}' /etc/nginx/nginx.conf`
    );
    console.log('✅ WebSocket upgrade map added to nginx.conf');
  } else {
    console.log('✅ WebSocket upgrade map already exists in nginx.conf');
  }

  console.log('🔧 Applying additional WebSocket headers configuration...');
  const wsHeadersConfig = `
    # Additional WebSocket headers
    proxy_hide_header X-Frame-Options;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # CORS headers for WebSocket
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version" always;
  `;

  // Use a safer approach - read, modify, and write back the config file
  console.log('🔧 Reading current nginx configuration...');
  const readResult = await machineState.ssh.execCommand(
    `sudo cat /etc/nginx/sites-available/${domain}`
  );

  if (readResult.code === 0) {
    let configContent = readResult.stdout;

    // Insert WebSocket headers after the listen 443 ssl; line
    const insertPoint = 'listen 443 ssl;';
    if (configContent.includes(insertPoint) && !configContent.includes('proxy_hide_header X-Frame-Options')) {
      configContent = configContent.replace(
        insertPoint,
        insertPoint + '\n' + wsHeadersConfig.trim()
      );

      // Write back using base64 to avoid shell escaping
      const configBase64 = Buffer.from(configContent).toString('base64');
      await machineState.ssh.execCommand(
        `echo '${configBase64}' | base64 -d | sudo tee /etc/nginx/sites-available/${domain} > /dev/null`
      );
      console.log('✅ WebSocket headers added to nginx configuration');
    } else {
      console.log('ℹ️ WebSocket headers already present or listen directive not found');
    }
  }

  // Final nginx reload
  await machineState.ssh.execCommand(`sudo nginx -s reload`);
  console.log('✅ Applied additional WebSocket headers configuration');
}
