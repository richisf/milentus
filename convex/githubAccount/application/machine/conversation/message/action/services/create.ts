"use node";

import { NodeSSH } from 'node-ssh';
import { CLAUDE_SYSTEM_PROMPT } from './system';

export interface MachineDetails {
    _id: string;
    name: string;
    zone: string;
    applicationId: string;
    _creationTime: number;
    state: string;
    ipAddress?: string; // Dynamic IP from GCP (optional)
    domain?: string; // Generated domain (optional)
    convexUrl?: string; // Convex project URL (optional)
    convexProjectId?: number; // Convex project ID (optional)
}


export async function claude(
  machineDetails: MachineDetails,
  message: string,
  httpsUrl?: string,
  repositoryName?: string
): Promise<{ output: string; error?: string }> {
  const ssh = new NodeSSH();
  
  // Use HTTPS URL if provided, otherwise don't set a base URL
  const baseUrl = httpsUrl || undefined;
  
  console.log(`🔧 Using HTTPS endpoints for HMR: ${baseUrl}`);

  try {
    // Connect to VM using dynamic IP
    if (!machineDetails.ipAddress) {
      throw new Error('Machine IP address not available');
    }

    await ssh.connect({
      host: machineDetails.ipAddress, // Dynamic IP from database
      username: 'ubuntu',
      privateKey: process.env.GCP_SSH_PRIVATE_KEY,
      passphrase: process.env.GCP_SSH_KEY_PASSPHRASE,
      readyTimeout: 20000,
    });

    // Find repository - use the same naming pattern as create.ts
    const repoPath = `/home/ubuntu/${repositoryName}`;
    console.log(`🔍 Looking for repository at: ${repoPath}`);
    const repoCheck = await ssh.execCommand(`test -d "${repoPath}" && echo "EXISTS" || echo "NOT_EXISTS"`);
    if (!repoCheck.stdout.includes('EXISTS')) {
      console.error(`❌ Repository not found at ${repoPath}`);
      // List what directories exist in /home/ubuntu
      const listResult = await ssh.execCommand('ls -la /home/ubuntu/');
      console.log('📁 Available directories in /home/ubuntu:', listResult.stdout);
      throw new Error(`Repository not found at ${repoPath}. Check if repository was cloned successfully.`);
    }
        // Simple Claude script using system-wide Claude Code with enhanced configuration
        const claudeScript = `
        async function runClaude() {
            try {
            const { query } = await import('/home/ubuntu/claude_workspace/node_modules/@anthropic-ai/claude-code/sdk.mjs');

            for await (const msg of query({
                prompt: ${JSON.stringify(message)},
                options: {
                    maxTurns: 15,
                    permissionMode: 'acceptEdits',
                    model: 'claude-sonnet-4-20250514',
                    pathToClaudeCodeExecutable: '/home/ubuntu/claude_workspace/node_modules/@anthropic-ai/claude-code/cli.js',
                    allowedTools: ["Read", "Write", "Edit", "MultiEdit", "Bash", "Glob", "Grep", "LS"],
                    appendSystemPrompt: ${JSON.stringify(CLAUDE_SYSTEM_PROMPT)}
                }
            })) {
                console.log(JSON.stringify(msg));
            }
        } catch (error) {
            console.error('Claude error:', error.message);
        }
    }
    runClaude();
    `;

    // Write script to repository
    const repoScriptPath = `${repoPath}/claude_script.js`;
    await ssh.execCommand(`cat > "${repoScriptPath}" << 'EOF'
${claudeScript}
EOF`);

    // Check if anthropic.env exists
    const envCheck = await ssh.execCommand('test -f /home/ubuntu/anthropic.env && echo "EXISTS" || echo "NOT_EXISTS"');
    if (!envCheck.stdout.includes('EXISTS')) {
      console.warn('⚠️ anthropic.env file not found, Claude may not have API key access');
    }

    // Use the API key from system-wide environment file
    const command = `cd "${repoPath}" && source /home/ubuntu/anthropic.env 2>/dev/null || true && timeout 300 node claude_script.js`;

    console.log(`🔧 Executing Claude command: ${command}`);
    console.log(`📁 Working directory: ${repoPath}`);
    console.log(`📄 Script path: ${repoScriptPath}`);

    const result = await ssh.execCommand(command);

    // Cleanup
    await ssh.execCommand(`rm -f "${repoScriptPath}"`);

    console.log(`✅ Claude command completed`);

    if (result.code !== 0) {
      return {
        output: result.stdout || '',
        error: `Claude command failed (exit code ${result.code}): ${result.stderr || 'No error message'}`
      };
    }

    return {
      output: result.stdout || '',
      error: result.stderr ? `Warnings: ${result.stderr}` : undefined
    };

  } catch (error) {
    console.error('Failed to run Claude:', error);
    
    // If it's a connection error, the command might have still succeeded
    if (error instanceof Error && (error.message.includes('ECONNRESET') || error.message.includes('Connection closed'))) {
      console.log('⚠️ SSH connection lost, but Claude command may have completed successfully');
      return {
        output: 'Claude command executed, but SSH connection was lost during file watching. Changes should still be applied.',
        error: 'SSH connection reset - this is usually harmless'
      };
    }
    
    throw error;
  } finally {
    try {
      ssh.dispose();
    } catch (disposeError) {
      console.log('SSH dispose error (harmless):', disposeError);
    }
  }
}
