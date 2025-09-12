import { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import { api } from "../_generated/api";

export const VALID_ROLES = {
  READ: "read",
  WRITE: "write",
  ADMIN: "admin",
  WHITENODE_ADMIN: "whitenode-admin",
} as const;

export type UserRole = typeof VALID_ROLES[keyof typeof VALID_ROLES];

const roleHierarchy = {
  [VALID_ROLES.READ]: 0,
  [VALID_ROLES.WRITE]: 1,
  [VALID_ROLES.ADMIN]: 2,
  [VALID_ROLES.WHITENODE_ADMIN]: 3,
};

async function getUserById(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  userId: Id<"users">
) {
  if ('db' in ctx) {
    return await ctx.db.get(userId);
  } else {
    const currentUserId = await getAuthUserId(ctx);
    if (currentUserId === userId) {
      return await ctx.runQuery(api.auth.getMe, {});
    } else {
      throw new Error("Cannot check permissions for other users in actions - not implemented");
    }
  }
}

function isValidRole(role: string): role is UserRole {
  return Object.values(VALID_ROLES).includes(role as UserRole);
}

export async function checkPermission(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  requiredRole: UserRole
): Promise<boolean>;
export async function checkPermission(
  ctx: ActionCtx,
  userId: Id<"users">,
  requiredRole: UserRole
): Promise<boolean>;
export async function checkPermission(
  ctx: QueryCtx | MutationCtx | ActionCtx,
  userId: Id<"users">,
  requiredRole: UserRole
): Promise<boolean> {
  try {
    // Validate input
    if (!isValidRole(requiredRole)) {
      console.error("Invalid requiredRole:", requiredRole);
      return false;
    }

    const user = await getUserById(ctx, userId);

    if (!user || !user.role) {
      return false;
    }

    const userRoleLevel = roleHierarchy[user.role as UserRole] ?? -1;
    const requiredRoleLevel = roleHierarchy[requiredRole] ?? -1;

    return userRoleLevel >= requiredRoleLevel;
  } catch (error) {
    console.error("Error checking permissions:", error);
    return false;
  }
}