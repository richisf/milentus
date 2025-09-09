import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";

export const machine = internalMutation({
  args: {
    machineId: v.id("machine"),
    updateData: v.object({
      state: v.string(),
      zone: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
      domain: v.optional(v.string()),
      convexUrl: v.optional(v.string()),
      convexProjectId: v.optional(v.number()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.machineId, args.updateData);
  },
});
