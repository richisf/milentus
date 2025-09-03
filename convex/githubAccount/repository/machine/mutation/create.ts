import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { Id } from "@/convex/_generated/dataModel";
import { internal } from "@/convex/_generated/api";

export const machine = internalMutation({
  args: {
    repositoryId: v.id("repository"),
    name: v.string(),
    zone: v.string(),
    ipAddress: v.optional(v.string()),
    domain: v.optional(v.string()),
    convexUrl: v.optional(v.string()),
    convexProjectId: v.optional(v.number()),
    state: v.optional(v.string()),
  },
  returns: v.id("machine"),
  handler: async (ctx, args): Promise<Id<"machine">> => {
    // Verify repository exists
    const repository = await ctx.runQuery(internal.githubAccount.repository.query.by_id.repository, {
      repositoryId: args.repositoryId,
    });
    if (!repository) {
      throw new Error("Repository not found");
    }

    const existingMachine = await ctx.runQuery(internal.githubAccount.repository.machine.query.by_repository.machine, {
      repositoryId: args.repositoryId,
    });

    if (existingMachine) {
      throw new Error(`Repository already has a machine. Only one machine per repository is allowed.`);
    }

    return await ctx.db.insert("machine", {
      repositoryId: args.repositoryId,
      name: args.name,
      zone: args.zone,
      state: args.state || "pending", // Machines start in pending state
      ipAddress: args.ipAddress || undefined, // Will be populated after VM creation
      domain: args.domain || undefined,    // Will be populated after domain generation
      convexUrl: args.convexUrl || undefined, // Will be populated during dev server setup
      convexProjectId: args.convexProjectId || undefined, // Will be populated during dev server setup
    });
  },
});
