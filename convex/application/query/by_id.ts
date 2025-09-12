import { v } from "convex/values";
import { query, internalQuery } from "@/convex/_generated/server";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { checkPermission, VALID_ROLES } from "../../lib/permissions";

// Define types for the return structure
type MachineData = {
  _id: Id<"machine">;
  _creationTime: number;
  applicationId: Id<"application">;
  name: string;
  zone: string;
  state: string;
  ipAddress?: string;
  domain?: string;
  convexUrl?: string;
  convexProjectId?: number;
} | null;

type DocumentData = {
  _id: Id<"document">;
  _creationTime: number;
  applicationId: Id<"application">;
  nodes: Array<{
    id: string;
    parentId: string;
    label: string;
    collapsed?: boolean;
    fileId?: Id<"files">;
  }>;
  conversation: {
    _id: Id<"conversation">;
    _creationTime: number;
    documentId: Id<"document">;
  } | null;
} | null;

type RepositoryData = {
  _id: Id<"repository">;
  _creationTime: number;
  applicationId: Id<"application">;
  name: string;
  accessToken?: string;
  githubUsername?: string;
} | null;

type ApplicationWithDetails = {
  _id: Id<"application">;
  _creationTime: number;
  userId?: string;
  name: string;
  githubAccountId: Id<"githubAccount">;
  machine: MachineData;
  document: DocumentData;
  repository: RepositoryData;
};

export const by_id = query({
  args: {
    applicationId: v.id("application"),
  },
  returns: v.union(v.object({
    _id: v.id("application"),
    _creationTime: v.float64(),
    userId: v.optional(v.string()),
    name: v.string(),
    githubAccountId: v.id("githubAccount"),
    machine: v.union(v.object({
      _id: v.id("machine"),
      _creationTime: v.float64(),
      applicationId: v.id("application"),
      name: v.string(),
      zone: v.string(),
      state: v.string(),
      ipAddress: v.optional(v.string()),
      domain: v.optional(v.string()),
      convexUrl: v.optional(v.string()),
      convexProjectId: v.optional(v.float64()),
      deployKey: v.optional(v.string()),
    }), v.null()),
    repository: v.union(v.object({
      _id: v.id("repository"),
      _creationTime: v.float64(),
      applicationId: v.id("application"),
      name: v.string(),
      accessToken: v.optional(v.string()),
      githubUsername: v.optional(v.string()),
    }), v.null()),
    document: v.union(v.object({
      _id: v.id("document"),
      _creationTime: v.float64(),
      applicationId: v.id("application"),
      nodes: v.array(v.object({
        id: v.string(),
        parentId: v.string(),
        label: v.string(),
        collapsed: v.optional(v.boolean()),
        fileId: v.optional(v.id("files")),
      })),
      conversation: v.union(v.object({
        _id: v.id("conversation"),
        _creationTime: v.float64(),
        documentId: v.id("document"),
      }), v.null()),
    }), v.null()),
  }), v.null()),
  handler: async (ctx, args): Promise<ApplicationWithDetails | null> => {
    // Verify user is authenticated
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in");

    // Check if user has read permissions
    const hasAccess = await checkPermission(ctx, userId, VALID_ROLES.READ);
    if (!hasAccess) throw new Error("Insufficient permissions");

    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      return null;
    }

    // Fetch related data using internal queries
    const machine: MachineData = await ctx.runQuery(internal.application.machine.query.by_application.machine, {
      applicationId: args.applicationId,
    });
    const repository: RepositoryData = await ctx.runQuery(internal.application.repository.query.by_application.repository, {
      applicationId: args.applicationId,
    });
    const document: DocumentData = await ctx.runQuery(internal.application.document.query.by_application.document, {
      applicationId: args.applicationId,
    });

    // Conversation data is now included in the document query

    return {
      ...application,
      machine,
      repository,
      document,
    };
  },
});

export const application = internalQuery({
  args: {
    applicationId: v.id("application"),
  },
  returns: v.union(v.object({
    _id: v.id("application"),
    _creationTime: v.number(),
    userId: v.optional(v.string()),
    name: v.string(),
    githubAccountId: v.id("githubAccount"),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.applicationId);
  },
});
