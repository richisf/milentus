"use node";

import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { repository as createRepository } from "@/convex/githubAccount/application/repository/action/services/create";

export const repository = internalAction({
  args: {
    applicationId: v.id("application"), // Repository belongs to an application
    userId: v.optional(v.string()), // If not provided, creates default repository
    name: v.string(), // Repository name (application name for user repos, fixed for defaults)
  },
  returns: v.object({
    success: v.boolean(),
    repositoryId: v.optional(v.id("repository")),
    repository: v.optional(v.object({
      _id: v.id("repository"),
      _creationTime: v.number(),
      applicationId: v.id("application"),
      githubAccountId: v.id("githubAccount"),
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
      githubAccountId: Id<"githubAccount">;
      name: string;
      accessToken?: string;
      githubUsername?: string;
    }
  }> => {
    try {

      let name: string;

      if (!args.userId) {
        name = args.name;
      } else {
        name = `whitenode-template-${args.name}`;
      }

      if (args.userId) {

        const defaultgithubAccount = await ctx.runQuery(internal.githubAccount.query.by_user.githubAccount, {
          userId: undefined,
          fallbackToDefault: true,
        });

        if (!defaultgithubAccount) {
          throw new Error("No default GitHub account found");
        }

        await createRepository(
          defaultgithubAccount.token,
          "richisf",
          "whitenode-template",
          name,
        );
      }

      const repositoryId = await ctx.runMutation(internal.githubAccount.application.repository.mutation.create.repository, {
        name: name,
        applicationId: args.applicationId,
      });

      // Get the complete repository object to return it
      const repository = await ctx.runQuery(internal.githubAccount.application.repository.query.by_application.repository, {
        applicationId: args.applicationId,
      });

      if (!repository) {
        throw new Error("Repository was created but could not be retrieved");
      }

      return { success: true, repositoryId, repository };
    } catch (error) {
      console.error("Repository creation routing error:", error);
      throw error;
    }
  },
});

