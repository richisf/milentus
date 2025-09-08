import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";

export const by_document = internalQuery({
  args: {
    documentId: v.id("document"),
  },
  returns: v.array(v.object({
    _id: v.id("conversation"),
    _creationTime: v.number(),
    documentId: v.id("document"),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversation")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();
  },
});