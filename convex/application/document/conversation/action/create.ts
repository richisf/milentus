import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const conversation = internalAction({
  args: {
    documentId: v.id("document")
  },
  returns: v.object({
    success: v.boolean(),
    conversationId: v.optional(v.id("conversation")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    conversationId?: Id<"conversation">,
    error?: string
  }> => {
    try {
      console.log(`💬 Creating empty conversation for document: ${args.documentId}`);

      const conversationId = await ctx.runMutation(internal.application.document.conversation.mutation.create.conversation, {
        documentId: args.documentId
      });

      return {
        success: true,
        conversationId
      };
    } catch (error) {
      console.error("❌ Conversation creation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create conversation",
      };
    }
  },
});
