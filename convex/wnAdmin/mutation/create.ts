import { internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createCode = internalMutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not signed in");
    }

    // Get user and check role
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "whitenode-admin") {
      throw new Error("Unauthorized - Admin access required");
    }

    // Check if code already exists
    const existingCode = await ctx.db
      .query("wnAdmin")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (existingCode) {
      throw new Error("Code already exists");
    }

    // Create new code
    await ctx.db.insert("wnAdmin", {
      code: args.code,
      used: false,
    });

    return { success: true };
  },
});
