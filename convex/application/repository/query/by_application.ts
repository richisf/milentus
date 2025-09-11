import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";

export const repository = internalQuery({
  args: {
    applicationId: v.id("application"),
  },
  returns: v.union(
    v.object({
      _id: v.id("repository"),
      _creationTime: v.float64(),
      applicationId: v.id("application"),
      name: v.string(),
      githubAccountId: v.id("githubAccount"),
      accessToken: v.optional(v.string()),
      githubUsername: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const repository = await ctx.db
      .query("repository")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .unique();

    if (!repository) {
      return null;
    }

    // Get GitHub account from application instead of repository
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      return null;
    }

    const githubAccount = await ctx.db.get(application.githubAccountId);

    return {
      ...repository,
      accessToken: githubAccount?.token,
      githubUsername: githubAccount?.username,
    };
  },
});