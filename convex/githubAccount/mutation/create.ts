import { v } from "convex/values";
import { internalMutation } from "@/convex/_generated/server";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { VALID_ROLES } from "../../lib/permissions";

export const githubAccount = internalMutation({
  args: {
    userId: v.string(), // Required: Authenticated user ID (matches schema)
    token: v.string(),
    username: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check 1: Prevent duplicate user accounts
    const existingUserAccount = await ctx.runQuery(internal.githubAccount.query.by_user.githubAccount, {
      userId: args.userId
    });

    if (existingUserAccount) {
      throw new Error("User already has a GitHub account");
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

    const user = await ctx.db.get(args.userId as Id<"users">);
    if (user?.role === VALID_ROLES.WHITENODE_ADMIN) {

      const applicationId = await ctx.db.insert("application", {
        userId: args.userId,
        name: "whitenode-template",
        githubAccountId: githubAccountId,
      });

      await ctx.db.insert("repository", {
        applicationId: applicationId,
        name: "whitenode-template"
      });
    }

    return null;
  },
});
      