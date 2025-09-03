import { v } from "convex/values";
import { internalMutation } from "@/convex/_generated/server";
import { internal } from "@/convex/_generated/api";

export const githubAccount = internalMutation({
  args: {
    userId: v.optional(v.id("users")), // null for default accounts, set for personal accounts
    token: v.string(),
    username: v.string(),
    isDefault: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if creating a default account
    if (args.isDefault) {
      // Use the existing query to check for default account
      const existingDefault = await ctx.runQuery(internal.githubAccount.query.by_user.githubAccount, {
        userId: undefined, // No specific user
        fallbackToDefault: true // This will return the default account if it exists
      });

      if (existingDefault) {
        throw new Error("A default GitHub account already exists");
      }
    } else if (args.userId) { 
      // Use the existing query to check if user already has a personal GitHub account
      const existingUserAccount = await ctx.runQuery(internal.githubAccount.query.by_user.githubAccount, {
        userId: args.userId,
        fallbackToDefault: false // Only check for user's personal account
      });

      if (existingUserAccount) {
        throw new Error("User already has a GitHub account connected");
      }
    }

    // Check for duplicate username for the same user (or null for default)
    const existingUsername = await ctx.db
      .query("githubAccount")
      .withIndex("by_user_and_username", (q) =>
        q.eq("userId", args.userId).eq("username", args.username)
      )
      .unique();

    if (existingUsername) {
      throw new Error(`GitHub account already connected to another user`);
    }

    await ctx.db.insert("githubAccount", {
      userId: args.userId,
      token: args.token,
      username: args.username,
      isDefault: args.isDefault,
    });
    return null;
  },
});
      