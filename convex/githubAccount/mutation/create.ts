import { v } from "convex/values";
import { internalMutation } from "@/convex/_generated/server";
import { internal } from "@/convex/_generated/api";

export const githubAccount = internalMutation({
  args: {
    userId: v.optional(v.id("users")), // null for default accounts, set for personal accounts
    token: v.string(),
    username: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check 1: Prevent duplicate user accounts
    const existingUserAccount = await ctx.runQuery(internal.githubAccount.query.by_user.githubAccount, {
      userId: args.userId,
      fallbackToDefault: !args.userId // Only fallback to default when creating default account
    });

    if (existingUserAccount) {
      const errorMessage = args.userId
        ? "User already has a GitHub account"
        : "Default GitHub account already exists";
      throw new Error(errorMessage);
    }

    // Check 2: Prevent username conflicts
    const existingUsername = await ctx.runQuery(internal.githubAccount.query.by_user_username.githubAccount, {
      userId: args.userId,
      username: args.username,
    });

    if (existingUsername) {
      throw new Error("GitHub username already taken");
    }

    // Create the account
    const githubAccountId = await ctx.db.insert("githubAccount", {
      userId: args.userId,
      token: args.token,
      username: args.username,
    });

    // If this is a default account (no userId), automatically create default application and repository
    if (!args.userId) {
      // Create default application directly in database
      const applicationId = await ctx.db.insert("application", {
        userId: undefined,
        name: "whitenode-template",
        githubAccountId: githubAccountId,
      });

      // Create default repository directly in database
      await ctx.db.insert("repository", {
        applicationId: applicationId,
        name: "whitenode-template",
        githubAccountId: githubAccountId,
      });
    }

    return null;
  },
});
      