import { sendMessageToGemini } from "@/convex/githubAccount/repository/document/action/update/services/response";
import { Intruction } from "@/convex/githubAccount/repository/document/action/update/services/files/system";
import { Schema } from "@/convex/githubAccount/repository/document/action/update/services/message/schema";

export const processFilesWithGemini = async (
  processingOrder: Array<{
    path: string;
    content: string;
    // Add other properties from the file object as needed
  }>,
  existingNodes: Array<{
    id: string;
    parentId: string;
    label: string;
    collapsed?: boolean;
  }> = []
): Promise<{
  success: boolean;
  nodes: Array<{
    id: string;
    parentId: string;
    label: string;
    collapsed?: boolean;
  }>;
  processedFiles: number;
  error?: string;
}> => {
  try {
    console.log(`📂 Processing ${processingOrder.length} files through Gemini...`);

    let accumulatedNodes = [...existingNodes];

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
        const response = await sendMessageToGemini<{
          nodes: typeof accumulatedNodes
        }>(
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

    return {
      success: true,
      nodes: accumulatedNodes,
      processedFiles: processingOrder.length
    };
  } catch (error) {
    console.error("❌ File-based document processing error:", error);
    return {
      success: false,
      nodes: [],
      processedFiles: 0,
      error: error instanceof Error ? error.message : "Failed to process files into nodes",
    };
  }
};
