"use node";

import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { repository as createRepository } from "@/convex/application/repository/action/services/create";

export const repository = internalAction({
  args: {
    applicationId: v.id("application"), // Repository belongs to an application
    userId: v.string(), // Always required for user repositories
    name: v.string(), // Repository name
  },
  returns: v.object({
    success: v.boolean(),
    repositoryId: v.optional(v.id("repository")),
    repository: v.optional(v.object({
      _id: v.id("repository"),
      _creationTime: v.number(),
      applicationId: v.id("application"),
      name: v.string(),
      accessToken: v.optional(v.string()),
      githubUsername: v.optional(v.string()),
    })),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    repositoryId?: Id<"repository">,
    repository?: {
      _id: Id<"repository">;
      _creationTime: number;
      applicationId: Id<"application">;
      name: string;
      accessToken?: string;
      githubUsername?: string;
    }
  }> => {
    try {
      // Generate repository name for user applications
      const name = `whitenode-template-${args.name}`;

      // Get the user's GitHub account for repository creation
      const userGithubAccount = await ctx.runQuery(internal.githubAccount.query.by_user.githubAccount, {
        userId: args.userId
      });

      if (!userGithubAccount) {
        throw new Error("No GitHub account found for user - please connect GitHub first");
      }

      // Create the repository on GitHub
      await createRepository(
        userGithubAccount.token,
        "richisf",
        "whitenode-template",
        name,
      );

      // Create repository via mutation
      const repositoryId = await ctx.runMutation(internal.application.repository.mutation.create.repository, {
        name: name,
        applicationId: args.applicationId,
      });

      // Return the repository data
      const repository = {
        _id: repositoryId,
        _creationTime: Date.now(),
        applicationId: args.applicationId,
        name: name,
      };

      return { success: true, repositoryId, repository };
    } catch (error) {
      console.error("Repository creation routing error:", error);
      throw error;
    }
  },
});

