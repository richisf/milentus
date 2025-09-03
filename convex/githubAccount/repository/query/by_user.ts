import { query } from "@/convex/_generated/server";
import { v } from "convex/values";
import { Id } from "@/convex/_generated/dataModel";
import { internal } from "@/convex/_generated/api";

export const repositories = query({
  args: {
    userId: v.optional(v.string()),
    fallbackToDefault: v.boolean(),
  },
  returns: v.array(
    v.object({
      _id: v.id("repository"),
      _creationTime: v.number(),
      userId: v.optional(v.string()),
      githubAccountId: v.id("githubAccount"),
      name: v.string(),
      displayName: v.string(),
      isDefault: v.optional(v.boolean()),

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
      document: v.optional(v.object({
        _id: v.id("document"),
        _creationTime: v.number(),
        repositoryId: v.id("repository"),
        nodes: v.array(v.object({
          id: v.string(),
          parentId: v.string(),
          label: v.string(),
          collapsed: v.optional(v.boolean())
        }))
      })),
    })
  ),
  handler: async (ctx, args) => {
    let repositories: Array<{
      _id: Id<"repository">;
      _creationTime: number;
      userId?: string;
      githubAccountId: Id<"githubAccount">;
      name: string;
      displayName: string;
      isDefault?: boolean;
    }> = [];

    // If userId is provided, get user's repositories
    if (args.userId) {
      repositories = await ctx.db
        .query("repository")
        .withIndex("by_user_and_name", (q) => q.eq("userId", args.userId))
        .collect();
    }

    // If no repositories found and fallbackToDefault is true, get default repositories
    if (repositories.length === 0 && args.fallbackToDefault) {
      repositories = await ctx.db
        .query("repository")
        .withIndex("by_default", (q) => q.eq("isDefault", true))
        .collect();
    }

    // For each repository, get its associated machine and document (only one per repo)
    const repositoriesWithMachinesAndDocuments: Array<{
      _id: Id<"repository">;
      _creationTime: number;
      userId?: string;
      githubAccountId: Id<"githubAccount">;
      name: string;
      displayName: string;
      isDefault?: boolean;
      machine?: {
        _id: Id<"machine">;
        _creationTime: number;
        repositoryId: Id<"repository">;
        name: string;
        zone: string;
        state: string;
        ipAddress?: string;
        domain?: string;
        convexUrl?: string;
        convexProjectId?: number;
      };
      document?: {
        _id: Id<"document">;
        _creationTime: number;
        repositoryId: Id<"repository">;
        nodes: Array<{
          id: string;
          parentId: string;
          label: string;
          collapsed?: boolean;
        }>;
      };
    }> = await Promise.all(
      repositories.map(async (repo) => {
        const machine = await ctx.runQuery(internal.githubAccount.repository.machine.query.by_repository.machine, {
          repositoryId: repo._id,
        });

        const document = await ctx.runQuery(internal.githubAccount.repository.document.query.by_repository.document, {
          repositoryId: repo._id,
        });

        // Return repository with its machine and document (or undefined if none exists)
        return {
          ...repo,
          machine: machine || undefined,
          document: document || undefined,
        };
      })
    );

    return repositoriesWithMachinesAndDocuments;
  },
});
