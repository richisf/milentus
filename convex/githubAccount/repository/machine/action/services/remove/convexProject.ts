"use node";

export async function removeConvexProject(convexUrl: string, convexProjectId?: number): Promise<void> {
  console.log(`🗑️ Deleting Convex project: ${convexUrl}${convexProjectId ? ` (ID: ${convexProjectId})` : ''}`);

  // Get configuration from environment variables
  const teamId = process.env.CONVEX_TEAM_ID || process.env.convex_team_id;
  const apiToken = process.env.CONVEX_API_TOKEN || process.env.convex_api_token;

  if (!teamId || !apiToken) {
    throw new Error('CONVEX_TEAM_ID and CONVEX_API_TOKEN environment variables are required');
  }

  // If we have the project ID directly, use it (faster)
  if (convexProjectId) {
    console.log(`📝 Using provided project ID: ${convexProjectId}`);
    await deleteProjectById(convexProjectId, apiToken);
    return;
  }

  const urlParts = convexUrl.replace('https://', '').split('.');
  const projectName = urlParts[0];

  if (!projectName) {
    throw new Error(`Could not extract project name from URL: ${convexUrl}`);
  }

  console.log(`🔍 Finding project ID for: ${projectName}`);
  const projectId = await findProjectId(projectName, teamId, apiToken);

  if (!projectId) {
    console.log(`ℹ️ Convex project not found: ${projectName}`);
    return;
  }

  await deleteProjectById(projectId, apiToken);
}

// Helper function to find project ID by name
async function findProjectId(projectName: string, teamId: string, apiToken: string): Promise<number | null> {
  const listResponse = await fetch(`https://api.convex.dev/v1/teams/${teamId}/projects`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!listResponse.ok) {
    if (listResponse.status === 404) {
      console.log(`ℹ️ Team not found or no access: ${teamId}`);
      return null;
    }
    throw new Error(`Failed to list Convex projects: ${listResponse.status}`);
  }

  const projects = await listResponse.json() as Array<{ id: number; name: string }>;
  const project = projects.find((p) => p.name === projectName);

  return project ? project.id : null;
}

// Helper function to delete project by ID
async function deleteProjectById(projectId: number, apiToken: string): Promise<void> {
  console.log(`🗑️ Deleting project with ID: ${projectId}`);

  const deleteResponse = await fetch(`https://api.convex.dev/v1/projects/${projectId}/delete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (deleteResponse.ok) {
    console.log(`✅ Convex project deleted successfully: ${projectId}`);
    return;
  }

  if (deleteResponse.status === 404) {
    console.log(`ℹ️ Convex project not found (already deleted): ${projectId}`);
    return;
  }

  const errorText = await deleteResponse.text();
  throw new Error(`Convex project deletion failed: ${deleteResponse.status} - ${errorText}`);
}
