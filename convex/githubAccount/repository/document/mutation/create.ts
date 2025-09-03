import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { Id } from "@/convex/_generated/dataModel";
import { internal } from "@/convex/_generated/api";

export const document = internalMutation({
  args: {
    repositoryId: v.id("repository"),
    nodes: v.array(v.object({
      id: v.string(),
      parentId: v.string(),
      label: v.string(),
      collapsed: v.optional(v.boolean())
    }))
  },
  returns: v.id("document"),
  handler: async (ctx, args): Promise<Id<"document">> => {
    // Verify repository exists
    const repository = await ctx.runQuery(internal.githubAccount.repository.query.by_id.repository, {
      repositoryId: args.repositoryId,
    });
    if (!repository) {
      throw new Error("Repository not found");
    }

    // Check if document already exists for this repository
    const existingDocument = await ctx.runQuery(internal.githubAccount.repository.document.query.by_repository.document, {
      repositoryId: args.repositoryId,
    });

    if (existingDocument) {
      throw new Error(`Repository already has a document. Only one document per repository is allowed.`);
    }

    return await ctx.db.insert("document", {
      repositoryId: args.repositoryId,
      nodes: args.nodes
    });
  },
});
