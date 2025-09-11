import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";

// Check if a repository with the given name exists for the application
export const existsByName = internalQuery({
  args: {
    applicationId: v.id("application"),
    name: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("repository")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .unique();

    return existing !== null;
  },
});
