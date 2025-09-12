import { v } from "convex/values";
import { internalQuery } from "@/convex/_generated/server";

export const githubAccount = internalQuery({
  args: {
    userId: v.string(), 
  },
  returns: v.union(v.object({
    _id: v.id("githubAccount"),
    _creationTime: v.number(),
    userId: v.string(),
    token: v.string(),
    username: v.string(),
  }), v.null()),
  handler: async (ctx, args) => {
    const userGithubAccount = await ctx.db
      .query("githubAccount")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    return userGithubAccount;
  },
});