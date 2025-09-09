import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";

export const machine = internalQuery({
  args: {
    applicationId: v.id("application"),
  },
  returns: v.union(
    v.object({
      _id: v.id("machine"),
      _creationTime: v.number(),
      applicationId: v.id("application"),
      name: v.string(),
      zone: v.string(),
      state: v.string(),
      ipAddress: v.optional(v.string()),
      domain: v.optional(v.string()),
      convexUrl: v.optional(v.string()),
      convexProjectId: v.optional(v.number()),
      deployKey: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("machine")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .unique(); // Only one machine per application
  },
});
