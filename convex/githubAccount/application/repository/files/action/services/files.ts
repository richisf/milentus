"use node";

import { fetchRepositoryPath } from "@/convex/githubAccount/application/repository/files/action/services/github/paths";

export interface TraversalResult {
  path: string;
  content: string;
}

export async function getAllFilePaths(
  accessToken: string,
  owner: string,
  repo: string
): Promise<string[]> {
  const allPaths: string[] = [];

  async function traverse(currentPath: string = ''): Promise<void> {
    try {
      const items = await fetchRepositoryPath(accessToken, owner, repo, currentPath);

      for (const item of items) {
        if (item.type === 'dir') {
          await traverse(item.path);
        } else if (item.type === 'file') {
          allPaths.push(item.path);
        }
      }
    } catch (error) {
      console.warn(`Failed to traverse path ${currentPath}:`, error);
    }
  }

  await traverse();
  return allPaths;
}
