import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { Id } from "@/convex/_generated/dataModel";

export const file = internalMutation({
  args: {
    repositoryId: v.id("repository"),
    path: v.string(),
    content: v.string(),
  },
  returns: v.id("files"),
  handler: async (ctx, args): Promise<Id<"files">> => {
    return await ctx.db.insert("files", {
      repositoryId: args.repositoryId,
      path: args.path,
      content: args.content,
    });
  },
});
