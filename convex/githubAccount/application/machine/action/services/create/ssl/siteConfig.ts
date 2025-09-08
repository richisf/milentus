"use node";

import { MachineState } from "@/convex/githubAccount/application/machine/action/services/create";

export async function configureNginxSite(machineState: MachineState, domain: string, certPath: string, port: number): Promise<void> {
  // Clean up any existing nginx configurations for this domain
  console.log(`🗳️ Cleaning up any existing nginx configurations for ${domain}...`);
  await machineState.ssh.execCommand(`sudo rm -f /etc/nginx/sites-enabled/${domain} || true`);
  await machineState.ssh.execCommand(`sudo rm -f /etc/nginx/sites-available/${domain} || true`);

  // Create HTTPS configuration
  const httpsConfig = `
server {
      listen 80;
      server_name ${domain};

      location /.well-known/acme-challenge/ {
          root /var/www/html;
      }

      location / {
          return 301 https://\$server_name\$request_uri;
      }
  }

  server {
      listen 443 ssl;
      server_name ${domain};

      ssl_certificate ${certPath}/fullchain.pem;
      ssl_certificate_key ${certPath}/privkey.pem;

      # Next.js HMR WebSocket proxy - handles hot reload connections
      location /_next/webpack-hmr {
          proxy_pass http://127.0.0.1:${port}/_next/webpack-hmr;
          proxy_http_version 1.1;

          # Essential WebSocket upgrade headers
          proxy_set_header Upgrade \$http_upgrade;
          proxy_set_header Connection "upgrade";

          # Required headers for Next.js WebSocket
          proxy_set_header Host \$host;
          proxy_set_header X-Real-IP \$remote_addr;
          proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto \$scheme;
          proxy_set_header X-Forwarded-Host \$host;
          proxy_set_header X-Forwarded-Port 443;

          # Critical: Accept all origins for WebSocket
          proxy_set_header Origin http://127.0.0.1:${port};

          # WebSocket-specific settings
          proxy_buffering off;
          proxy_cache off;
          proxy_redirect off;

          # Timeouts for long-lived connections
          proxy_connect_timeout 86400s;
          proxy_send_timeout 86400s;
          proxy_read_timeout 86400s;

          # Ensure headers are passed correctly
          proxy_pass_request_headers on;

          # Debugging logs
          access_log /var/log/nginx/hmr_access.log;
          error_log /var/log/nginx/hmr_error.log debug;
      }

      # Handle Next.js hot-update files
      location ~* ^/_next/static/.*\.hot-update\..*$ {
          proxy_pass http://127.0.0.1:${port};
          proxy_http_version 1.1;
          proxy_set_header Host \$host;
          proxy_set_header X-Forwarded-Proto \$scheme;
          proxy_set_header X-Forwarded-Host \$host;
          proxy_set_header X-Forwarded-Port 443;
      }

      location / {
          proxy_pass http://127.0.0.1:${port};
          proxy_http_version 1.1;

          # WebSocket upgrade headers
          proxy_set_header Upgrade \$http_upgrade;
          proxy_set_header Connection "upgrade";

          # Standard proxy headers
          proxy_set_header Host \$host;
          proxy_set_header X-Real-IP \$remote_addr;
          proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto \$scheme;
          proxy_set_header X-Forwarded-Host \$host;
          proxy_set_header X-Forwarded-Port 443;
          proxy_cache_bypass \$http_upgrade;

          # Timeout settings
          proxy_connect_timeout 60s;
          proxy_send_timeout 60s;
          proxy_read_timeout 60s;

          # Buffer settings
          proxy_buffering off;
          proxy_request_buffering off;
      }
  }`;

  // Write the configuration using base64 to avoid shell escaping issues
  const configBase64 = Buffer.from(httpsConfig).toString('base64');
  await machineState.ssh.execCommand(
    `echo '${configBase64}' | base64 -d | sudo tee /etc/nginx/sites-available/${domain}`
  );

  // Enable the site
  await machineState.ssh.execCommand(
    `sudo ln -sf /etc/nginx/sites-available/${domain} /etc/nginx/sites-enabled/`
  );

  // Remove default site if it exists
  await machineState.ssh.execCommand(`sudo rm -f /etc/nginx/sites-enabled/default`);
}
