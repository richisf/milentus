import { FileWithDependencies } from "@/convex/githubAccount/repository/document/files/action/services/dependencies";

/**
 * Get files in processing order based on dependencies
 * Files with no dependencies come first, followed by files that depend on them, etc.
 */
export function getProcessingOrder(files: FileWithDependencies[]): FileWithDependencies[] {
  const fileMap = new Map<string, FileWithDependencies>();
  const result: FileWithDependencies[] = [];
  const processed = new Set<string>();

  // Create file lookup map
  files.forEach(file => {
    fileMap.set(file.path, file);
  });

  // Process files level by level using topological sort
  let currentLevel = 0;
  let hasUnprocessedFiles = true;

  while (hasUnprocessedFiles && currentLevel < 100) { // Prevent infinite loops
    hasUnprocessedFiles = false;
    const levelFiles: FileWithDependencies[] = [];

    // Find files that can be processed at current level
    files.forEach(file => {
      if (processed.has(file.path)) return;

      hasUnprocessedFiles = true;

      // Check if all dependencies are already processed
      const canProcess = file.dependencies.every(depPath => {
        return processed.has(depPath);
      });

      if (canProcess) {
        levelFiles.push(file);
      }
    });

    // Sort files within this level by number of dependencies (fewer first)
    levelFiles.sort((a, b) => a.dependencies.length - b.dependencies.length);

    // Add to result and mark as processed
    levelFiles.forEach(file => {
      result.push(file);
      processed.add(file.path);
    });

    currentLevel++;
  }

  // Add any remaining files (circular dependencies or edge cases)
  files.forEach(file => {
    if (!processed.has(file.path)) {
      result.push(file);
    }
  });

  return result;
}
