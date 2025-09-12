import { query } from "../../_generated/server";
import { v } from "convex/values";

export const byCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    // Validate input
    if (!args.code || typeof args.code !== 'string' || args.code.trim() === '') {
      return null;
    }

    const codeEntry = await ctx.db
      .query("wnAdmin")
      .withIndex("by_code", (q) => q.eq("code", args.code.trim()))
      .first();

    if (!codeEntry) {
      return null;
    }

    return {
      _id: codeEntry._id,
      code: codeEntry.code,
      used: codeEntry.used,
    };
  },
});
