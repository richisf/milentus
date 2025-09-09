"use node";

import { SSHConnection } from "@/convex/githubAccount/application/machine/action/services/create"; 

export async function setEnvironmentVariable(
  sshConnection: SSHConnection,
  repoPath: string,
  key: string,
  value: string
): Promise<void> {
  console.log(`🔧 Setting ${key} in .env.local...`);

  const escapedRepoPath = repoPath.replace(/'/g, "\\'");
  const escapedValue = value.replace(/'/g, "\\'");

  // Use a more robust approach - read, modify, and write back .env.local
  console.log('🔧 Reading current .env.local content...');
  const readResult = await sshConnection.ssh.execCommand(
    `cd '${escapedRepoPath}' && cat .env.local 2>/dev/null || echo ""`
  );

  const existingContent = readResult.stdout;
  const lines = existingContent.split('\n').filter(line => line.trim() !== '');

  // Update or add the key-value pair
  let found = false;
  const updatedLines = lines.map((line: string) => {
    if (line.startsWith(`${key}=`)) {
      found = true;
      return `${key}=${escapedValue}`;
    }
    return line;
  });

  if (!found) {
    updatedLines.push(`${key}=${escapedValue}`);
  }

  // Write back using base64 to avoid shell escaping issues
  const newContent = updatedLines.join('\n') + '\n';
  const contentBase64 = Buffer.from(newContent).toString('base64');
  await sshConnection.ssh.execCommand(
    `cd '${escapedRepoPath}' && echo '${contentBase64}' | base64 -d > .env.local`
  );

  console.log(`✅ ${key} set in .env.local`);
}
