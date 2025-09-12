import { action } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";

export const code = action({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    return await ctx.runMutation(internal.wnAdmin.mutation.create.createCode, {
      code: args.code,
    });
  },
});   
