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
    owner: {
      login: string;
    };
  }
  
  
  export async function repositories(token: string): Promise<GithubRepository[]> {
    const response = await fetch("https://api.github.com/user/repos?sort=updated&per_page=100", {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Convex-GitHub-App",
        "Accept": "application/vnd.github.v3+json",
      },
    });
  
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
  
        const repositories = await response.json() as Array<{
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
      owner: {
        login: string;
      };
    }>;

    return repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      html_url: repo.html_url,
      description: repo.description,
      fork: repo.fork,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
      language: repo.language,
      default_branch: repo.default_branch,
      owner: {
        login: repo.owner.login,
      },
    }));
  }
  