import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { Id } from "@/convex/_generated/dataModel";

export const document = internalMutation({
  args: {
    documentId: v.id("document"),
    nodes: v.optional(v.array(v.object({
      id: v.string(),
      parentId: v.string(),
      label: v.string(),
      collapsed: v.optional(v.boolean()),
      fileId: v.optional(v.id("files"))
    }))),
    delete: v.optional(v.boolean()),
    replace: v.optional(v.boolean())
  },
  returns: v.id("document"),
  handler: async (ctx, args): Promise<Id<"document">> => {
    // Verify document exists
    const existingDocument = await ctx.db.get(args.documentId);
    if (!existingDocument) {
      throw new Error("Document not found");
    }

    if (args.delete) {
      // Clear all existing nodes
      await ctx.db.patch(args.documentId, {
        nodes: []
      });

      // Also clear associated conversation and messages
      console.log(`🗑️ Clearing conversation and messages for document: ${args.documentId}`);

      // Find the conversation for this document
      const conversation = await ctx.db
        .query("conversation")
        .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
        .unique();

      if (conversation) {
        console.log(`🗑️ Found conversation ${conversation._id}, clearing messages...`);

        // Get all messages for this conversation
        const messages = await ctx.db
          .query("message")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
          .collect();

        // Delete all messages
        for (const message of messages) {
          await ctx.db.delete(message._id);
        }

        console.log(`✅ Cleared ${messages.length} messages from conversation`);
      } else {
        console.log(`ℹ️ No conversation found for document ${args.documentId}`);
      }
    } else if (args.nodes) {
      if (args.replace) {
        // Replace all nodes with the new ones (for import)
        await ctx.db.patch(args.documentId, {
          nodes: args.nodes
        });
      } else {
        // Get existing nodes and combine with new ones (for extend/add)
        const existingNodes = existingDocument.nodes || [];
        const combinedNodes = [...existingNodes, ...args.nodes];

        // Update the document with combined nodes
        await ctx.db.patch(args.documentId, {
          nodes: combinedNodes
        });
      }
    }

    return args.documentId;
  },
});
