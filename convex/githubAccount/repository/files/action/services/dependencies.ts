
export function extractDependencies(
  fileContent: string,
  targetPath?: string,
  normalize: boolean = true
): string[] {
  const dependencies: string[] = [];

  // More robust regex for import statements
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(fileContent)) !== null) {
    let importPath = match[1];

    // Normalize path by removing @/ prefix if enabled
    if (normalize && importPath.startsWith('@/')) {
      importPath = importPath.substring(2);
    }

    // Filter by target path if provided
    if (!targetPath || importPath.includes(targetPath)) {
      dependencies.push(importPath);
    }
  }

  return [...new Set(dependencies)]; // Remove duplicates
}
