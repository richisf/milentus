"use node";

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { createGithubAccount } from "@/convex/githubAccount/action/services/create";
import { getAuthUserId } from "@convex-dev/auth/server";   

export const githubAccount = action({
  args: {
    code: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    username: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {

      const currentUserId = await getAuthUserId(ctx);
      if (!currentUserId) {
        throw new Error("Authentication required");
      }

      const accountData = await createGithubAccount(args.code);

      await ctx.runMutation(internal.githubAccount.mutation.create.githubAccount, {
        userId: currentUserId,
        token: accountData.token,
        username: accountData.userData.login,
      });

      return {
        success: true,
        username: accountData.userData.login,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to connect GitHub account",
      };
    }
  },
});