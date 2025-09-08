import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { Id } from "@/convex/_generated/dataModel";

export const document = internalMutation({
  args: {
    documentId: v.id("document"),
    nodes: v.optional(v.array(v.object({
      id: v.string(),
      parentId: v.string(),
      label: v.string(),
      collapsed: v.optional(v.boolean()),
      fileId: v.optional(v.id("files"))
    }))),
    delete: v.optional(v.boolean()),
    replace: v.optional(v.boolean())
  },
  returns: v.id("document"),
  handler: async (ctx, args): Promise<Id<"document">> => {
    // Verify document exists
    const existingDocument = await ctx.db.get(args.documentId);
    if (!existingDocument) {
      throw new Error("Document not found");
    }

    if (args.delete) {
      // Clear all existing nodes
      await ctx.db.patch(args.documentId, {
        nodes: []
      });
    } else if (args.nodes) {
      if (args.replace) {
        // Replace all nodes with the new ones (for import)
        await ctx.db.patch(args.documentId, {
          nodes: args.nodes
        });
      } else {
        // Get existing nodes and combine with new ones (for extend/add)
        const existingNodes = existingDocument.nodes || [];
        const combinedNodes = [...existingNodes, ...args.nodes];

        // Update the document with combined nodes
        await ctx.db.patch(args.documentId, {
          nodes: combinedNodes
        });
      }
    }

    return args.documentId;
  },
});
