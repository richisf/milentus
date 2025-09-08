import { sendMessageToGemini } from "@/convex/githubAccount/application/document/action/update/services/response";
import { Schema } from "@/convex/githubAccount/application/document/action/update/services/message/schema";
import { Intruction } from "@/convex/githubAccount/application/document/action/update/services/message/system";

export const processMessageWithGemini = async (
  message: string,
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
  error?: string;
}> => {
  try {
    console.log(`💬 Processing message: "${message}"`);

    // Create conversation for Gemini
    const conversation: Array<{
      role: 'user' | 'assistant';
      content: string;
      imageBase64?: string;
    }> = [];

    // Build user message with existing nodes context
    let userMessage = `Create a detailed project plan for: ${message}`;

    if (existingNodes.length > 0) {
      const highestId = Math.max(...existingNodes.map(n => parseInt(n.id)));

      userMessage = `
      Current document nodes: ${JSON.stringify(existingNodes)}

      The document already has nodes with IDs up to ${highestId}. 
      
      ONLY output NEW nodes starting from ID ${highestId + 1}. 
      
      Do NOT include any existing nodes in your response - only the new nodes being added.

      Create a detailed project plan for: ${message}`;
    }

    // Add user message
    conversation.push({
      role: "user",
      content: userMessage
    });

    // Send to Gemini
    const response = await sendMessageToGemini<{
      nodes: Array<{
        id: string;
        parentId: string;
        label: string;
        collapsed?: boolean;
      }>
    }>(
      Intruction,
      Schema,
      conversation
    );

    console.log(`✅ Gemini response for message:`, response);

    // Validate and return the nodes
    if (response && response.nodes && Array.isArray(response.nodes)) {
      return {
        success: true,
        nodes: response.nodes
      };
    } else {
      throw new Error("Invalid response format from Gemini");
    }

  } catch (error) {
    console.error("❌ Message processing error:", error);
    return {
      success: false,
      nodes: [],
      error: error instanceof Error ? error.message : "Failed to process message",
    };
  }
};
