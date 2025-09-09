"use node";

import { SSHConnection } from "@/convex/githubAccount/application/machine/action/services/create";

export async function setupConvexProject(
  sshConnection: SSHConnection,
  username: string,
  repoName: string,
  repoPath: string
): Promise<{ convexUrl: string; convexDevUrl: string; projectId: number; deployKey?: string; deploymentIdentifier?: string }> {
  console.log('🔧 Setting up complete Convex project...');

  // Get configuration from environment variables
  const teamId = process.env.CONVEX_TEAM_ID || process.env.convex_team_id;
  const apiToken = process.env.CONVEX_API_TOKEN || process.env.convex_api_token;

  const projectName = `${username}-${repoName}-${Date.now()}`;

  const response = await fetch(`https://api.convex.dev/v1/teams/${teamId}/create_project`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ projectName, deploymentType: "dev" }),
  });

  if (!response.ok) {
    throw new Error(`Convex project creation failed: ${response.status}`);
  }

  const projectData = await response.json();
  const convexUrl = projectData.deploymentUrl;
  const deploymentName = projectData.deploymentName;
  const projectId = projectData.projectId;
  console.log(`✅ Convex project created: ${convexUrl}`);
  console.log(`📝 Project ID: ${projectId}`);
  console.log(`🏗️ Deployment Name: ${deploymentName}`);

  // Use the deployment URL as both production and dev URL (for dev deployment type)
  const convexDevUrl = convexUrl;

  // For dev deployments, the deployment identifier should be in format: dev:<deployment_name>
  const deploymentIdentifier = deploymentName ? `dev:${deploymentName}` : undefined;

  // Create deploy key using the deployment name from the API response
  let deployKey = '';
  if (deploymentName) {
    try {
      const deployKeyResponse = await fetch(`https://api.convex.dev/v1/deployments/${deploymentName}/create_deploy_key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `deploy-key-${Date.now()}`
        }),
      });

      if (deployKeyResponse.ok) {
        const keyData = await deployKeyResponse.json();
        deployKey = keyData.deployKey || keyData.key;
        console.log('✅ Deploy key created successfully');
        console.log(`🔐 Deploy Key: ${deployKey.substring(0, 20)}...`);
      } else {
        console.log('⚠️ Failed to create deploy key, continuing without it...');
        console.log('Error:', await deployKeyResponse.text());
      }
    } catch {
      console.log('⚠️ Development deploy key creation failed, but project was created successfully');
    }
  } else {
    console.log('⚠️ No deployment name in response, skipping deploy key creation');
  }

  // Initialize local Convex project if we have a deploy key
  if (deployKey) {
    console.log('🔧 Initializing local Convex project configuration...');

    const escapedRepoPath = repoPath.replace(/'/g, "\\'");
    const initCommand = `cd '${escapedRepoPath}' && CONVEX_DEPLOY_KEY="${deployKey}" npx convex dev --once`;

    const initResult = await sshConnection.ssh.execCommand(initCommand);

    if (initResult.code === 0) {
      console.log('✅ Convex project initialized locally');
    } else {
      console.log('⚠️ Failed to initialize local Convex project, but continuing...');
      console.log('Init result:', initResult.stderr || initResult.stdout);
    }
  }

  return {
    convexUrl, 
    convexDevUrl, 
    projectId,
    deployKey: deployKey || undefined,
    deploymentIdentifier: deploymentIdentifier
  };
}
