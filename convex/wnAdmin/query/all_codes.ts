import { v } from "convex/values";
import { query } from "@/convex/_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { checkPermission, VALID_ROLES } from "../../lib/permissions";
import { Id } from "@/convex/_generated/dataModel";

type WnAdminCode = {
  _id: Id<"wnAdmin">;
  _creationTime: number;
  code: string;
  used: boolean;
};

export const allCodes = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("wnAdmin"),
    _creationTime: v.number(),
    code: v.string(),
    used: v.boolean(),
  })),
  handler: async (ctx): Promise<WnAdminCode[]> => {
    // Check if user is authenticated
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not signed in");
    }

    // Check if user has whitenode-admin permissions
    const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.WHITENODE_ADMIN);
    if (!hasAccess) {
      throw new Error("Unauthorized - Admin access required");
    }

    // Get all codes using the by_used index for better performance
    const codes = await ctx.db.query("wnAdmin").collect();

    return codes.map(code => ({
      _id: code._id,
      _creationTime: code._creationTime,
      code: code.code,
      used: code.used,
    }));
  },
});
