import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";

export const create = internalMutation({
  args: {
    name: v.string(),
    userId: v.optional(v.string()),
  },
  returns: v.id("application"),
  handler: async (ctx, args) => {
    // Get the appropriate GitHub account for this application
    let githubAccount;

    // If userId is provided, try to find a GitHub account for that specific user
    if (args.userId) {
      githubAccount = await ctx.db
        .query("githubAccount")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .unique();

      if (githubAccount) {
        return await ctx.db.insert("application", {
          name: args.name,
          userId: args.userId,
          githubAccountId: githubAccount._id,
        });
      }
    }

    // If no user-specific account found, use default account
    githubAccount = await ctx.db
      .query("githubAccount")
      .withIndex("by_user", (q) => q.eq("userId", undefined))
      .unique();

    if (!githubAccount) {
      throw new Error("No GitHub account available - neither personal nor default account found");
    }

    return await ctx.db.insert("application", {
      name: args.name,
      userId: args.userId,
      githubAccountId: githubAccount._id,
    });
  },
});
