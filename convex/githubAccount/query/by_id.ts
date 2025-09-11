import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";

export const githubAccount = internalQuery({
  args: {
    githubAccountId: v.id("githubAccount"),
  },
  returns: v.union(v.object({
    _id: v.id("githubAccount"),
    _creationTime: v.number(),
    userId: v.optional(v.string()),
    token: v.string(),
    username: v.string(),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.githubAccountId);
  },
});
