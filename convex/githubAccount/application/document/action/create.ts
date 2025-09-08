import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const document = internalAction({
  args: {
    applicationId: v.id("application")
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
      console.log(`📄 Creating empty document for application: ${args.applicationId}`);

      const documentId = await ctx.runMutation(internal.githubAccount.application.document.mutation.create.document, {
        applicationId: args.applicationId,
        nodes: []
      });

      return {
        success: true,
        documentId
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
