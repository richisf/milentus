import { processStageResponse } from "@/convex/githubAccount/application/document/conversation/message/action/services/stages/process";
import { determineCurrentStage } from "@/convex/githubAccount/application/document/conversation/message/action/services/stages/determine";
import { sendMessageToGemini } from "@/convex/githubAccount/application/document/conversation/message/action/services/create";
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
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get document and determine stage
      const document = await ctx.runQuery(
        internal.githubAccount.application.document.query.by_id.document,
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

      // Generate AI response first to check for automatic stage transitions
      const geminiResponse = await sendMessageToGemini(currentStage, geminiConversation, document?.nodes);
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
        const nextStageResponse = await sendMessageToGemini(nextStage, updatedConversation, document?.nodes);
        console.log(`🤖 Next stage Gemini response for stage ${nextStage}:`, JSON.stringify(nextStageResponse, null, 2));

        // Process and return ONLY the next stage response
        const finalResult = processStageResponse(nextStage, nextStageResponse, args.message);
        console.log(`📋 Final processed result (user will see this):`, JSON.stringify(finalResult, null, 2));
        return finalResult;
      }

      // Process and return response for normal messages (no auto-transition)
      const result = processStageResponse(currentStage, geminiResponse, args.message);
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

