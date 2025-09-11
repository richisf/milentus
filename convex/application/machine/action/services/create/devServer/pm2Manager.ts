"use node";

import { SSHConnection } from "@/convex/application/machine/action/services/create";

export interface PM2Config {
  repoPath: string;
  port: number;
  domain?: string;
  convexUrl?: string;
  convexDeployment?: string;
  convexDeployKey?: string;
  jwtPrivateKey?: string;
  jwks?: string;
}

export async function setupPM2Process(sshConnection: SSHConnection, config: PM2Config): Promise<void> {
  const { repoPath, port, domain, convexUrl, convexDeployment, convexDeployKey, jwtPrivateKey, jwks } = config;
  const escapedRepoPath = repoPath.replace(/'/g, "\\'");

  // Stop existing servers
  console.log('🔄 Stopping any existing dev servers...');
  await sshConnection.ssh.execCommand(
    `cd '${escapedRepoPath}' && pm2 delete next-dev-server convex-dev-server || true`
  );
  await sshConnection.ssh.execCommand(`sudo fuser -k ${port}/tcp || true`);

  // Fix file permissions
  console.log('🔧 Fixing file permissions...');
  await sshConnection.ssh.execCommand(
    `cd '${escapedRepoPath}' && chmod -R 755 .`
  );

  // Create PM2 config with both Next.js and Convex dev servers
  const pm2Config = {
    apps: [
      {
        name: "next-dev-server",
        script: "npm",
        args: ["run", "dev:stable"],
        cwd: repoPath,
        env: {
          PORT: port.toString(),
          HOST: "0.0.0.0",
          NODE_ENV: "development",
          NODE_OPTIONS: "--max-old-space-size=3072",
          NEXT_PUBLIC_CONVEX_URL: convexUrl || "http://localhost:3210", // Use production Convex URL or fallback to local dev server
          WATCHPACK_POLLING: "true",
          CHOKIDAR_USEPOLLING: "true",
          CHOKIDAR_INTERVAL: "10",
          CHOKIDAR_POLLING_INTERVAL: "10",
          NEXT_WEBPACK_USEPOLLING: "true",
          NEXT_WEBPACK_POLLING_INTERVAL: "10",
          WATCHPACK_IGNORE: "node_modules/**,.git/**,.next/**,*.log,convex/_generated/**",
          FS_POLLING_INTERVAL: "10",
          NEXT_HMR_POLLING_INTERVAL: "10",
          NEXT_HMR_PING_INTERVAL: "100",
          NEXT_HMR_PING_TIMEOUT: "500",
          HTTPS: "true",
          NEXT_TELEMETRY_DISABLED: "1",
          FAST_REFRESH: "true",
          HMR_CLIENT_PORT: "443",
          HMR_CLIENT_PROTOCOL: "wss",
          CHOKIDAR_ATOMIC_MOVES: "false",
          CHOKIDAR_IGNORE_INITIAL: "false",
          CHOKIDAR_AWAIT_WRITE_FINISH: "false",
          CHOKIDAR_IGNORE_PERMISSION_ERRORS: "true",
          WATCHPACK_FOLLOW_SYMLINKS: "true",
          WEBPACK_WATCH_OPTIONS_POLL: "10",
          WEBPACK_WATCH_OPTIONS_AGGREGATE_TIMEOUT: "10",
          WDS_SOCKET_HOST: domain || "localhost",
          WDS_SOCKET_PORT: "443",
          WDS_SOCKET_PATH: "/_next/webpack-hmr",
          NEXT_PUBLIC_WS_HOST: domain || "localhost",
          NEXT_PUBLIC_WS_PORT: "443",
          NEXT_PUBLIC_WS_PROTOCOL: "wss",
          DANGEROUSLY_DISABLE_HOST_CHECK: "true",
          NEXT_WEBPACK_USE_CLIENT_WS_URL: "true"
        },
        max_memory_restart: "6144M",
        restart_delay: 5000,
        max_restarts: 3,
        min_uptime: "30s",
        instances: 1,
        exec_mode: "fork",
        kill_timeout: 5000,
        listen_timeout: 10000,
        autorestart: true,
        ignore_watch: [
          "node_modules", ".git", ".next/cache", ".next/trace",
          ".next/server", ".next/static", "*.log", ".DS_Store",
          "Thumbs.db", "*.swp", "*.swo", "*~"
        ],
        error_file: "/tmp/next-dev-server-error.log",
        out_file: "/tmp/next-dev-server-out.log",
        merge_logs: true,
        time: true,
        health_check_grace_period: 15000,
        exp_backoff_restart_delay: 1000,
        watch: false
      },
      {
        name: "convex-dev-server",
        script: "bash",
        args: ["-c", convexDeployKey ? `CONVEX_DEPLOY_KEY='${convexDeployKey}' npx convex dev` : `npx convex dev`],
        cwd: repoPath,
        env: {
          NODE_ENV: "development",
          CONVEX_DEPLOYMENT: convexDeployment || "dev:default",
          CONVEX_URL: convexUrl || `http://localhost:3210`,
          JWT_PRIVATE_KEY: jwtPrivateKey || "",
          JWKS: jwks || "",
          HOME: process.env.HOME || "/home/ubuntu"
        },
        max_memory_restart: "2048M",
        restart_delay: 3000,
        max_restarts: 5,
        min_uptime: "10s",
        instances: 1,
        exec_mode: "fork",
        kill_timeout: 3000,
        listen_timeout: 15000,
        autorestart: true,
        ignore_watch: [
          "node_modules", ".git", ".next", "*.log"
        ],
        error_file: "/tmp/convex-dev-server-error.log",
        out_file: "/tmp/convex-dev-server-out.log",
        merge_logs: true,
        time: true,
        health_check_grace_period: 10000,
        exp_backoff_restart_delay: 1000,
        watch: false // Let Convex handle its own file watching
      }
    ]
  };

  // Write PM2 config using base64 to avoid shell escaping issues
  console.log('🚀 Starting Next.js and Convex dev servers with PM2...');
  const configJson = JSON.stringify(pm2Config, null, 2);
  const configBase64 = Buffer.from(configJson).toString('base64');

  await sshConnection.ssh.execCommand(
    `cd '${escapedRepoPath}' && echo '${configBase64}' | base64 -d > ecosystem.config.json`
  );

  // Start PM2 process
  const startResult = await sshConnection.ssh.execCommand(
    `cd '${escapedRepoPath}' && pm2 start ecosystem.config.json`
  );
  console.log('PM2 start result:', startResult.stdout);

  // Wait for startup and verify
  console.log('🔍 Waiting for Next.js and Convex dev servers to start...');
  await new Promise(resolve => setTimeout(resolve, 15000)); // Give more time for both servers

  const statusResult = await sshConnection.ssh.execCommand(`cd '${escapedRepoPath}' && pm2 status`);
  console.log('PM2 status:', statusResult.stdout);

  // Check if both processes are running
  const statusOutput = statusResult.stdout;
  const nextServerRunning = statusOutput.includes('next-dev-server') && statusOutput.includes('online');
  const convexServerRunning = statusOutput.includes('convex-dev-server') && statusOutput.includes('online');

  if (!nextServerRunning || !convexServerRunning) {
    console.log('⚠️ Server status check:');
    console.log(`  Next.js server: ${nextServerRunning ? '✅ Running' : '❌ Not running'}`);
    console.log(`  Convex server: ${convexServerRunning ? '✅ Running' : '❌ Not running'}`);
    throw new Error('One or more dev servers failed to start. Check PM2 logs for details.');
  }

  console.log('✅ Both Next.js and Convex dev servers are running successfully');
}
