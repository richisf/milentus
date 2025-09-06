import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const document = action({
  args: {
    documentId: v.id("document")
  },
  returns: v.object({
    success: v.boolean(),
    documentId: v.optional(v.id("document")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    documentId?: Id<"document">,
    error?: string
  }> => {
    try {
      console.log(`🗑️ Deleting document: ${args.documentId}`);

      const deletedDocumentId = await ctx.runMutation(internal.githubAccount.repository.document.mutation.delete.document, {
        documentId: args.documentId
      });

      console.log(`✅ Document deleted: ${deletedDocumentId}`);

      return {
        success: true,
        documentId: deletedDocumentId
      };
    } catch (error) {
      console.error("❌ Document deletion error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete document",
      };
    }
  },
});
