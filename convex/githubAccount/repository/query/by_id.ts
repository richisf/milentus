import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";

export const repository = internalQuery({
    args: {
      repositoryId: v.id("repository"),
    },
    returns: v.union(
      v.object({
        _id: v.id("repository"),
        _creationTime: v.number(),
        userId: v.optional(v.string()),
        githubAccountId: v.id("githubAccount"),
        name: v.string(),
        displayName: v.string(),
        isDefault: v.optional(v.boolean()),
        // Include GitHub user data for repository setup
        accessToken: v.optional(v.string()),
        githubUsername: v.optional(v.string()), // GitHub username 
        // Include machine information (one-to-one relationship)
        machine: v.optional(v.object({
          _id: v.id("machine"),
          _creationTime: v.number(),
          repositoryId: v.id("repository"),
          name: v.string(),
          zone: v.string(),
          state: v.string(),
          ipAddress: v.optional(v.string()),
          domain: v.optional(v.string()),
          convexUrl: v.optional(v.string()),
          convexProjectId: v.optional(v.number()),
        })),
      }),
      v.null()
    ),
    handler: async (ctx, args) => {
      const repository = await ctx.db.get(args.repositoryId);
      if (!repository) {
        return null;
      }
  
      // Get the associated GitHub user to include token and username
      const githubAccount = await ctx.db.get(repository.githubAccountId);
      if (!githubAccount) {
        return {
          ...repository,
          accessToken: undefined,
          githubUsername: undefined,
          machine: undefined,
        };
      }
  
      // Get the associated machine (one-to-one relationship)
      const machine = await ctx.db
        .query("machine")
        .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId))
        .unique();
  
      return {
        ...repository,
        accessToken: githubAccount.token,
        githubUsername: githubAccount.username,
        machine: machine || undefined,
      };
    },
  });
  
  