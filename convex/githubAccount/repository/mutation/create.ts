import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";

export const repository = internalMutation({
  args: {
    userId: v.optional(v.string()), // User subject string or null for default repositories
    name: v.string(), // Display name for user-facing operations
    githubRepoName: v.optional(v.string()), // GitHub repository name (transformed)
    isDefault: v.optional(v.boolean()), // New field to mark as default repository
  },
  returns: v.id("repository"),
  handler: async (ctx, args): Promise<Id<"repository">> => {
    // If creating a default repository, userId should be null
    if (args.isDefault) {
      args.userId = undefined;
    }

    // If this is a default repository, ensure no other default exists
    if (args.isDefault) {
      const existingDefault = await ctx.db
        .query("repository")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .unique();

      if (existingDefault) {
        throw new Error("A default repository already exists");
      }
    }

    // Get GitHub account - either user's or default
    let githubAccount: Doc<"githubAccount"> | null = null;

    if (args.userId) {
      // For personal repositories, get user's GitHub account with fallback to default
      githubAccount = await ctx.runQuery(internal.githubAccount.query.by_user.githubAccount, {
        userId: args.userId,
        fallbackToDefault: true
      });
    } else {  
      // For default repositories, get the default GitHub account
      githubAccount = await ctx.db
        .query("githubAccount")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .unique();
    }

    if (!githubAccount) {
      throw new Error("No GitHub account available - neither personal nor default account found");
    }

    // Check for uniqueness: user can't have duplicate repository GitHub names
    let existing;

    // Determine the GitHub repository name to check for duplicates
    const githubNameToCheck = args.githubRepoName || args.name;

    // If userId is provided, check for duplicate GitHub names for this user
    if (args.userId) {
      existing = await ctx.runQuery(internal.githubAccount.repository.query.by_user_name.repository, {
        userId: args.userId,
        name: githubNameToCheck, // Check by GitHub repository name
      });
    } else {
      // For default repositories, check for duplicate GitHub names
      existing = await ctx.runQuery(internal.githubAccount.repository.query.by_user_name.repository, {
        userId: undefined,
        name: githubNameToCheck, // Check by GitHub repository name
      });
    }

    if (existing) {
      const scope = args.userId ? "this user" : "default repositories";
      throw new Error(`repository "${githubNameToCheck}" already exists for ${scope}`);
    }

    // Use provided GitHub repo name, or generate for defaults
    const finalGithubRepoName = args.githubRepoName || args.name;

    return await ctx.db.insert("repository", {
      userId: args.userId,
      githubAccountId: githubAccount._id,
      name: finalGithubRepoName, // Store the GitHub repository name
      displayName: args.name, // Store the user-friendly display name
      isDefault: args.isDefault,
    });
  },
});
