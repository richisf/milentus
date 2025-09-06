import { internalAction } from "@/convex/_generated/server";
import { v } from "convex/values";
import { processMessageWithGemini } from "@/convex/githubAccount/repository/document/action/update/services/message";

export const processMessage = internalAction({
  args: {
    message: v.string()
  },
  returns: v.object({ 
    success: v.boolean(),
    nodes: v.array(v.object({
      id: v.string(),
      parentId: v.string(),
      label: v.string(),
      collapsed: v.optional(v.boolean())
    })),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Process message with Gemini using the extracted function
    const result = await processMessageWithGemini(args.message);

    return {
      success: result.success,
      nodes: result.nodes,
      error: result.error
    };
  },
});
