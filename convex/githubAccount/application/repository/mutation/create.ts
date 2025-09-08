import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const repository = internalMutation({
  args: {
    name: v.string(), // Display name for user-facing operations
    applicationId: v.id("application"), // Repository belongs to an application
  },
  returns: v.id("repository"),
  handler: async (ctx, args): Promise<Id<"repository">> => {
    // Get the application to determine if this is a default repository
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }

    // If this is a default repository, ensure no other default exists
    if (!application.userId) {
      const existingDefault = await ctx.db
        .query("repository")
        .filter((q) => q.eq(q.field("applicationId"), args.applicationId))
        .unique();

      if (existingDefault) {
        throw new Error("A default repository already exists for this application");
      }
    }

    // Get GitHub account - use user's account if available, otherwise use default
    const githubAccount = await ctx.runQuery(internal.githubAccount.query.by_user.githubAccount, {
      userId: application.userId,
      fallbackToDefault: true
    });

    if (!githubAccount) {
      throw new Error("No GitHub account available - neither personal nor default account found");
    }

    const existing = await ctx.db
      .query("repository")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .unique();

    if (existing) {
      throw new Error(`Repository "${args.name}" already exists for this application`);
    }

    return await ctx.db.insert("repository", {
      applicationId: args.applicationId,
      githubAccountId: githubAccount._id,
      name: args.name,
    });
  },
});
