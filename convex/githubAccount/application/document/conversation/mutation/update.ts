import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const conversation = internalMutation({
  args: {
    conversationId: v.id("conversation"),
    userMessage: v.string(),
    aiResponse: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    userMessageId: v.id("message"),
    aiMessageId: v.id("message"),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    userMessageId: Id<"message">;
    aiMessageId: Id<"message">;
  }> => {
    console.log(`💾 Saving messages for conversation: ${args.conversationId}`);

    // Create user message
    const userMessageId = await ctx.runMutation(
      internal.githubAccount.application.document.conversation.message.mutation.create.message,
      {
        conversationId: args.conversationId,
        role: "user",
        content: args.userMessage
      }
    );

    // Create AI response message
    const aiMessageId = await ctx.runMutation(
      internal.githubAccount.application.document.conversation.message.mutation.create.message,
      {
        conversationId: args.conversationId,
        role: "assistant",
        content: args.aiResponse
      }
    );

    console.log(`✅ Messages saved: User=${userMessageId}, AI=${aiMessageId}`);

    return {
      success: true,
      userMessageId,
      aiMessageId,
    };
  },
});
