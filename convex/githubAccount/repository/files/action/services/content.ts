"use node";

/**
 * Fetch raw text content of a file in a repository
 */
export async function fetchFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  filePath: string
): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3.raw', // return raw file contents
      'User-Agent': 'milentus-app'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch file content for ${filePath}: ${response.status}`);
  }

  const text = await response.text();
  return text;
}
