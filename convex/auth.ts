import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { v } from "convex/values";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});

// Get current user identity
export const currentUser = query({
  args: {},
  returns: v.union(
    v.object({
      subject: v.string(),
      issuer: v.string(),
      tokenIdentifier: v.optional(v.string()),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    try {
      return await ctx.auth.getUserIdentity();
    } catch {
      // Return null if no user identity (not authenticated)
      return null;
    }
  },
});
