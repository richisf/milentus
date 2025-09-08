import { extractDependencies } from "@/convex/githubAccount/application/repository/files/action/services/dependencies/finder";
import { getMatchingFilesWithContent } from "@/convex/githubAccount/application/repository/files/action/services/file";

export interface FileWithDependencies {
  path: string;
  content: string;
  dependencies: string[];
}

export async function dependencies(
    accessToken: string,
    owner: string,
    repo: string,
    files: Array<{path: string, content: string}>,
    dependencyPath: string,
    processedPaths: Set<string> = new Set(),
    maxDepth: number = 10
  ): Promise<Array<FileWithDependencies>> {

    console.log(`🔄 Starting recursive call with maxDepth=${maxDepth}, ${files.length} files, ${processedPaths.size} processed paths`);

    const newFiles = files.filter(f => !processedPaths.has(f.path));
    console.log(`📋 New files to process: ${newFiles.length}`, newFiles.map(f => f.path));

    if (newFiles.length === 0 || maxDepth <= 0) {
      console.log(`🚫 Stopping recursion: newFiles=${newFiles.length}, maxDepth=${maxDepth}`);
      return [];
    }
  
    newFiles.forEach(f => processedPaths.add(f.path));
  
    console.log(`🔍 Processing ${newFiles.length} new files for dependencies...`);

    // Create files with their dependencies
    const filesWithDeps: FileWithDependencies[] = newFiles.map(f => {
      const deps = extractDependencies(f.content, dependencyPath);
      if (deps.length > 0) {
        console.log(`📄 ${f.path} -> Found ${deps.length} dependencies:`, deps);
      }
      return {
        path: f.path,
        content: f.content,
        dependencies: deps
      };
    });

    const allDependencies = filesWithDeps.flatMap(f => f.dependencies);
    console.log(`📋 Total raw dependencies found: ${allDependencies.length}`);

    const uniqueDeps = [...new Set(allDependencies)]
      .filter(d => !processedPaths.has(d))
      .filter(d => d.endsWith('.ts') || d.endsWith('.tsx') || d.endsWith('.js') || d.endsWith('.jsx')); // Only process code files

    console.log(`✨ Unique unprocessed dependencies: ${uniqueDeps.length}`, uniqueDeps);

    if (uniqueDeps.length === 0) {
      console.log(`🎯 No more dependencies to process, returning ${filesWithDeps.length} files`);
      return filesWithDeps;
    }
  
    try {
      console.log(`🔎 Fetching ${uniqueDeps.length} dependency files...`);
      const depFiles = await getMatchingFilesWithContent(
        accessToken,
        owner,
        repo,
        uniqueDeps,
        ""
      );
      console.log(`📂 Successfully fetched ${depFiles.length} dependency files:`, depFiles.map(f => f.path));

      const moreDeps = await dependencies(
        accessToken,
        owner,
        repo,
        depFiles,
        dependencyPath,
        processedPaths,
        maxDepth - 1
      );

      const totalFiles = [...filesWithDeps, ...moreDeps];
      const currentDepth = 10 - maxDepth; // Since we start with maxDepth=10
      console.log(`🔄 Recursion level ${currentDepth} returning ${totalFiles.length} total files`);
      return totalFiles;
    } catch (error) {
      const currentDepth = 10 - maxDepth;
      console.warn(`❌ Failed to fetch dependencies at depth ${currentDepth}:`, error);
      return filesWithDeps;
    }
  }
  