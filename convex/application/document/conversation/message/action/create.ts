import { processStageResponse } from "@/convex/application/document/conversation/message/action/services/stages/process";
import { determineCurrentStage } from "@/convex/application/document/conversation/message/action/services/stages/determine";
import { sendMessageToGemini } from "@/convex/application/document/conversation/message/action/services/create";
import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";

export const message = internalAction({
  args: {
    message: v.string(),
    conversationHistory: v.array(v.object({
      _id: v.id("message"),
      _creationTime: v.number(),
      conversationId: v.id("conversation"),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      jsonResponse: v.optional(v.string()),
      order: v.number(),
      contextRestarted: v.optional(v.boolean()),
    })),
    documentId: v.id("document"),
  },
  returns: v.object({
    success: v.boolean(),
    userMessage: v.string(),
    aiResponse: v.string(),
    aiJsonResponse: v.optional(v.string()), // Full JSON response from AI
    shouldUpdateDocument: v.boolean(),
    nodes: v.optional(v.array(v.object({
      id: v.string(),
      parentId: v.string(),
      label: v.string(),
      collapsed: v.optional(v.boolean()),
    }))),
    stage: v.string(),
    restartContext: v.optional(v.boolean()), // Whether next interaction should restart context
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get document and determine stage
      const document = await ctx.runQuery(
        internal.application.document.query.by_id.document,
        { documentId: args.documentId }
      );

      // Determine current conversation stage
      const currentStage = determineCurrentStage(args.conversationHistory, document || undefined);

      console.log(`🎯 Current conversation stage: ${currentStage}`);
      console.log(`📊 Progress: ${args.conversationHistory.length} messages, ${document?.nodes?.length || 0} nodes`);

      // Format conversation for Gemini
      const geminiConversation = [
        ...args.conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content
        })),
        { role: "user" as const, content: args.message }
      ];

      // Check if we should restart context based on previous AI response
      const lastAiMessage = args.conversationHistory
        .slice()
        .reverse()
        .find(msg => msg.role === "assistant" && msg.jsonResponse);
      
      let shouldRestartContext = false;
      if (lastAiMessage?.jsonResponse) {
        try {
          const lastAiData = JSON.parse(lastAiMessage.jsonResponse);
          shouldRestartContext = lastAiData.restartContext === true;
          if (shouldRestartContext) {
            console.log("🔄 Previous AI requested context restart - using fresh context");
          }
        } catch {
          console.log("⚠️ Could not parse last AI response for restart context check");
        }
      }

      // Generate AI response first to check for automatic stage transitions
      const geminiResponse = await sendMessageToGemini(currentStage, geminiConversation, document?.nodes, shouldRestartContext);
      console.log(`🤖 Gemini response for stage ${currentStage}:`, JSON.stringify(geminiResponse, null, 2));

      // Check if AI indicates we should proceed to next stage (automatic transition)
      const shouldAutoProceed = (
        geminiResponse.shouldProceedToFeatures === true ||
        geminiResponse.shouldProceedToDetails === true ||
        geminiResponse.isComplete === true
      );

      // If AI indicates proceed, generate next stage response
      if (shouldAutoProceed) {
        console.log("🔄 AI indicated stage transition - generating next stage response");

        // Process the current response internally (never shown to user)
        const internalResult = processStageResponse(currentStage, geminiResponse, args.message, true);
        console.log(`📋 Internal processed result:`, JSON.stringify(internalResult, null, 2));

        // Determine next stage
        let nextStage = "features";
        if (currentStage === "features") nextStage = "details";
        if (currentStage === "details") nextStage = "complete";

        console.log(`🔄 Transitioning to next stage: ${nextStage}`);

        // Update conversation with the internal response for context (but don't show it)
        const updatedConversation = [
          ...geminiConversation,
          { role: "assistant" as const, content: geminiResponse.response || "" }
        ];

        // Generate response for the next stage (this is what the user will see)
        // Auto-restart context when transitioning from features to details
        const shouldAutoRestart = geminiResponse.shouldProceedToDetails === true;
        if (shouldAutoRestart) {
          console.log("🔄 Auto-restarting context for features→details transition");
        }

        // For auto-restart, use only the current user message to start fresh
        const conversationForNextStage = shouldAutoRestart
          ? [{ role: "user" as const, content: args.message }]
          : updatedConversation;

        const nextStageResponse = await sendMessageToGemini(nextStage, conversationForNextStage, document?.nodes, shouldAutoRestart);
        console.log(`🤖 Next stage Gemini response for stage ${nextStage}:`, JSON.stringify(nextStageResponse, null, 2));

        // Process and return ONLY the next stage response
        // For features→details transition, always restart context
        const restartContextOverride = shouldAutoRestart ? true : undefined;
        const finalResult = processStageResponse(nextStage, nextStageResponse, args.message, restartContextOverride);

        // Include restartContext in the JSON response for the next message to detect
        if (shouldAutoRestart && finalResult.aiJsonResponse) {
          try {
            const jsonResponse = JSON.parse(finalResult.aiJsonResponse);
            jsonResponse.restartContext = true;
            finalResult.aiJsonResponse = JSON.stringify(jsonResponse);
            console.log("🔄 Setting restartContext flag for next user interaction");
          } catch {
            console.log("⚠️ Could not modify JSON response to include restartContext");
          }
        }

        console.log(`📋 Final processed result (user will see this):`, JSON.stringify(finalResult, null, 2));
        return finalResult;
      }

      // Process and return response for normal messages (no auto-transition)
      const result = processStageResponse(currentStage, geminiResponse, args.message, false);
      return result;

    } catch (error) {
      console.error("❌ Message processing error:", error);
      return {
        success: false,
        userMessage: "",
        aiResponse: "",
        aiJsonResponse: undefined,
        shouldUpdateDocument: false,
        nodes: undefined,
        stage: "concept",
        error: error instanceof Error ? error.message : "Failed to process message",
      };
    }
  },
});

