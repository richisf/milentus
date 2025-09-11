import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";

export const create = internalMutation({
  args: {
    name: v.string(),
    userId: v.string(), // Always required for user applications
    githubAccountId: v.id("githubAccount"), // Explicitly provided
  },
  returns: v.id("application"),
  handler: async (ctx, args) => {
    // Direct database insertion for user applications
    return await ctx.db.insert("application", {
      name: args.name,
      userId: args.userId,
      githubAccountId: args.githubAccountId,
    });
  },
});
