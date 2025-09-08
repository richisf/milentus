import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";

export const document = internalQuery({
  args: {
    applicationId: v.id("application"),
  },
  returns: v.union(
    v.object({
      _id: v.id("document"),
      _creationTime: v.number(),
      applicationId: v.id("application"),
      nodes: v.array(v.object({
        id: v.string(),
        parentId: v.string(),
        label: v.string(),
        collapsed: v.optional(v.boolean()),
        fileId: v.optional(v.id("files"))
      })),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("document")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .unique(); // Only one document per application
  },
});
