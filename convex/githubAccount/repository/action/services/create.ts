export interface CreatedRepository {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    private: boolean;
    owner: {
      login: string;
    };
  }
  
  export async function repository(
    token: string,
    templateOwner: string,
    templateName: string,
    newRepoName: string,
    newRepoDescription?: string
  ): Promise<CreatedRepository> {
    const response = await fetch(`https://api.github.com/repos/${templateOwner}/${templateName}/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "Convex-GitHub-App",
        "Content-Type": "application/json",
        "Accept": "application/vnd.github+json",
      },
      body: JSON.stringify({
        owner: templateOwner,
        name: newRepoName,
        description: newRepoDescription || `Repository created from template`,
        private: true,
        include_all_branches: false,
      }),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create repository from template: ${response.status} ${response.statusText} - ${errorText}`);
    }
  
    const repoData = await response.json();
  
    return {
      id: repoData.id,
      name: repoData.name,
      full_name: repoData.full_name,
      html_url: repoData.html_url,
      private: repoData.private,
      owner: {
        login: repoData.owner.login,
      },
    };
  }
  