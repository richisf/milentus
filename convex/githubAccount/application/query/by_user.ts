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
} | null;

type RepositoryData = {
  _id: Id<"repository">;
  _creationTime: number;
  applicationId: Id<"application">;
  githubAccountId: Id<"githubAccount">;
  name: string;
  accessToken?: string;
  githubUsername?: string;
} | null;

type ConversationData = {
  _id: Id<"conversation">;
  _creationTime: number;
  documentId: Id<"document">;
  messages: Array<{
    _id: Id<"message">;
    _creationTime: number;
    conversationId: Id<"conversation">;
    role: "user" | "assistant";
    content: string;
    order: number;
  }>;
} | null;

type ApplicationWithDetails = {
  _id: Id<"application">;
  _creationTime: number;
  userId?: string;
  name: string;
  machine: MachineData;
  document: DocumentData;
  repository: RepositoryData;
  conversation: ConversationData;
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
      }),
      v.null()
    ),
    repository: v.union(
      v.object({
        _id: v.id("repository"),
        _creationTime: v.number(),
        applicationId: v.id("application"),
        githubAccountId: v.id("githubAccount"),
        name: v.string(),
        accessToken: v.optional(v.string()),
        githubUsername: v.optional(v.string()),
      }),
      v.null()
    ),
    conversation: v.union(
      v.object({
        _id: v.id("conversation"),
        _creationTime: v.number(),
        documentId: v.id("document"),
        messages: v.array(v.object({
          _id: v.id("message"),
          _creationTime: v.number(),
          conversationId: v.id("conversation"),
          role: v.union(v.literal("user"), v.literal("assistant")),
          content: v.string(),
          order: v.number(),
        })),
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
        const machinePromise: Promise<MachineData> = ctx.runQuery(internal.githubAccount.application.machine.query.by_application.machine, {
          applicationId: app._id,
        });
        const documentPromise: Promise<DocumentData> = ctx.runQuery(internal.githubAccount.application.document.query.by_application.document, {
          applicationId: app._id,
        });
        const repositoryPromise: Promise<RepositoryData> = ctx.runQuery(internal.githubAccount.application.repository.query.by_application.repository, {
          applicationId: app._id,
        });

        // Fetch conversation with messages if document exists
        const conversationPromise: Promise<ConversationData> = (async (): Promise<ConversationData> => {
          const doc = await documentPromise;
          if (doc) {
            const conversation = await ctx.runQuery(internal.githubAccount.application.document.conversation.query.by_document.by_document, {
              documentId: doc._id,
            });

            if (conversation) {
              // Fetch messages for this conversation
              const messages = await ctx.runQuery(internal.githubAccount.application.document.conversation.message.query.by_conversation.messages, {
                conversationId: conversation._id,
              });

              return {
                ...conversation,
                messages,
              };
            }
          }
          return null;
        })();

        const [machine, document, repository, conversation]: [MachineData, DocumentData, RepositoryData, ConversationData] = await Promise.all([
          machinePromise,
          documentPromise,
          repositoryPromise,
          conversationPromise,
        ]);

        return {
          ...app,
          machine,
          document,
          repository,
          conversation,
        } as ApplicationWithDetails;
      })
    );

    return applicationsWithDetails;
  },
});
