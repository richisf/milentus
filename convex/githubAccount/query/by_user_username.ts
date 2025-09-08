import { v } from "convex/values";
import { internalQuery } from "@/convex/_generated/server";

export const githubAccount = internalQuery({
  args: {
    userId: v.optional(v.string()), // user subject string or null for default
    username: v.string(),
  },
  returns: v.union(v.object({
    _id: v.id("githubAccount"),
    _creationTime: v.number(),
    userId: v.optional(v.string()),
    token: v.string(),
    username: v.string(),
  }), v.null()),
  handler: async (ctx, args) => {
    // Check if this GitHub username is already connected to any user
    const existingAccount = await ctx.db
      .query("githubAccount")
      .withIndex("by_user_and_username", (q) =>
        q.eq("userId", args.userId).eq("username", args.username)
      )
      .unique();

    return existingAccount;
  },
});
