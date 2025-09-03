"use node";

import { fetchRepositoryPath } from "./paths";
import { fetchFileContent } from "./content";

export async function fetchAllFiles(
  accessToken: string,
  owner: string,
  repo: string,
  filterPattern?: string,
  currentPath: string = "",
  allFiles: { path: string; content: string }[] = []
): Promise<{ path: string; content: string }[]> {
  const contents = await fetchRepositoryPath(accessToken, owner, repo, currentPath);

  for (const item of contents) {
    if (item.type === 'file') {
      // Skip binary files and large files
      if (item.size && item.size > 1000000) continue; // Skip files > 1MB

      // Apply simple filter if provided
      if (filterPattern && !item.path.includes(filterPattern)) continue;

      try {
        const content = await fetchFileContent(accessToken, owner, repo, item.path);
        allFiles.push({
          path: item.path,
          content: content,
        });
      } catch (error) {
        console.error(`Failed to fetch content for ${item.path}:`, error);
      }
    } else if (item.type === 'dir') {
      // Skip common unwanted directories
      if (['.git', 'node_modules', '.next', 'dist', 'build'].includes(item.name)) continue;

      const nextPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      await fetchAllFiles(accessToken, owner, repo, filterPattern, nextPath, allFiles);
    }
  }

  return allFiles;
}
