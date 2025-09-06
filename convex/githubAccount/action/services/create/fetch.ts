export interface githubAccount {
  login: string;
  id: number;
  name?: string;
  email?: string;
  avatar_url: string;
}
  
export async function githubAccount(token: string): Promise<githubAccount> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "Convex-GitHub-App",
      "Accept": "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const userData = await response.json();

  return {
    login: userData.login,
    id: userData.id,
    name: userData.name,
    email: userData.email,
    avatar_url: userData.avatar_url,
  };
}
  