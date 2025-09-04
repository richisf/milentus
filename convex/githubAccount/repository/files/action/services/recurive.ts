import { extractDependencies } from "./dependencies";
import { getMatchingFilesWithContent } from "./file";

export async function recursive(
    accessToken: string,
    owner: string,
    repo: string,
    files: Array<{path: string, content: string}>,
    dependencyPath: string,
    processedPaths: Set<string> = new Set(),
    maxDepth: number = 10
  ): Promise<Array<{path: string, content: string}>> {
    
  
    const newFiles = files.filter(f => !processedPaths.has(f.path));
    if (newFiles.length === 0 || maxDepth <= 0) return [];
  
    newFiles.forEach(f => processedPaths.add(f.path));
  
    const dependencies = newFiles.flatMap(f =>
      extractDependencies(f.content, dependencyPath)
    );
  
    const uniqueDeps = [...new Set(dependencies)]
      .filter(d => !processedPaths.has(d))
      .filter(d => d.endsWith('.ts') || d.endsWith('.tsx') || d.endsWith('.js') || d.endsWith('.jsx')); // Only process code files
  
    if (uniqueDeps.length === 0) return newFiles;
  
    try {
      const depFiles = await getMatchingFilesWithContent(
        accessToken,
        owner,
        repo,
        uniqueDeps,
        ""
      );
  
      const moreDeps = await recursive(
        accessToken,
        owner,
        repo,
        depFiles,
        dependencyPath,
        processedPaths,
        maxDepth - 1
      );
  
      return [...newFiles, ...moreDeps];
    } catch (error) {
      console.warn(`Failed to fetch dependencies at depth ${maxDepth}:`, error);
      return newFiles;
    }
  }
  