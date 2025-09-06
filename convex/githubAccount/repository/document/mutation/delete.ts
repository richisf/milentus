import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { Id } from "@/convex/_generated/dataModel";

export const document = internalMutation({
  args: {
    documentId: v.id("document")
  },
  returns: v.id("document"),
  handler: async (ctx, args): Promise<Id<"document">> => {
    // Verify document exists
    const existingDocument = await ctx.db.get(args.documentId);
    if (!existingDocument) {
      throw new Error("Document not found");
    }

    // Delete the document
    await ctx.db.delete(args.documentId);

    return args.documentId;
  },
});
