interface GeminiResponse {
  response?: string;
  shouldProceedToFeatures?: boolean;
  shouldProceedToDetails?: boolean;
  isComplete?: boolean;
  nodes?: Array<{ id: string; parentId: string; label: string; collapsed?: boolean }>;
}

export function processStageResponse(stage: string, geminiResponse: GeminiResponse, userMessage: string, isInternal: boolean = false) {
  try {
    // Allow empty responses for internal processing OR when AI indicates stage transition
    const hasTransitionFlag = geminiResponse?.shouldProceedToFeatures === true ||
                             geminiResponse?.shouldProceedToDetails === true ||
                             geminiResponse?.isComplete === true;

    if (!geminiResponse?.response && !isInternal && !hasTransitionFlag) {
      throw new Error(`No response from Gemini for stage: ${stage}`);
    }

    const baseResponse = {
      success: true,
      userMessage,
      aiResponse: geminiResponse.response || "", // Conversational text for display (empty string if none)
      aiJsonResponse: JSON.stringify(geminiResponse), // Full JSON response for processing
      shouldUpdateDocument: false,
      nodes: undefined,
      stage,
      error: undefined
    };

    // Handle stage transitions
    switch (stage) {
      case "concept":
        return { ...baseResponse, stage: geminiResponse.shouldProceedToFeatures ? "features" : "concept" };

      case "features":
        if (geminiResponse.shouldProceedToDetails) {
          if (!geminiResponse.nodes || geminiResponse.nodes.length === 0) {
            throw new Error("No nodes provided when transitioning to details stage");
          }
          return {
            ...baseResponse,
            shouldUpdateDocument: isInternal ? false : true, // Don't update document for internal processing
            nodes: geminiResponse.nodes,
            stage: "details"
          };
        }
        return {
          ...baseResponse,
          shouldUpdateDocument: false,
          nodes: undefined,
          stage: "features"
        };

      case "details":
        // Nodes are always required when transitioning to details stage
        if (!geminiResponse.nodes) {
          throw new Error("No nodes provided when transitioning to details stage");
        }
        return {
          ...baseResponse,
          shouldUpdateDocument: isInternal ? false : true, // Update document with nodes during transition
          nodes: geminiResponse.nodes,
          stage: geminiResponse.isComplete ? "complete" : "details"
        };

      default:
        return baseResponse;
    }
  } catch (error) {
    return {
      success: false,
      userMessage: "",
      aiResponse: "",
      aiJsonResponse: undefined,
      shouldUpdateDocument: false,
      nodes: undefined,
      stage,
      error: error instanceof Error ? error.message : "Failed to process stage response",
    };
  }
}
