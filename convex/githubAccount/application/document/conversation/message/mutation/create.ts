import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";

export const message = internalMutation({
  args: {
    conversationId: v.id("conversation"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  returns: v.id("message"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("message", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
    });
  },
});
