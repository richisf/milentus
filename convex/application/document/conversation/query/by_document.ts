import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";

export const by_document = internalQuery({
  args: {
    documentId: v.id("document"),
  },
  returns: v.union(
    v.object({
      _id: v.id("conversation"),
      _creationTime: v.float64(),
      documentId: v.id("document"),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversation")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .first(); // Get single conversation instead of array
  },
});

export const by_id = internalQuery({
  args: {
    conversationId: v.id("conversation"),
  },
  returns: v.union(
    v.object({
      _id: v.id("conversation"),
      _creationTime: v.float64(),
      documentId: v.id("document"),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});