import { v } from "convex/values";
import { internalQuery } from "../../_generated/server";

export const githubAccount = internalQuery({
  args: {
    userId: v.optional(v.string()), // user subject string
    fallbackToDefault: v.optional(v.boolean()), // If true, falls back to default if user has no GitHub account
  },
  returns: v.union(v.object({
    _id: v.id("githubAccount"),
    _creationTime: v.number(),
    userId: v.optional(v.string()), // user subject string
    token: v.string(),
    username: v.string(),
    isDefault: v.optional(v.boolean()),
  }), v.null()),
  handler: async (ctx, args) => {
    // If userId is provided, try to find a GitHub user for that specific user
    if (args.userId) {
      const userGithubAccount = await ctx.db
        .query("githubAccount")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .unique();

      if (userGithubAccount) {
        return userGithubAccount;
      }
    }

    // If fallback is enabled and no user-specific account found, use default
    if (args.fallbackToDefault) {
      const defaultGithubAccount = await ctx.db
        .query("githubAccount")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .unique();

      return defaultGithubAccount;
    }

    return null;
  },
});