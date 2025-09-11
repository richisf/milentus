import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Define types for the return structure
type ConversationData = {
  _id: Id<"conversation">;
  _creationTime: number;
  documentId: Id<"document">;
} | null;

type DocumentData = {
  _id: Id<"document">;
  _creationTime: number;
  applicationId: Id<"application">;
  nodes: Array<{
    id: string;
    parentId: string;
    label: string;
    collapsed?: boolean;
    fileId?: Id<"files">;
  }>;
  conversation: ConversationData;
} | null;

export const document = internalQuery({
  args: {
    applicationId: v.id("application"),
  },
  returns: v.union(
    v.object({
      _id: v.id("document"),
      _creationTime: v.float64(),
      applicationId: v.id("application"),
      nodes: v.array(v.object({
        id: v.string(),
        parentId: v.string(),
        label: v.string(),
        collapsed: v.optional(v.boolean()),
        fileId: v.optional(v.id("files"))
      })),
      conversation: v.union(v.object({
        _id: v.id("conversation"),
        _creationTime: v.float64(),
        documentId: v.id("document"),
      }), v.null()),
    }),
    v.null()
  ),
  handler: async (ctx, args): Promise<DocumentData> => {
    const doc = await ctx.db
      .query("document")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .unique(); // Only one document per application

    if (!doc) {
      return null;
    }

    // Fetch conversation using by_document query
    const conversation: ConversationData = await ctx.runQuery(internal.application.document.conversation.query.by_document.by_document, {
      documentId: doc._id,
    });

    return {
      ...doc,
      conversation,
    };
  },
});
