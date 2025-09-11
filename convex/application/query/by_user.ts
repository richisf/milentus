import { v } from "convex/values";
import { query } from "@/convex/_generated/server";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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
  githubAccountId: Id<"githubAccount">;
  accessToken?: string;
  githubUsername?: string;
} | null;

// Using proper generated types from Convex

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

export const applications = query({
  args: {
    userId: v.optional(v.string()), // user subject string or null for default applications
  },
  returns: v.array(v.object({
    _id: v.id("application"),
    _creationTime: v.number(),
    userId: v.optional(v.string()),
    name: v.string(),
    githubAccountId: v.id("githubAccount"),
    machine: v.union(
      v.object({
        _id: v.id("machine"),
        _creationTime: v.number(),
        applicationId: v.id("application"),
        name: v.string(),
        zone: v.string(),
        state: v.string(),
        ipAddress: v.optional(v.string()),
        domain: v.optional(v.string()),
        convexUrl: v.optional(v.string()),
        convexProjectId: v.optional(v.number()),
        deployKey: v.optional(v.string()),
      }),
      v.null()
    ),
    document: v.union(
      v.object({
        _id: v.id("document"),
        _creationTime: v.number(),
        applicationId: v.id("application"),
        nodes: v.array(v.object({
          id: v.string(),
          parentId: v.string(),
          label: v.string(),
          collapsed: v.optional(v.boolean()),
          fileId: v.optional(v.id("files"))
        })),
        conversation: v.union(v.object({
          _id: v.id("conversation"),
          _creationTime: v.number(),
          documentId: v.id("document"),
        }), v.null()),
      }),
      v.null()
    ),
    repository: v.union(
      v.object({
        _id: v.id("repository"),
        _creationTime: v.number(),
        applicationId: v.id("application"),
        name: v.string(),
        githubAccountId: v.id("githubAccount"),
        accessToken: v.optional(v.string()),
        githubUsername: v.optional(v.string()),
      }),
      v.null()
    ),
  })),
  handler: async (ctx, args): Promise<ApplicationWithDetails[]> => {
    // Query all applications for the specified user using the by_user index
    const applications: Array<{
      _id: Id<"application">;
      _creationTime: number;
      userId?: string;
      name: string;
    }> = await ctx.db
      .query("application")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // For each application, fetch the associated machine, document, and repository
    const applicationsWithDetails: ApplicationWithDetails[] = await Promise.all(
      applications.map(async (app): Promise<ApplicationWithDetails> => {
        const machinePromise: Promise<MachineData> = ctx.runQuery(internal.application.machine.query.by_application.machine, {
          applicationId: app._id,
        });
        const documentPromise: Promise<DocumentData> = ctx.runQuery(internal.application.document.query.by_application.document, {
          applicationId: app._id,
        });
        const repositoryPromise: Promise<RepositoryData> = ctx.runQuery(internal.application.repository.query.by_application.repository, {
          applicationId: app._id,
        });


        const [machine, document, repository]: [MachineData, DocumentData, RepositoryData] = await Promise.all([
          machinePromise,
          documentPromise,
          repositoryPromise,
        ]);

        return {
          ...app,
          machine,
          document,
          repository,
        } as ApplicationWithDetails;
      })
    );

    return applicationsWithDetails;
  },
});
