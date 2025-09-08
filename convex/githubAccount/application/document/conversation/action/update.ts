import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const conversation = internalAction({
  args: {
    conversationId: v.id("conversation"),
    message: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    response: v.string(),
    messageId: v.id("message"),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    response: string;
    messageId: Id<"message">;
    error?: string;
  }> => {
    console.log(`💬 Processing conversation message for conversation: ${args.conversationId}`);

    // Step 1: Process message with Gemini (get user message and AI response)
    const messageResult = await ctx.runAction(
      internal.githubAccount.application.document.conversation.message.action.create.message,
      {
        message: args.message,
        conversationId: args.conversationId
      }
    );

    if (!messageResult.success) {
      return {
        success: false,
        response: "",
        messageId: "" as Id<"message">,
        error: messageResult.error
      };
    }

    // Step 2: Save both messages via conversation mutation
    const saveResult = await ctx.runMutation(
      internal.githubAccount.application.document.conversation.mutation.update.conversation,
      {
        conversationId: args.conversationId,
        userMessage: messageResult.userMessage,
        aiResponse: messageResult.aiResponse
      }
    );

    return {
      success: true,
      response: messageResult.aiResponse,
      messageId: saveResult.aiMessageId,
    };
  },
});
