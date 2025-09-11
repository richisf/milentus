interface GeminiResponse {
  response?: string;
  shouldProceedToFeatures?: boolean;
  shouldProceedToDetails?: boolean;
  hasChanges?: boolean; // For details stage - indicates new nodes to add
  restartContext?: boolean; // For details stage - indicates next interaction should use fresh context
  nodes?: Array<{ id: string; parentId: string; label: string; collapsed?: boolean }>; // For features stage
  newNodes?: Array<{ id: string; parentId: string; label: string; collapsed?: boolean }>; // For details stage - only NEW nodes
  kickoffMessage?: string; // For features->details transition
}

export function processStageResponse(stage: string, geminiResponse: GeminiResponse, userMessage: string, isInternal: boolean = false, restartContextOverride?: boolean) {
  try {
    // Allow empty responses for internal processing OR when AI indicates stage transition or changes
    // Note: Features->Details transitions use kickoffMessage field for transition guidance
    const hasTransitionFlag = geminiResponse?.shouldProceedToFeatures === true ||
                             geminiResponse?.shouldProceedToDetails === true ||
                             geminiResponse?.hasChanges === true;

    if (!geminiResponse?.response && !isInternal && !hasTransitionFlag) {
      throw new Error(`No response from Gemini for stage: ${stage}`);
    }

    // Prepare the JSON response for storage, including any restart context overrides
    const jsonResponseForStorage = {
      ...geminiResponse,
      restartContext: restartContextOverride !== undefined ? restartContextOverride : (geminiResponse.restartContext || false)
    };

    const baseResponse = {
      success: true,
      userMessage,
      aiResponse: geminiResponse.response || "", // Conversational text for display (empty string if none)
      aiJsonResponse: JSON.stringify(jsonResponseForStorage), // Full JSON response for processing
      shouldUpdateDocument: false,
      nodes: undefined,
      stage,
      restartContext: restartContextOverride !== undefined ? restartContextOverride : (geminiResponse.restartContext || false), // Use override if provided, otherwise use AI response
      error: undefined
    };

    // Handle stage transitions
    switch (stage) {
      case "concept":
        return { ...baseResponse, stage: geminiResponse.shouldProceedToFeatures ? "features" : "concept" };

      case "features":
        if (geminiResponse.shouldProceedToDetails) {
          return {
            ...baseResponse,
            aiResponse: geminiResponse.kickoffMessage || "", // Use kickoff message for transition
            shouldUpdateDocument: isInternal ? false : Boolean(geminiResponse.nodes && geminiResponse.nodes.length > 0), // Only update document if nodes are provided
            nodes: geminiResponse.nodes,
            stage: "details",
            restartContext: true // Automatically restart context when transitioning to details
          };
        }
        return {
          ...baseResponse,
          shouldUpdateDocument: false,
          nodes: undefined,
          stage: "features"
        };

      case "details":
        // Handle details stage - can have changes (new nodes) or just conversational response
        if (geminiResponse.hasChanges && geminiResponse.newNodes) {
          return {
            ...baseResponse,
            shouldUpdateDocument: isInternal ? false : true, // Extend document with NEW nodes only
            nodes: geminiResponse.newNodes, // Only the NEW nodes to add
            stage: "details"
          };
        } else {
          // No changes, just conversational response - stay in details stage
          return {
            ...baseResponse,
            shouldUpdateDocument: false,
            nodes: undefined,
            stage: "details"
          };
        }

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
