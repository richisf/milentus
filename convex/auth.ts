import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { Id } from "@/convex/_generated/dataModel";
import { VALID_ROLES } from "./lib/permissions";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {

    async afterUserCreatedOrUpdated(ctx, args) {

      if (args.existingUserId) return;

      const user = await ctx.db.get(args.userId);

      if (user?.email === "admin@white-node.com") {
        await ctx.db.patch(args.userId, {
          role: VALID_ROLES.WHITENODE_ADMIN,
        });
      } else {

        await ctx.db.patch(args.userId, {
          role: VALID_ROLES.READ,
        });
      }
    },
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db.get(userId);
  },
});

export const updateRole = mutation({
  args: {
    role: v.union(v.literal("read"), v.literal("write"), v.literal("admin"), v.literal("whitenode-admin")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");

    await ctx.db.patch(userId, { role: args.role });
  },
});

export const getAdminById = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {

    const targetUserId = args.userId || "your_whitenode_admin_id_here" as Id<"users">;

    const user = await ctx.db.get(targetUserId);
    if (!user) return null;

    const githubAccount = await ctx.db
      .query("githubAccount")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .unique();

    const applications = await ctx.db
      .query("application")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .collect();

    return {
      user,
      githubAccount,
      applications,
    };
  },
});

