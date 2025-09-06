import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";

export const document = internalQuery({
  args: {
    documentId: v.id("document"),
  },
  returns: v.union(
    v.object({
      _id: v.id("document"),
      _creationTime: v.number(),
      repositoryId: v.id("repository"),
      nodes: v.array(v.object({
        id: v.string(),
        parentId: v.string(),
        label: v.string(),
        collapsed: v.optional(v.boolean())
      }))
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});
