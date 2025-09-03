import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const document = action({
  args: {
    repositoryId: v.id("repository"),
    nodes: v.array(v.object({
      id: v.string(),
      parentId: v.string(),
      label: v.string(),
      collapsed: v.optional(v.boolean())
    }))
  },
  returns: v.object({
    success: v.boolean(),
    documentId: v.optional(v.id("document")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean,
    documentId?: Id<"document">,
    error?: string
  }> => {
    try {
      const documentId = await ctx.runMutation(internal.githubAccount.repository.document.mutation.create.document, {
        repositoryId: args.repositoryId,
        nodes: args.nodes
      });

      return {
        success: true,
        documentId,
      };
    } catch (error) {
      console.error("❌ Document creation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create document",
      };
    }
  },
});
