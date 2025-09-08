"use node";

export async function createConvexProject(username: string, repoName: string): Promise<{ convexUrl: string; projectId: number }> {
  console.log('🔧 Creating Convex project...');

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
    body: JSON.stringify({ projectName, deploymentType: "prod" }),
  });

  if (response.ok) {
    const projectData = await response.json();
    const convexUrl = projectData.url || projectData.deploymentUrl;
    const projectId = projectData.projectId;
    console.log(`✅ Convex project created: ${convexUrl}`);
    console.log(`📝 Project ID: ${projectId}`);

    // Return both URL and ID for storage in database
    return {
      convexUrl,
      projectId
    };
  } else {
    throw new Error(`Convex project creation failed: ${response.status}`);
  }
}
