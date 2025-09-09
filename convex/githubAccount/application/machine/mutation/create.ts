import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { Id } from "@/convex/_generated/dataModel";
import { internal } from "@/convex/_generated/api";

export const machine = internalMutation({
  args: {
    applicationId: v.id("application"),
    name: v.string(),
    zone: v.string(),
    ipAddress: v.optional(v.string()),
    domain: v.optional(v.string()),
    convexUrl: v.optional(v.string()),
    convexProjectId: v.optional(v.number()),
    state: v.string(),
  },
  returns: v.id("machine"),
  handler: async (ctx, args): Promise<Id<"machine">> => {

    const existingMachine = await ctx.runQuery(internal.githubAccount.application.machine.query.by_application.machine, {
      applicationId: args.applicationId,
    });

    if (existingMachine) {
      throw new Error(`Application already has a machine. Only one machine per application is allowed.`);
    }

    return await ctx.db.insert("machine", {
      applicationId: args.applicationId,
      name: args.name,
      zone: args.zone,
      state: args.state,
      ipAddress: args.ipAddress,
      domain: args.domain,
      convexUrl: args.convexUrl,
      convexProjectId: args.convexProjectId,
    });
  },
});
