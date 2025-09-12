import { mutation } from "../../_generated/server";
import { v } from "convex/values";

export const markUsed = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    // Validate input
    if (!args.code || typeof args.code !== 'string' || args.code.trim() === '') {
      throw new Error("Invalid code provided");
    }
    // Special case for admin user
    if (args.code === "admin@white-node.com") {
      let adminCodeEntry = await ctx.db
        .query("wnAdmin")
        .withIndex("by_code", (q) => q.eq("code", args.code))
        .first();

      // Create admin code if it doesn't exist
      if (!adminCodeEntry) {
        const adminCodeId = await ctx.db.insert("wnAdmin", {
          code: "admin@white-node.com",
          used: false
        });
        adminCodeEntry = await ctx.db.get(adminCodeId);
      }

      // Admin code can be reused - always mark as used for admin
      await ctx.db.patch(adminCodeEntry!._id, { used: true });
      return { success: true, isAdmin: true };
    }

    // Regular code validation
    const codeEntry = await ctx.db
      .query("wnAdmin")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();

    if (!codeEntry) {
      throw new Error("Code not found");
    }

    if (codeEntry.used) {
      throw new Error("Code already used");
    }

    await ctx.db.patch(codeEntry._id, { used: true });

    return { success: true, isAdmin: false };
  },
});
