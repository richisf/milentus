"use node";

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { api, internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { checkPermission, VALID_ROLES } from "../../lib/permissions"; 

export const create = action({
  args: {
    name: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    applicationId: v.optional(v.id("application")),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    applicationId?: Id<"application">
  }> => {
    try {

      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Not signed in");

      const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.ADMIN);
      if (!hasAccess) throw new Error("Admin permissions required to create applications");

      let githubAccount = await ctx.runQuery(internal.githubAccount.query.by_user.githubAccount, {
        userId: userId
      });

      if (!githubAccount) {
        const whiteNodeAdminData = await ctx.runQuery(api.auth.getAdminById, {});

        if (!whiteNodeAdminData?.githubAccount) {
          throw new Error("WhiteNode admin GitHub account not found");
        }

        githubAccount = whiteNodeAdminData.githubAccount;
      }

      const applicationId = await ctx.runMutation(internal.application.mutation.create.create, {
        name: args.name,
        userId: userId,
        githubAccountId: githubAccount._id,
      });

      const actionsResult = await ctx.runAction(internal.application.action.services.create.create, {
        applicationId: applicationId,
        name: args.name,
        userId: userId,
        githubAccountId: githubAccount._id,
      });

      if (!actionsResult.success) {
        throw new Error(`Application created but repository/machine creation failed`);
      }

      return {
        success: true,
        applicationId,
      };
    } catch (error) {
      console.error("Application creation error:", error);
      throw error;
    }
  },
});
