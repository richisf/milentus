export interface GithubRepository {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description?: string;
    fork: boolean;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    language?: string;
    default_branch: string;
  }
  
  export async function repository(token: string, owner: string, repo: string): Promise<GithubRepository> {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Convex-GitHub-App",
        "Accept": "application/vnd.github.v3+json",
      },
    });
  
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
  
    const repoData = await response.json();
  
    return {
      id: repoData.id,
      name: repoData.name,
      full_name: repoData.full_name,
      private: repoData.private,
      html_url: repoData.html_url,
      description: repoData.description,
      fork: repoData.fork,
      created_at: repoData.created_at,
      updated_at: repoData.updated_at,
      pushed_at: repoData.pushed_at,
      language: repoData.language,
      default_branch: repoData.default_branch,
    };
  }
  
  