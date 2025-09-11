import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";

export const files = internalQuery({
  args: {
      repositoryId: v.id("repository"),
  },
  returns: v.array(v.object({
    _id: v.id("files"),
    _creationTime: v.number(),
    repositoryId: v.id("repository"),
    path: v.string(),
    content: v.string(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
      .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId))
      .collect();
  },
});
