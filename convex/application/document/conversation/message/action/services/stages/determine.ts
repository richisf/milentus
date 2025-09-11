interface Message {
  role: "user" | "assistant";
  jsonResponse?: string;
}

/**
 * Determines the current conversation stage based on document state and last AI response
 */
export function determineCurrentStage(
  conversationHistory: Message[],
  document?: { nodes?: Array<unknown> } | null
): string {
  // If document has nodes, we're in details stage
  if (document?.nodes && document.nodes.length > 0) {
    return "details";
  }

  // Find the last assistant message with a JSON response
  const lastAssistantMessage = conversationHistory
    .slice()
    .reverse()
    .find(msg => msg.role === "assistant" && msg.jsonResponse);

  if (!lastAssistantMessage?.jsonResponse) {
    return "concept"; // Default to concept stage
  }

  try {
    const responseData = JSON.parse(lastAssistantMessage.jsonResponse);
    console.log(`📋 Last AI JSON response:`, responseData);

    // Check for stage transition indicators in the JSON
    if (responseData.isComplete) {
      console.log(`✅ Stage: complete (isComplete flag)`);
      return "complete";
    } else if (responseData.shouldProceedToDetails) {
      console.log(`✅ Stage: details (shouldProceedToDetails flag)`);
      return "details";
    } else if (responseData.shouldProceedToFeatures) {
      console.log(`✅ Stage: features (shouldProceedToFeatures flag)`);
      return "features";
    }

    return "concept"; // Default fallback
  } catch (error) {
    console.log(`⚠️ Could not parse last AI message as JSON:`, lastAssistantMessage.jsonResponse.substring(0, 100));
    console.log(`⚠️ Parse error:`, error);
    return "concept"; // Default to concept on parse error
  }
}
