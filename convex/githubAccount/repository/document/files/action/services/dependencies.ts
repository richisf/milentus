
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

    // Add .ts extension if the path doesn't have an extension
    // This handles cases like 'path/to/file' -> 'path/to/file.ts'
    if (!importPath.includes('.') && !importPath.endsWith('/')) {
      importPath = importPath + '.ts';
    }

    // Filter by target path if provided
    if (!targetPath || importPath.includes(targetPath)) {
      dependencies.push(importPath);
    }
  }

  const uniqueDeps = [...new Set(dependencies)]; // Remove duplicates

  if (uniqueDeps.length > 0) {
    console.log(`🔗 Extracted ${uniqueDeps.length} unique dependencies:`, uniqueDeps);
  }

  return uniqueDeps;
}
