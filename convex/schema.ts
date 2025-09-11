import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  githubAccount: defineTable({
    userId: v.optional(v.string()), // user subject string or null for default account
    token: v.string(),
    username: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_username", ["userId", "username"]),

  application: defineTable({
    userId: v.optional(v.string()), // user subject string or null for default application
    name: v.string(),
    githubAccountId: v.id("githubAccount"), // Required: Consistent hierarchical link
  })
    .index("by_user", ["userId"])
    .index("by_user_and_name", ["userId", "name"])
    .index("by_github_account", ["githubAccountId"]),

    repository: defineTable({
      applicationId: v.id("application"),
      name: v.string(),
      githubAccountId: v.id("githubAccount"), // Required: Inherits from application
    })
      .index("by_application", ["applicationId"]),

      files: defineTable({
        repositoryId: v.id("repository"),
        path: v.string(),
        content: v.string(),
        imports: v.optional(v.array(v.id("files"))),
      })
        .index("by_repository", ["repositoryId"]),

    machine: defineTable({
      applicationId: v.id("application"),
      name: v.string(),
      zone: v.string(),
      state: v.string(),
      ipAddress: v.optional(v.string()),
      domain: v.optional(v.string()),
      convexUrl: v.optional(v.string()),
      convexProjectId: v.optional(v.number()),
      deployKey: v.optional(v.string()),
    })
      .index("by_application", ["applicationId"]),

    document: defineTable({
      applicationId: v.id("application"),
      nodes: v.array(v.object({
        id: v.string(),
        parentId: v.string(),
        label: v.string(),
        collapsed: v.optional(v.boolean()),

        fileId: v.optional(v.id("files"))
      }))
    })
      .index("by_application", ["applicationId"]),

      conversation: defineTable({
        documentId: v.id("document"),
      })
        .index("by_document", ["documentId"]),

      message: defineTable({
        conversationId: v.id("conversation"),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.optional(v.string()), 
        jsonResponse: v.optional(v.string()),
        order: v.number(),
        contextRestarted: v.optional(v.boolean()),
      })
        .index("by_conversation", ["conversationId"])
        .index("by_conversation_order", ["conversationId", "order"]),
  });
