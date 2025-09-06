import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { processMessageWithGemini } from "@/convex/githubAccount/repository/document/action/update/services/message";

export const processMessage = internalAction({
  args: {
    message: v.string(),
    documentId: v.id("document")
  },
  returns: v.object({ 
    success: v.boolean(),
    nodes: v.array(v.object({
      id: v.string(),
      parentId: v.string(),
      label: v.string(),
      collapsed: v.optional(v.boolean())
    })),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get existing document to retrieve current nodes
    const existingDocument = await ctx.runQuery(internal.githubAccount.repository.document.query.by_id.document, {
      documentId: args.documentId
    });
    if (!existingDocument) {
      return {
        success: false,
        nodes: [],
        error: "Document not found"
      };
    }

    const existingNodes = existingDocument.nodes || [];

    // Process message with Gemini using the extracted function
    const result = await processMessageWithGemini(args.message, existingNodes);

    return {
      success: result.success,
      nodes: result.nodes,
      error: result.error
    };
  },
});
