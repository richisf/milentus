import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";

export const githubAccount = internalMutation({
  args: {
    userId: v.id("users"), // Required for personal accounts
  },
  returns: v.null(),
  handler: async (ctx, args) => {

    const githubAccount = await ctx.runQuery(internal.githubAccount.query.by_user.githubAccount, {
      userId: args.userId,
      fallbackToDefault: false
    });

    if (!githubAccount) {
      throw new Error(`GitHub account not found for user`);
    }

    await ctx.db.delete(githubAccount._id);
    return null;
  },
});