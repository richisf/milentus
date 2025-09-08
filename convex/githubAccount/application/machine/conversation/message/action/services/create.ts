"use node";

import { NodeSSH } from 'node-ssh';

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

/**
 * Handle git operations after Claude makes changes to the repository
 */
async function handleGitOperationsAfterClaude(ssh: NodeSSH, repositoryName: string): Promise<void> {
  const repoPath = `/home/ubuntu/${repositoryName}`;

  try {
    console.log('🔍 Checking for git changes...');

    // Check git status to see what files were modified
    const statusResult = await ssh.execCommand(`cd "${repoPath}" && git status --porcelain`);
    const changes = statusResult.stdout.trim();

    if (!changes) {
      console.log('📝 No changes detected by Claude');
      return;
    }

    console.log('📝 Changes detected:');
    console.log(changes);

    // Add all changes to staging
    console.log('📤 Adding changes to git staging...');
    await ssh.execCommand(`cd "${repoPath}" && git add .`);

    // Generate a simple commit message
    const commitMessage = 'feat: generate code changes';

    // Commit the changes
    console.log('💾 Committing changes...');
    const commitResult = await ssh.execCommand(`cd "${repoPath}" && git commit -m "${commitMessage}"`);

    if (commitResult.code === 0) {
      console.log('✅ Changes committed successfully');

      // Push to remote repository
      console.log('🚀 Pushing changes to GitHub...');
      const pushResult = await ssh.execCommand(`cd "${repoPath}" && git push origin main`);

      if (pushResult.code === 0) {
        console.log('✅ Changes pushed to GitHub successfully');
      } else {
        console.log('⚠️ Git push failed, but local commit was successful');
        console.log('Push error:', pushResult.stderr);
      }
    } else {
      console.log('⚠️ Git commit failed');
      console.log('Commit error:', commitResult.stderr);
    }

  } catch (error) {
    console.error('❌ Error during git operations:', error);
    // Don't throw - we don't want to fail the entire Claude operation due to git issues
  }
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

    // Claude Code is already installed system-wide in /home/ubuntu/claude_workspace

    // Create Claude Code configuration files for better instructions
    const claudeSettings = {
      "permissions": {
        "allow": [
          "Read",
          "Write", 
          "Edit",
          "MultiEdit",
          "Bash(npm:*)",
          "Bash(yarn:*)",
          "Bash(git:*)",
          "Bash(node:*)",
          "Bash(npx:*)"
        ],
        "defaultMode": "acceptEdits"
          },
          "outputStyle": "Explanatory",
          "includeCoAuthoredBy": true,
          "model": "claude-sonnet-4-20250514"
        };

        // Create CLAUDE.md file with comprehensive but simplified instructions
        const claudeInstructions = `# Claude Code Instructions & Convex Architecture

## Core Principle
Schema-Driven Architecture: Folder structure mirrors database schema relationships and nesting.

## Folder Structure Rules

### Basic Table Structure
For each table in schema.ts:
- Create folder: convex/{tableName}/
- If table has foreign key relationships, nest related tables inside parent table folder
- Example: repository table -> convex/githubAccount/repository/

### Standard Table Layout
Every table folder should have:
- query.ts (read operations)
- mutations/ folder (write operations)
- mutations/create.ts (create records)
- mutations/update.ts (update records)
- mutations/delete.ts (delete records)

### Actions for External APIs
When you need external API calls:
- Create action/ folder
- action/create.ts (API entry point)
- action/services/ folder (external API calls)
- action/services/create.ts (service functions)

### Complex Business Logic
For operations with branching logic:
- Use subfolders under action/
- action/update.ts (main entry)
- action/update/files.ts (file operations)
- action/update/message.ts (message operations)
- action/update/services/ (shared utilities)

## File Organization Patterns

### Parent Tables (no dependencies)
\`\`\`
convex/
├── githubAccount/ (parent table)
│   ├── query/
│   │   └── by_user.ts (read operations)
│   ├── mutation/
│   │   ├── create.ts (database creates)
│   │   ├── update.ts (database updates)
│   │   └── delete.ts (database deletes)
│   └── action/
│       ├── create.ts (API entry point)
│       └── services/
│           └── create.ts (service functions)
\`\`\`

### Child Tables (with dependencies)
\`\`\`
convex/githubAccount/
├── repository/ (depends on githubAccount)
│   ├── query/ (read operations)
│   ├── mutation/ (database operations)
│   ├── action/
│   │   ├── create.ts (entry point)
│   │   ├── create/
│   │   │   ├── default.ts (default creation)
│   │   │   ├── nonDefault.ts (custom creation)
│   │   │   └── services/ (service functions)
│   │   └── delete.ts (delete operations)
│   ├── document/ (child of repository)
│   └── machine/ (child of repository)
\`\`\`

## Key Conventions

### File Naming Rules
- query.ts - all database read operations
- mutation/create.ts - database create operations
- mutation/update.ts - database update operations
- mutation/delete.ts - database delete operations
- action/create.ts - API endpoints with external calls
- services/*.ts - pure functions and external APIs

### Relationship Rules
- Parent tables: top-level in convex/ (githubAccount/)
- Child tables: nested under parent (githubAccount/repository/)
- Foreign keys determine nesting
- Related tables stay together

## Development Guidelines

### Code Standards
- Use TypeScript everywhere
- Follow existing naming patterns
- Add proper error handling
- Write clean, readable code
- Test new functionality

### File Organization
- Keep related operations together
- Use subfolders for complex features
- Separate database, API, and UI concerns
- Follow established patterns

## Implementation Checklist

### Adding New Table
1. Define table in schema.ts
2. Decide nesting (parent or child)
3. Create base structure (query.ts + mutations/)
4. Add CRUD operations (create, update, delete)
5. Plan external APIs (action/ folder if needed)
6. Identify branching logic (subfolders if needed)
7. Design services (pure functions for external calls)

### Adding New Feature
1. Database operation? -> mutations/ folder
2. External API calls? -> action/services/ folder
3. Complex branching? -> subfolders in action/
4. Simple read operation? -> query.ts

## File Types Reference

- Queries: database read operations (by_user.ts, by_id.ts)
- Mutations: database write operations (create.ts, update.ts, delete.ts)
- Actions: API endpoints and business logic orchestration
- Services: external API calls and complex business logic
- Branched Actions: different logic paths for same operation

## Frontend Generation Guidelines

### Component Structure
When generating frontend components:
- Use functional components with TypeScript
- Follow the existing component folder structure
- Create reusable components in components/ folder
- Use proper TypeScript interfaces for props
- Implement proper error boundaries and loading states
- Follow the established UI patterns and styling

### Page Organization
For new pages and routes:
- Create pages in app/ directory following Next.js patterns
- Use dynamic routing when appropriate
- Implement proper data fetching patterns
- Add loading and error states
- Follow the existing navigation patterns

### Data Management
For frontend-backend integration:
- Use Convex React hooks (useQuery, useMutation, useAction)
- Implement proper error handling for API calls
- Add optimistic updates where appropriate
- Handle loading states properly
- Follow the established data flow patterns

### UI/UX Patterns
When creating user interfaces:
- Use existing UI components from the design system
- Follow established form patterns and validation
- Implement proper accessibility features
- Add appropriate user feedback for actions
- Follow the existing styling and theming patterns

## Complete Implementation Requirements

### Backend + Frontend Integration
1. **Database Schema**: Create proper Convex tables with indexes
2. **API Layer**: Implement mutations, queries, and actions
3. **Type Safety**: Generate TypeScript types from Convex
4. **Frontend Components**: Create corresponding React components
5. **Data Flow**: Implement proper state management and data fetching
6. **User Experience**: Add loading states, error handling, and feedback
7. **Testing**: Consider basic error scenarios and edge cases

### File Generation Checklist
- [ ] Convex schema definitions (if new tables needed)
- [ ] Backend mutations, queries, and actions
- [ ] TypeScript type definitions
- [ ] React components and pages
- [ ] Form handling and validation
- [ ] Error handling and loading states
- [ ] Proper imports and exports
- [ ] Documentation and comments

## Task Context
You are working on a complete full-stack Convex application. Generate BOTH backend AND frontend code following these established patterns. Create production-ready implementations with proper error handling, TypeScript types, and user experience considerations. Use the existing codebase as your guide for structure, patterns, and conventions.
        `;

        // Write configuration files to the repository
        const settingsPath = `${repoPath}/.claude/settings.json`;
        const instructionsPath = `${repoPath}/CLAUDE.md`;
        
        // Create .claude directory if it doesn't exist
        await ssh.execCommand(`mkdir -p "${repoPath}/.claude"`);
        
        // Write settings file
        await ssh.execCommand(`cat > "${settingsPath}" << 'EOF'
${JSON.stringify(claudeSettings, null, 2)}
EOF`);

        // Write instructions file
        await ssh.execCommand(`cat > "${instructionsPath}" << 'EOF'
${claudeInstructions}
EOF`);

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
                    appendSystemPrompt: "Note you should complete the task in under 15 turns. You are working on a project with specific requirements. Please read the CLAUDE.md file for detailed instructions and follow the project's configuration in .claude/settings.json. Focus on building clean, maintainable code that follows the structured requirements provided."
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

    // Handle git operations after Claude makes changes
    if (result.code === 0 && repositoryName) {
      await handleGitOperationsAfterClaude(ssh, repositoryName);
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
