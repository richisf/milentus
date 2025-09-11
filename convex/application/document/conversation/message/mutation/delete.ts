import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";

export const message = internalMutation({
  args: {
    messageId: v.id("message"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.messageId);
    return null;
  },
});
