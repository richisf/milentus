export interface DeletedRepository {
  success: boolean;
  error?: string;
}

export async function repository(
  token: string,
  owner: string,
  repoName: string
): Promise<DeletedRepository> {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Convex-GitHub-App",
        "Accept": "application/vnd.github+json",
      },
    });

    if (response.ok) {
      console.log(`✅ GitHub repository deleted: ${owner}/${repoName}`);
      return { success: true };
    } else if (response.status === 404) {
      // Repository doesn't exist - consider this successful
      console.log(`ℹ️ GitHub repository not found (already deleted or never existed): ${owner}/${repoName}`);
      return { success: true };
    } else {
      const errorText = await response.text();
      const error = `Failed to delete GitHub repository: ${response.status} ${response.statusText} - ${errorText}`;
      console.error(`❌ ${error}`);
      return { success: false, error };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`❌ Error deleting GitHub repository ${owner}/${repoName}:`, error);
    return {
      success: false,
      error: `Failed to delete GitHub repository: ${errorMessage}`
    };
  }
}
