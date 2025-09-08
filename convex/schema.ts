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
  })
    .index("by_user", ["userId"])
    .index("by_user_and_name", ["userId", "name"]),   

    repository: defineTable({
      applicationId: v.id("application"),
      githubAccountId: v.id("githubAccount"),
      name: v.string(),
    })
      .index("by_application", ["applicationId"])
      .index("by_github_user", ["githubAccountId"]),

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
        content: v.optional(v.string()), // Optional for empty AI responses during transitions
        jsonResponse: v.optional(v.string()), // Full JSON response from AI (for stage detection)
        order: v.number(), // Sequential order within conversation (1, 2, 3, ...)
      })
        .index("by_conversation", ["conversationId"])
        .index("by_conversation_order", ["conversationId", "order"]),
          
  });
