import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  githubAccount: defineTable({
    userId: v.optional(v.string()), // user subject string or null for default/shared account
    token: v.string(),
    username: v.string(),
    isDefault: v.optional(v.boolean()), // true = can be used as default for any repository
  })
    .index("by_user", ["userId"])
    .index("by_default", ["isDefault"])
    .index("by_user_and_username", ["userId", "username"]), // Unique constraint: user can't have duplicate GitHub usernames

    repository: defineTable({
      userId: v.optional(v.string()), // user subject string or null for default repository
      githubAccountId: v.id("githubAccount"), // repository must be linked to a GitHub user
      name: v.string(), // actual GitHub repository name (may include template prefix)
      displayName: v.string(), // user-friendly name for display
      isDefault: v.optional(v.boolean()), // true = can be used as default repository
    })
      .index("by_github_user", ["githubAccountId"])
      .index("by_user_and_github_user", ["userId", "githubAccountId"])
      .index("by_user_and_name", ["userId", "name"]) // Unique constraint: user can't have duplicate repository names
      .index("by_default", ["isDefault"]), // Unique constraint: only one default repository

      machine: defineTable({
        repositoryId: v.id("repository"), // Machine belongs to a repository (one-to-one)
        name: v.string(), // Machine instance name in GCP
        zone: v.string(), // GCP zone (needed to manage VM)
        state: v.string(), // "running", "stopped", "pending", "terminated"
        ipAddress: v.optional(v.string()), // Dynamic IP assigned by GCP (populated after VM creation)
        domain: v.optional(v.string()), // Generated domain (populated during setup)
        convexUrl: v.optional(v.string()), // Convex project URL (populated during dev server setup)
        convexProjectId: v.optional(v.number()), // Convex project ID (populated during dev server setup)
      })
        .index("by_repository", ["repositoryId"]), // Unique: one machine per repository

      document: defineTable({
        repositoryId: v.id("repository"), // Document belongs to a repository (one-to-one)
        nodes: v.array(v.object({
          id: v.string(),
          parentId: v.string(),
          label: v.string(),
          collapsed: v.optional(v.boolean())
        }))
      })
        .index("by_repository", ["repositoryId"]), // Unique: one document per repository

      files: defineTable({
        repositoryId: v.id("repository"), // File belongs to a repository
        path: v.string(), // File path within the repository
        content: v.string(), // File content
        imports: v.optional(v.array(v.id("files"))), // Files that this file imports
      })
        .index("by_repository", ["repositoryId"])
        .index("by_repository_and_path", ["repositoryId", "path"]) // Unique constraint: one file per path per repository

  });
