import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const repository = internalMutation({
  args: {
    name: v.string(), // Display name for user-facing operations
    applicationId: v.id("application"), // Repository belongs to an application
    githubAccountId: v.id("githubAccount"), // Passed down to avoid fetching application
  },
  returns: v.id("repository"),
  handler: async (ctx, args): Promise<Id<"repository">> => {
    // Check if a repository with this name already exists
    const nameExists = await ctx.runQuery(internal.application.repository.query.by_application_name.existsByName, {
      applicationId: args.applicationId,
      name: args.name,
    });

    if (nameExists) {
      throw new Error(`Repository "${args.name}" already exists for this application`);
    }

    // Direct database insertion for user repositories with explicit githubAccountId
    return await ctx.db.insert("repository", {
      applicationId: args.applicationId,
      name: args.name,
      githubAccountId: args.githubAccountId,
    });
  },
});
