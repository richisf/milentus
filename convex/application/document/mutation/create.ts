import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { Id } from "@/convex/_generated/dataModel";
import { internal } from "@/convex/_generated/api";

export const document = internalMutation({
  args: {
    applicationId: v.id("application"),
    nodes: v.array(v.object({
      id: v.string(),
      parentId: v.string(),
      label: v.string(),
      collapsed: v.optional(v.boolean()),
      fileId: v.optional(v.id("files"))
    }))
  },
  returns: v.id("document"),
  handler: async (ctx, args): Promise<Id<"document">> => {
    // Verify application exists
    const application = await ctx.runQuery(internal.application.query.by_id.application, {
      applicationId: args.applicationId,
    });
    if (!application) {
      throw new Error("Application not found");
    }

    // Check if document already exists for this application
    const existingDocument = await ctx.runQuery(internal.application.document.query.by_application.document, {
      applicationId: args.applicationId,
    });

    if (existingDocument) {
      throw new Error(`Application already has a document. Only one document per application is allowed.`);
    }

    return await ctx.db.insert("document", {
      applicationId: args.applicationId,
      nodes: args.nodes
    });
  },
});
