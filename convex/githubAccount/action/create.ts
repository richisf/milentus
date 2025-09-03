"use node";

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { codeForToken } from "@/convex/githubAccount/action/services/exchange";
import { githubAccount as fetchGithubAccount } from "@/convex/githubAccount/action/services/fetch";   

export const githubAccount = action({
  args: {
    userId: v.optional(v.id("users")), // Optional - if not provided, creates default account
    code: v.string(), // OAuth authorization code instead of token
  },
  returns: v.object({
    success: v.boolean(),
    username: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {

      const tokenData = await codeForToken(args.code);

      const userData = await fetchGithubAccount(tokenData.access_token);

      await ctx.runMutation(internal.githubAccount.mutation.create.githubAccount, {
        userId: args.userId,
        token: tokenData.access_token,
        username: userData.login,
        isDefault: !args.userId, // Set as default if no userId provided
      });

      return {
        success: true,
        username: userData.login,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to connect GitHub account",
      };
    }
  },
});
