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

    // Update the document with new nodes
    await ctx.db.patch(args.documentId, {
      nodes: args.nodes
    });

    return args.documentId;
  },
});
