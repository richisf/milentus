"use node";

import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { repository as createRepository } from "@/convex/githubAccount/repository/action/services/create";

export const repository = internalAction({
  args: {
    userId: v.string(),
    name: v.string(), // Display name from orchestrator
    createMachine: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    repositoryId: v.optional(v.id("repository")),
    machineId: v.optional(v.id("machine")),
    machineName: v.optional(v.string()),
    machineZone: v.optional(v.string()),
    error: v.optional(v.string()),
    instructions: v.optional(v.string()),
    repositoryUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{success: boolean, repositoryId?: Id<"repository">, machineId?: Id<"machine">, machineName?: string, machineZone?: string, error?: string, instructions?: string, repositoryUrl?: string}> => {
    try {
      // Transform display name to GitHub repository name
      const githubRepoName = `whitenode-template-${args.name}`;
      console.log(`Creating user repository from template: ${githubRepoName} for user: ${args.userId}`);

      // Check if repository already exists for this user (using GitHub repo name)
      const existingRepo = await ctx.runQuery(internal.githubAccount.repository.query.by_user_name.repository, {
        userId: args.userId,
        name: githubRepoName, // Use GitHub repository name for duplicate check
      });

      if (existingRepo) {
        throw new Error(`Repository with name "${githubRepoName}" already exists for this user`);
      }

      // Get the default GitHub user (for template access)
      const defaultgithubAccount = await ctx.runQuery(internal.githubAccount.query.by_user.githubAccount, {
        userId: undefined,
        fallbackToDefault: true,
      });

      if (!defaultgithubAccount) {
        throw new Error("No default GitHub account found. Please connect a GitHub account first.");
      }

      console.log(`Generating repository from template: ${githubRepoName}`);

      // Use original display name for the GitHub API description
      const displayName = args.name;

      const createdRepo = await createRepository(
        defaultgithubAccount.token,
        "richisf",
        "whitenode-template",
        githubRepoName,
      );

      console.log("✅ Successfully created repository from template:", createdRepo);

      // Create database entry with the transformed GitHub name
      const repositoryId = await ctx.runMutation(internal.githubAccount.repository.mutation.create.repository, {
        userId: args.userId as Id<"users">,
        name: displayName, // Display name for database
        githubRepoName: githubRepoName, // Transformed GitHub repository name
        isDefault: false,
      });

      // If createMachine is true, create machine for the repository
      if (args.createMachine && repositoryId) {
        console.log("Creating machine for repository:", repositoryId);
        try {
          const machineResult = await ctx.runAction(internal.githubAccount.repository.machine.action.create.machine, {
            repositoryId: repositoryId,
          });

          if (machineResult.success) {
            return {
              success: true,
              repositoryId,
              machineId: machineResult.machineId,
              machineName: machineResult.name,
              machineZone: machineResult.zone,
              instructions: "✅ Repository created successfully from template!\n✅ Machine created successfully! Name: " + machineResult.name + ", Zone: " + machineResult.zone,
              repositoryUrl: createdRepo.html_url,
            };
          } else {
            return {
              success: true,
              repositoryId,
              error: `Repository created but machine creation failed: ${machineResult.error}`,
              instructions: "✅ Repository created successfully from template!",
              repositoryUrl: createdRepo.html_url,
            };
          }
        } catch (machineError) {
          console.error("Machine creation error:", machineError);
          return {
            success: true,
            repositoryId,
            error: `Repository created but machine creation failed: ${machineError instanceof Error ? machineError.message : 'Unknown error'}`,
            instructions: "✅ Repository created successfully from template!",
            repositoryUrl: createdRepo.html_url,
          };
        }
      }

      return {
        success: true,
        repositoryId,
        instructions: "✅ Repository created successfully from template!",
        repositoryUrl: createdRepo.html_url,
      };
    } catch (error) {
      console.error("User repository creation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create user repository",
      };
    }
  },
});
