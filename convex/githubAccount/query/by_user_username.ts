import { v } from "convex/values";
import { internalQuery } from "@/convex/_generated/server";

export const githubAccount = internalQuery({
  args: {
    userId: v.string(), // Required: authenticated user ID
    username: v.string(),
  },
  returns: v.union(v.object({
    _id: v.id("githubAccount"),
    _creationTime: v.number(),
    userId: v.string(), // Required: always owned by authenticated user
    token: v.string(),
    username: v.string(),
  }), v.null()),
  handler: async (ctx, args) => {
    const existingAccount = await ctx.db
      .query("githubAccount")
      .withIndex("by_user_and_username", (q) =>
        q.eq("userId", args.userId).eq("username", args.username)
      )
      .unique();

    return existingAccount;
  },
});
