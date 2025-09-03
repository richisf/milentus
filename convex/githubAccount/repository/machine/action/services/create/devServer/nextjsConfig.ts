"use node";

import { MachineState } from "@/convex/githubAccount/repository/machine/action/services/create";

export async function ensureNextConfig(machineState: MachineState, repoPath: string): Promise<void> {
  console.log('🔧 Configuring Next.js...');

  const escapedRepoPath = repoPath.replace(/'/g, "\\'");

  const nextConfigExists = await machineState.ssh.execCommand(
    `cd '${escapedRepoPath}' && test -f next.config.js && echo "EXISTS" || echo "NOT_EXISTS"`
  );

  if (nextConfigExists.stdout.trim() === "NOT_EXISTS") {
    console.log('📄 Creating next.config.js...');

    const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  webpackDevMiddleware: config => {
    config.watchOptions = {
      poll: 50,
      aggregateTimeout: 10,
    };
    return config;
  },
  experimental: {
    turbo: {
      rules: {
        '*.ts': ['raw-loader'],
        '*.tsx': ['raw-loader'],
      },
    },
  },
};

module.exports = nextConfig;`;

    // Write next.config.js using base64 to avoid shell escaping issues
    const nextConfigBase64 = Buffer.from(nextConfigContent).toString('base64');
    const nextConfigResult = await machineState.ssh.execCommand(
      `cd '${escapedRepoPath}' && echo '${nextConfigBase64}' | base64 -d > next.config.js`
    );

    if (nextConfigResult.code !== 0) {
      console.log('⚠️ Failed to create next.config.js, continuing anyway...');
    } else {
      console.log('✅ Created next.config.js');
    }
  }
}
