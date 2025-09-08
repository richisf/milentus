import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";

export const messages = internalQuery({
    args: {
    conversationId: v.id("conversation"),
  },
  returns: v.array(v.object({
    _id: v.id("message"),
    _creationTime: v.number(),
    conversationId: v.id("conversation"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    order: v.number(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("message")
      .withIndex("by_conversation_order", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();
  },
});
