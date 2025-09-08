import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";

export const repository = internalQuery({
  args: {
    applicationId: v.id("application"),
  },
  returns: v.union(
    v.object({
      _id: v.id("repository"),
      _creationTime: v.number(),
      applicationId: v.id("application"),
      githubAccountId: v.id("githubAccount"),
      name: v.string(),
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

    const githubAccount = await ctx.db.get(repository.githubAccountId);

    return {
      ...repository,
      accessToken: githubAccount?.token,
      githubUsername: githubAccount?.username,
    };
  },
});
