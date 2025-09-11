import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";

export const conversation = internalMutation({
  args: {
    documentId: v.id("document"),
  },
  returns: v.id("conversation"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversation", {
      documentId: args.documentId,
    });
  },
});
