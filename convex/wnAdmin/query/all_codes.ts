import { query } from "../../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const allCodes = query({
  args: {},
  handler: async (ctx) => {
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

    // Get all codes
    const codes = await ctx.db.query("wnAdmin").collect();

    return codes.map(code => ({
      _id: code._id,
      code: code.code,
      used: code.used,
    }));
  },
});
