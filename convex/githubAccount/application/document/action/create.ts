import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const document = internalAction({
  args: {
    applicationId: v.id("application")
  },
  returns: v.object({
    success: v.boolean(),
    documentId: v.optional(v.id("document")),
    conversationId: v.optional(v.id("conversation")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    documentId?: Id<"document">,
    conversationId?: Id<"conversation">,
    error?: string
  }> => {
    try {
      console.log(`📄 Creating empty document for application: ${args.applicationId}`);

      const documentId = await ctx.runMutation(internal.githubAccount.application.document.mutation.create.document, {
        applicationId: args.applicationId,
        nodes: []
      });

      console.log(`📄 Document created with ID: ${documentId}`);

      // Create an empty conversation for the document
      const conversationResult = await ctx.runAction(internal.githubAccount.application.document.conversation.action.create.conversation, {
        documentId
      });

      if (!conversationResult.success) {
        console.error("❌ Failed to create conversation:", conversationResult.error);
        // Don't fail the whole operation if conversation creation fails
        console.warn("⚠️ Document created but conversation creation failed");
      } else {
        console.log(`💬 Conversation created with ID: ${conversationResult.conversationId}`);
      }

      return {
        success: true,
        documentId,
        conversationId: conversationResult.success ? conversationResult.conversationId : undefined
      };
    } catch (error) {
      console.error("❌ Document creation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create document",
      };
    }
  },
});
