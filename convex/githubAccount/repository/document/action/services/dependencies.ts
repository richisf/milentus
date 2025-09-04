import { Id } from "@/convex/_generated/dataModel";

export interface FileWithId {
  _id: Id<"files">;
  repositoryId: Id<"repository">;
  path: string;
  content: string;
  imports?: Id<"files">[];
  _creationTime: number;
}

/**
 * Get files in processing order based on their import relationships
 * Files with no imports come first, followed by files that import them, etc.
 */
export function getProcessingOrder(files: FileWithId[], idToPathMap?: Map<string, string>): FileWithId[] {
  const result: FileWithId[] = [];
  const processed = new Set<string>();
  const idToPath = idToPathMap || new Map<string, string>();

  // Build ID to path mapping
  files.forEach(file => {
    idToPath.set(file._id, file.path);
  });

  // Process files level by level using topological sort
  let currentLevel = 0;
  let hasUnprocessedFiles = true;

  while (hasUnprocessedFiles && currentLevel < 100) {
    hasUnprocessedFiles = false;
    const levelFiles: FileWithId[] = [];

    files.forEach(file => {
      if (processed.has(file.path)) return;

      hasUnprocessedFiles = true;

      // Convert import IDs to paths
      const dependencies = (file.imports || []).map(importId => idToPath.get(importId) || importId);

      // Check if all dependencies are already processed
      const canProcess = dependencies.every(depPath => processed.has(depPath));

      if (canProcess) {
        levelFiles.push(file);
      }
    });

    // Sort files within this level by number of dependencies (fewer first)
    levelFiles.sort((a, b) => (a.imports?.length || 0) - (b.imports?.length || 0));

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
