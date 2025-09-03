import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";

export const repository = internalQuery({
    args: {
      userId: v.optional(v.string()), // user subject string or null
      name: v.string(), // This is the GitHub repository name (not display name)
    },
    returns: v.union(
      v.object({
        _id: v.id("repository"),
        _creationTime: v.number(),
        userId: v.optional(v.string()), // user subject string or null
        githubAccountId: v.id("githubAccount"),
        name: v.string(),
        displayName: v.string(),
        isDefault: v.optional(v.boolean()),
        // Include GitHub user data for consistency with by_id
        accessToken: v.optional(v.string()),
        githubUsername: v.optional(v.string()), // GitHub username 
      }),
      v.null()
    ),
    handler: async (ctx, args) => {
      let repository;
  
      // If userId is provided, look for user's repository by GitHub name
      if (args.userId) {
        repository = await ctx.db
          .query("repository")
          .withIndex("by_user_and_name", (q) =>
            q.eq("userId", args.userId).eq("name", args.name)
          )
          .unique();
      } else {
        // If no userId, look for default repository with this GitHub name
        repository = await ctx.db
          .query("repository")
          .filter((q) => q.eq(q.field("name"), args.name))
          .filter((q) => q.eq(q.field("userId"), null))
          .unique();
      }
  
      if (!repository) {
        return null;
      }
  
      // Get the associated GitHub user to include token and username (same as by_id)
      const githubAccount = await ctx.db.get(repository.githubAccountId);
      if (!githubAccount) {
        return {
          ...repository,
          accessToken: undefined,
          githubUsername: undefined,
        };
      }
  
      return {
        ...repository,
        accessToken: githubAccount.token,
        githubUsername: githubAccount.username,
      };
    },
  });