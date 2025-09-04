import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getProcessingOrder } from "@/convex/githubAccount/repository/document/action/services/dependencies";
import { sendMessageToGemini } from "@/convex/githubAccount/repository/document/action/services/response";
import { Schema } from "@/convex/githubAccount/repository/document/action/services/model/schema";
import { Intruction } from "@/convex/githubAccount/repository/document/action/services/model/system";

export const document = action({
  args: {
    repositoryId: v.id("repository"),
    nodes: v.optional(v.array(v.object({
      id: v.string(),
      parentId: v.string(),
      label: v.string(),
      collapsed: v.optional(v.boolean())
    }))),
    path: v.optional(v.string()),
    dependencyPath: v.optional(v.string())
  },
  returns: v.object({
    success: v.boolean(),
    documentId: v.optional(v.id("document")),
    files: v.optional(v.array(v.object({
      _id: v.id("files"),
      _creationTime: v.number(),
      repositoryId: v.id("repository"),
      path: v.string(),
      content: v.string(),
      imports: v.optional(v.array(v.id("files")))
    }))),
    processedFiles: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    documentId?: Id<"document">,
    files?: {
      _id: Id<"files">;
      _creationTime: number;
      repositoryId: Id<"repository">;
      path: string;
      content: string;
      imports?: Id<"files">[];
    }[],
    processedFiles?: number,
    error?: string
  }> => {
    try {
      const nodes = args.nodes;

      // If no nodes provided, first create files, then process through Gemini
      if (!nodes) {
        // Validate required parameters for file creation
        if (!args.path) {
          return {
            success: false,
            error: "File path is required when no nodes are provided"
          };
        }

        // First, create/fetch the files using the file creation action
        console.log(`📂 Creating files with path: "${args.path}", dependencyPath: "${args.dependencyPath || ''}"`);
        const fileCreationResult = await ctx.runAction(internal.githubAccount.repository.document.files.action.create.files, {
          repositoryId: args.repositoryId,
          path: args.path,
          dependencyPath: args.dependencyPath || ""
        });

        if (!fileCreationResult.success) {
          return {
            success: false,
            error: `Failed to create files: ${fileCreationResult.error}`
          };
        }

        console.log(`✅ Files created successfully`);

        // Use the files returned directly from the creation action (no extra query needed!)
        const files = fileCreationResult.files || [];

        if (files.length === 0) {
          return {
            success: false,
            error: "No files found in repository"
          };
        }

        console.log(`📂 Processing ${files.length} files through Gemini...`);

        // Use files directly - they already have import relationships from creation
        // Create ID to path mapping for dependency resolution
        const idToPathMap = new Map<string, string>();
        files.forEach(file => {
          idToPathMap.set(file._id, file.path);
        });

        // Get processing order using existing import data
        const processingOrder = getProcessingOrder(files, idToPathMap) as typeof files;
        console.log(`📋 Processing order:`, processingOrder.map(f => f.path));

        // Process files sequentially through Gemini
        let accumulatedNodes: Array<{
          id: string;
          parentId: string;
          label: string;
          collapsed?: boolean;
        }> = [];

        for (let i = 0; i < processingOrder.length; i++) {
          const file = processingOrder[i];
          console.log(`🤖 Processing file ${i + 1}/${processingOrder.length}: ${file.path}`);

          // Create NEW conversation for this file (fresh context)
          const conversation: Array<{
            role: 'user' | 'assistant' | 'system';
            content: string;
            imageBase64?: string;
          }> = [];

          // Add system instruction (always first)
          conversation.push({
            role: "system",
            content: Intruction
          });

          // First message: Include previous results as context + current file
          const messageContent = accumulatedNodes.length > 0
            ? `Previous analysis results:\n${JSON.stringify({ nodes: accumulatedNodes }, null, 2)}\n\n---\n\nNow analyze this file:\nFile: ${file.path}\n\n${file.content}`
            : `Analyze this file:\nFile: ${file.path}\n\n${file.content}`;

          conversation.push({
            role: "user",
            content: messageContent
          });

          try {
            // Send to Gemini
            const response = await sendMessageToGemini<{ nodes: typeof accumulatedNodes }>(
              Intruction,
              Schema,
              conversation
            );

            console.log(`✅ Gemini response for ${file.path}:`, response);

            // Accumulate the nodes from this response
            if (response && response.nodes && Array.isArray(response.nodes)) {
              accumulatedNodes = [...accumulatedNodes, ...response.nodes];
            }

          } catch (error) {
            console.error(`❌ Failed to process ${file.path}:`, error);
            // Continue with next file instead of failing completely
            continue;
          }
        }

        console.log(`🎯 Generated ${accumulatedNodes.length} total nodes`);

        // Create document with accumulated nodes
        const documentId = await ctx.runMutation(internal.githubAccount.repository.document.mutation.create.document, {
          repositoryId: args.repositoryId,
          nodes: accumulatedNodes
        });

        return {
          success: true,
          documentId,
          processedFiles: processingOrder.length
        };
      }

      const documentId = await ctx.runMutation(internal.githubAccount.repository.document.mutation.create.document, {
        repositoryId: args.repositoryId,
        nodes
      });

      return {
        success: true,
        documentId,
      };
    } catch (error) {
      console.error("❌ Document creation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create document",
      };
    }
  },
});
