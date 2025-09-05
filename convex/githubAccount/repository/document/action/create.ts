import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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

        const processingOrderPaths = fileCreationResult.processingOrder || [];

        const pathToFile = new Map<string, typeof files[0]>();
        files.forEach(file => {
          pathToFile.set(file.path, file);
        });

        const processingOrder = processingOrderPaths
          .map(path => pathToFile.get(path))
          .filter((file): file is typeof files[0] => file !== undefined);

        console.log(`📋 Using pre-calculated processing order:`, processingOrder.map(f => f.path));

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

          // Calculate the highest existing ID for proper numbering
          const highestId = accumulatedNodes.length > 0 
            ? Math.max(...accumulatedNodes.map(node => parseInt(node.id) || 0))
            : 0;

          // Create unified message content
          const existingNodesContext = accumulatedNodes.length > 0 
            ? `Existing documentation tree:\n${JSON.stringify({ nodes: accumulatedNodes }, null, 2)}\n\n`
            : '';

          const messageContent = `${existingNodesContext}Analyze this code file:

          File: ${file.path}

          ${file.content}

          ${highestId > 0 ? `Continue numbering from ${highestId + 1}.` : ''}`;

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

            // Validate and accumulate the nodes from this response
            if (response && response.nodes && Array.isArray(response.nodes)) {
              // Filter out any nodes that might have duplicate IDs
              const newNodes = response.nodes.filter(newNode => 
                !accumulatedNodes.some(existingNode => existingNode.id === newNode.id)
              );
              
              if (newNodes.length > 0) {
                accumulatedNodes = [...accumulatedNodes, ...newNodes];
                console.log(`📝 Added ${newNodes.length} new nodes from ${file.path}`);
              } else {
                console.log(`⚠️ No new unique nodes from ${file.path} - may be duplicate functionality`);
              }
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
