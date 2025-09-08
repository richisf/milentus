import { v } from "convex/values";
import { internalQuery } from "@/convex/_generated/server";

export const application = internalQuery({
  args: {
    applicationId: v.id("application"),
  },
  returns: v.union(v.object({
    _id: v.id("application"),
    _creationTime: v.number(),
    userId: v.optional(v.string()),
    name: v.string(),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.applicationId);
  },
});
