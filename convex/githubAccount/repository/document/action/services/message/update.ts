import { sendMessageToGemini } from "@/convex/githubAccount/repository/document/action/services/response";
import { Schema } from "@/convex/githubAccount/repository/document/action/services/message/schema";
import { Intruction } from "@/convex/githubAccount/repository/document/action/services/message/system";

export const processMessageWithGemini = async (
  message: string
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
      role: 'user' | 'assistant' | 'system';
      content: string;
      imageBase64?: string;
    }> = [];

    // Add system instruction
    conversation.push({
      role: "system",
      content: Intruction
    });

    // Add user message
    conversation.push({
      role: "user",
      content: `Create a detailed project plan for: ${message}`
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
