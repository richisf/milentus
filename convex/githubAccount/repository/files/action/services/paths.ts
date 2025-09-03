"use node";

interface GithubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  download_url?: string | null;
  url: string;
}

/**
 * Fetch contents of a specific directory or file in a repository
 */
export async function fetchRepositoryPath(
  accessToken: string,
  owner: string,
  repo: string,
  path = ''
): Promise<GithubFile[]> {
  const url = path
    ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    : `https://api.github.com/repos/${owner}/${repo}/contents`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'milentus-app'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch path contents: ${response.status}`);
  }

  const contents = await response.json() as GithubFile[] | GithubFile;

  // If it's a single file, wrap it in an array
  return Array.isArray(contents) ? contents : [contents];
}
