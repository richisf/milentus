"use node";

import { MachineState } from "@/convex/githubAccount/repository/machine/action/services/create"; 

export async function setupDevStableScript(
  machineState: MachineState,
  repoPath: string,
  port: number
): Promise<void> {
  console.log('🔧 Setting up dev:stable script...');

  const scriptContent = `WATCHPACK_POLLING=true CHOKIDAR_USEPOLLING=true CHOKIDAR_INTERVAL=50 NEXT_WEBPACK_USEPOLLING=true NEXT_WEBPACK_POLLING_INTERVAL=50 NEXT_HMR_POLLING_INTERVAL=50 NEXT_HMR_PING_INTERVAL=250 NEXT_HMR_PING_TIMEOUT=1000 next dev --port ${port} --hostname 0.0.0.0`;

  // Simple Node.js script to add/update the dev:stable script
  const setupScript = `
    const fs = require('fs');
    const path = require('path');
    const pkgPath = path.join(process.cwd(), 'package.json');

    if (!fs.existsSync(pkgPath)) {
      console.error('package.json not found');
      process.exit(1);
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (!pkg.scripts) pkg.scripts = {};
    pkg.scripts['dev:stable'] = "${scriptContent.replace(/"/g, '\\"')}";
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log('✅ dev:stable script configured');
  `;

  const escapedRepoPath = repoPath.replace(/'/g, "\\'");

  const scriptResult = await machineState.ssh.execCommand(
    `cd '${escapedRepoPath}' && node -e "${setupScript.replace(/"/g, '\\"')}"`
  );

  if (scriptResult.code !== 0) {
    throw new Error(`Failed to configure dev:stable script: ${scriptResult.stderr || scriptResult.stdout}`);
  }
}
