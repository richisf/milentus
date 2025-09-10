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
        // Enhanced Claude script with detailed logging and modern SDK features
        const claudeScript = `
        async function runClaude() {
            try {
                const { query } = await import('/home/ubuntu/claude_workspace/node_modules/@anthropic-ai/claude-code/sdk.mjs');

                console.log('🎯 Starting Claude Code session...');
                console.log('📝 Prompt:', ${JSON.stringify(message)});
                console.log('🔧 Configuration:', JSON.stringify({
                    maxTurns: 15,
                    permissionMode: 'acceptEdits',
                    model: 'claude-sonnet-4-20250514',
                    allowedTools: ["Read", "Write", "Edit", "MultiEdit", "Bash", "Glob", "Grep", "LS"]
                }, null, 2));

                let messageCount = 0;
                let toolUsageCount = 0;
                let totalInputTokens = 0;
                let totalOutputTokens = 0;

                for await (const msg of query({
                    prompt: ${JSON.stringify(message)},
                    options: {
                        maxTurns: 50,
                        permissionMode: 'acceptEdits',
                        model: 'claude-sonnet-4-20250514',
                        pathToClaudeCodeExecutable: '/home/ubuntu/claude_workspace/node_modules/@anthropic-ai/claude-code/cli.js',
                        allowedTools: ["Read", "Write", "Edit", "MultiEdit", "Bash", "Glob", "Grep", "LS"],
                        appendSystemPrompt: ${JSON.stringify(CLAUDE_SYSTEM_PROMPT)},
                        // Add modern SDK features
                        hooks: {
                            PreToolUse: [{
                                hooks: [async (input) => {
                                    toolUsageCount++;
                                    console.log(\`🔨 [\${toolUsageCount}] \${input.tool_name}\`);
                                    return { continue: true };
                                }]
                            }],
                            PostToolUse: [{
                                hooks: [async (input) => {
                                    console.log(\`✅ \${input.tool_name} done\`);
                                }]
                            }]
                        },
                    }
                })) {
                    messageCount++;
                    console.log(\`\\n📨 Message #\${messageCount} [\${msg.type}]\`);

                    switch (msg.type) {
                        case 'system':
                            if (msg.subtype === 'init') {
                                console.log('🚀 Claude session initialized');
                            }
                            break;

                        case 'assistant':
                            // Minimal logging to avoid truncation
                            console.log('🤖 Claude processing...');

                            // Keep track of content for final output only

                            if (msg.usage) {
                                totalInputTokens += msg.usage.input_tokens || 0;
                                totalOutputTokens += msg.usage.output_tokens || 0;
                                console.log(\`🔢 Message tokens - Input: \${msg.usage.input_tokens || 'N/A'}, Output: \${msg.usage.output_tokens || 'N/A'}\`);
                                console.log(\`📈 Cumulative tokens - Total Input: \${totalInputTokens}, Total Output: \${totalOutputTokens}, Total: \${totalInputTokens + totalOutputTokens}\`);
                            }
                            break;

                        case 'user':
                            console.log('👤 User processed');
                            break;

                        case 'result':
                            if (msg.subtype === 'success') {
                                console.log('✅ Claude session completed successfully');
                            } else {
                                console.log(\`❌ Session ended: \${msg.subtype}\`);
                            }
                            break;

                        default:
                            console.log(\`📝 Other message type: \${msg.type}\`);
                            console.log('🔍 Unknown Message Details:', JSON.stringify(msg, null, 2));
                    }

                    // Message processing complete
                }

                console.log(\`✅ Session complete: \${messageCount} messages, \${toolUsageCount} tools\`);
                console.log(\`📊 Tokens: \${totalInputTokens + totalOutputTokens} total\`);

            } catch (error) {
                console.error('❌ Claude error:', error.message);
                console.error('🔍 Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
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
    // Save output to file to ensure we capture everything without truncation
    const outputFile = `${repoPath}/claude_output.log`;
    const command = `cd "${repoPath}" && source /home/ubuntu/anthropic.env 2>/dev/null || true && timeout 900 node claude_script.js 2>&1 | tee "${outputFile}"`;

    console.log(`🔧 Starting Claude execution...`);

    const result = await ssh.execCommand(command);

    // Also try to read the complete output from file
    let completeOutput = result.stdout || '';
    try {
      const fileResult = await ssh.execCommand(`cat "${outputFile}" 2>/dev/null || echo "NO_FILE"`);
      if (!fileResult.stdout.includes('NO_FILE') && fileResult.stdout.length > completeOutput.length) {
        completeOutput = fileResult.stdout;
      }
    } catch (fileError) {
      console.log('⚠️ Could not read output file, using stdout', fileError);
    }

    // Cleanup
    await ssh.execCommand(`rm -f "${repoScriptPath}" "${outputFile}"`);

    console.log(`✅ Claude command completed`);
    console.log(`📊 Complete output length: ${completeOutput.length} characters`);

    if (result.code !== 0) {
      return {
        output: completeOutput,
        error: `Claude command failed (exit code ${result.code}): ${result.stderr || 'No error message'}`
      };
    }

    return {
      output: completeOutput,
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
