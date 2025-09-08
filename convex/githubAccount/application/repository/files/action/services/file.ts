import { fetchFileContent } from "@/convex/githubAccount/application/repository/files/action/services/github/content";
import { TraversalResult } from "@/convex/githubAccount/application/repository/files/action/services/files"; 

export async function getMatchingFilesWithContent(
  accessToken: string,
  owner: string,
  repo: string,
  allPaths: string[],
  targetPath: string
): Promise<TraversalResult[]> {
  const matchingPaths = allPaths.filter(path => path.includes(targetPath));

  if (matchingPaths.length === 0) return [];

  // Process in batches to avoid overwhelming the API
  const batchSize = 5;
  const results: TraversalResult[] = [];

  for (let i = 0; i < matchingPaths.length; i += batchSize) {
    const batch = matchingPaths.slice(i, i + batchSize);
    const batchPromises = batch.map(async (path) => {
      try {
        const content = await fetchFileContent(accessToken, owner, repo, path);
        return { path, content };
      } catch (error) {
        console.warn(`Failed to fetch content for ${path}:`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((result): result is TraversalResult => result !== null));

    // Small delay between batches to be respectful to the API
    if (i + batchSize < matchingPaths.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
  