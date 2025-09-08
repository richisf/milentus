import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { Id } from "@/convex/_generated/dataModel";

export const document = internalMutation({
  args: {
    documentId: v.id("document"),
    nodes: v.array(v.object({
      id: v.string(),
      parentId: v.string(),
      label: v.string(),
      collapsed: v.optional(v.boolean()),
      fileId: v.optional(v.id("files"))
    }))
  },
  returns: v.id("document"),
  handler: async (ctx, args): Promise<Id<"document">> => {
    // Verify document exists
    const existingDocument = await ctx.db.get(args.documentId);
    if (!existingDocument) {
      throw new Error("Document not found");
    }

    // Get existing nodes and combine with new ones
    const existingNodes = existingDocument.nodes || [];
    const combinedNodes = [...existingNodes, ...args.nodes];

    // Update the document with combined nodes
    await ctx.db.patch(args.documentId, {
      nodes: combinedNodes
    });

    return args.documentId;
  },
});
