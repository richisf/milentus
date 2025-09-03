import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";

export const document = internalQuery({
  args: {
    repositoryId: v.id("repository"),
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
    return await ctx.db
      .query("document")
      .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId))
      .unique(); // Only one document per repository
  },
});
