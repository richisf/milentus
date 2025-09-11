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
                        appendSystemPrompt: ${JSON.stringify(CLAUDE_SYSTEM_PROMPT + `

IMPORTANT: At the end of your work, provide a JSON summary of all changes made. Format it exactly like this:

\`\`\`json
{
  "changes": [
    {
      "type": "file_modified|file_created|file_deleted|command_executed",
      "file_path": "/path/to/file",
      "description": "Brief description of what was changed",
      "details": "Additional technical details if needed"
    }
  ],
  "summary": "Overall summary of all changes",
  "status": "completed|failed",
  "errors": ["any errors encountered"]
}
\`\`\`

Make sure to include ALL changes you made during this session.`)},
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
                                    console.log('✅ Tool done: ' + input.tool_name);

                                    // Track changes for JSON summary
                                    if (input.tool_name === 'Write' || input.tool_name === 'Edit' || input.tool_name === 'MultiEdit') {
                                        console.log('📝 File modified: ' + (input.tool_response?.filePath || 'unknown'));
                                    } else if (input.tool_name === 'Bash') {
                                        console.log('🔧 Command executed: ' + (input.tool_input?.command?.substring(0, 100) || 'unknown'));
                                    }
                                }]
                            }],
                            SessionEnd: [{
                                hooks: [async (input) => {
                                    console.log('🎯 Session completed, extracting JSON summary...');
                                    try {
                                        // Extract JSON from the result - simple string matching
                                        let jsonString = null;
                                        const result = input.result || '';

                                        // Look for JSON in code blocks
                                        const jsonStart = result.indexOf('\`\`\`json');
                                        if (jsonStart !== -1) {
                                            const jsonEnd = result.indexOf('\`\`\`', jsonStart + 7);
                                            if (jsonEnd !== -1) {
                                                jsonString = result.substring(jsonStart + 7, jsonEnd).trim();
                                            }
                                        }

                                        // If no code block found, look for direct JSON
                                        if (!jsonString) {
                                            const changesIndex = result.indexOf('\"changes\"');
                                            if (changesIndex !== -1) {
                                                const startBrace = result.lastIndexOf('{', changesIndex);
                                                const endBrace = result.indexOf('}', changesIndex);
                                                if (startBrace !== -1 && endBrace !== -1) {
                                                    jsonString = result.substring(startBrace, endBrace + 1);
                                                }
                                            }
                                        }

                                        if (jsonString) {
                                            const parsedJson = JSON.parse(jsonString);
                                            console.log('📋 FINAL_JSON_SUMMARY:', JSON.stringify(parsedJson, null, 2));

                                            // Validate the structure
                                            if (parsedJson.changes && Array.isArray(parsedJson.changes)) {
                                                console.log('✅ Valid JSON with ' + parsedJson.changes.length + ' changes');
                                            } else {
                                                console.log('⚠️ JSON found but missing changes array');
                                            }
                                        } else {
                                            console.log('⚠️ No JSON summary found in Claude response');
                                            console.log('📝 Raw result:', input.result?.substring(0, 500) + '...');
                                        }
                                    } catch (error) {
                                        console.error('❌ Error parsing JSON summary:', error.message);
                                        console.log('📝 Raw result:', input.result?.substring(0, 500) + '...');
                                    }
                                    return { continue: true };
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
