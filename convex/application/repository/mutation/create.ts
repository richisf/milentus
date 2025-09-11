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
    const application = await ctx.runQuery(internal.application.query.by_id.application, {
      applicationId: args.applicationId,
    });

    if (!application) {
      throw new Error("Application not found");
    }

    // If this is a default repository, ensure no other default exists
    if (!application.userId) {
      const existingRepository = await ctx.runQuery(internal.application.repository.query.by_application.repository, {
        applicationId: args.applicationId,
      });

      if (existingRepository) {
        throw new Error("A default repository already exists for this application");
      }
    }

    // Check if a repository with this name already exists
    const nameExists = await ctx.runQuery(internal.application.repository.query.by_application_name.existsByName, {
      applicationId: args.applicationId,
      name: args.name,
    });

    if (nameExists) {
      throw new Error(`Repository "${args.name}" already exists for this application`);
    }

    // Repository inherits GitHub account from its application
    return await ctx.db.insert("repository", {
      applicationId: args.applicationId,
      name: args.name,
      githubAccountId: application.githubAccountId,
    });
  },
});
