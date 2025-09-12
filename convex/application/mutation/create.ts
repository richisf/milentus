import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";

export const create = internalMutation({
  args: {
    name: v.string(),
    userId: v.string(),
    githubAccountId: v.id("githubAccount"),
  },
  returns: v.id("application"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("application", {
      name: args.name,
      userId: args.userId,
      githubAccountId: args.githubAccountId,
    });
  },
});
