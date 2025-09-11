import { sendMessageToGemini } from "@/convex/application/document/action/update/services/response";
import { Intruction } from "@/convex/application/document/action/update/services/files/system";  
import { Schema } from "@/convex/application/document/action/update/services/files/schema";  

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
        role: 'user' | 'assistant';
        content: string;
        imageBase64?: string;
      }> = [];

      const highestId = accumulatedNodes.length > 0
        ? Math.max(...accumulatedNodes.map(node => parseInt(node.id) || 0))
        : 0;

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

        // Add the incremental nodes from this response
        if (response && response.nodes && Array.isArray(response.nodes)) {
          if (response.nodes.length > 0) {
            accumulatedNodes = [...accumulatedNodes, ...response.nodes];
            console.log(`📝 Added ${response.nodes.length} new nodes from ${file.path}`);
          } else {
            console.log(`⚠️ No new nodes from ${file.path}`);
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
