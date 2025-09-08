"use node";

import { getAllFilePaths } from "@/convex/githubAccount/application/repository/files/action/services/files";
import { getMatchingFilesWithContent } from "@/convex/githubAccount/application/repository/files/action/services/file";
import { dependencies } from "@/convex/githubAccount/application/repository/files/action/services/dependencies";

export interface CreateFilesResult {
  success: boolean;
  files?: {
    path: string;
    content: string;
    dependencies: string[];
  }[];
  processingOrder?: string[];
  error?: string;
}

export interface CreateFilesServiceArgs {
  path: string;
  dependencyPath: string;
  token: string;
  username: string;
  repositoryName: string;
}

export async function createFilesService({
  path,
  dependencyPath,
  token,
  username,
  repositoryName,
}: CreateFilesServiceArgs): Promise<CreateFilesResult> {
  try {
    const allPaths = await getAllFilePaths(token, username, repositoryName);

    // Get initial matching files and recursively collect all dependencies
    console.log(`🔍 Searching for files matching path pattern: "${path}"`);
    const initialFiles = await getMatchingFilesWithContent(
      token,
      username,
      repositoryName,
      allPaths,
      path
    );
    console.log(`📁 Found ${initialFiles.length} initial files:`, initialFiles.map(f => f.path));

    console.log(`🔗 Recursively collecting dependencies with pattern: "${dependencyPath}"`);
    const allCollectedFiles = await dependencies(
      token,
      username,
      repositoryName,
      initialFiles,
      dependencyPath
    );
    console.log(`📦 Total collected files: ${allCollectedFiles.length}`, allCollectedFiles.map(f => f.path));

    const processingOrder: string[] = [...allCollectedFiles].map(file => file.path);

    return {
      success: true,
      files: allCollectedFiles.map(file => ({
        path: file.path,
        content: file.content,
        dependencies: file.dependencies
      })),
      processingOrder: processingOrder
    };
  } catch (error) {
    console.error("❌ File fetch error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch files",
    };
  }
}
