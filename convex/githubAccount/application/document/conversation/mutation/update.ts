import { internalMutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const conversation = internalMutation({
  args: {
    conversationId: v.id("conversation"),
    userMessage: v.string(),
    aiResponse: v.optional(v.string()), // Optional for empty AI responses
    aiJsonResponse: v.optional(v.string()), // Full JSON response from AI
    contextRestarted: v.optional(v.boolean()), // Whether this message used fresh context
    conversation: v.object({
      _id: v.id("conversation"),
      _creationTime: v.number(),
      documentId: v.id("document"),
    }),
    existingMessages: v.array(v.object({
      _id: v.id("message"),
      _creationTime: v.number(),
      conversationId: v.id("conversation"),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.optional(v.string()), // Optional for empty messages
      jsonResponse: v.optional(v.string()),
      order: v.number(),
      contextRestarted: v.optional(v.boolean()),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    userMessageId: v.id("message"),
    aiMessageId: v.optional(v.id("message")), // Optional when no AI response
    conversation: v.object({
      _id: v.id("conversation"),
      _creationTime: v.float64(),
      documentId: v.id("document"),
      messages: v.array(v.object({
        _id: v.id("message"),
        _creationTime: v.float64(),
        conversationId: v.id("conversation"),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.optional(v.string()), // Optional for empty messages
        order: v.float64(),
        contextRestarted: v.optional(v.boolean()),
      })),
    }),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    userMessageId: Id<"message">;
    aiMessageId?: Id<"message">; // Optional when no AI response
    conversation: {
      _id: Id<"conversation">;
      _creationTime: number;
      documentId: Id<"document">;
      messages: Array<{
        _id: Id<"message">;
        _creationTime: number;
        conversationId: Id<"conversation">;
        role: "user" | "assistant";
        content?: string; // Optional for empty messages
        order: number;
        contextRestarted?: boolean; // Whether this message used fresh context
      }>;
    };
  }> => {
    console.log(`💾 Saving messages for conversation: ${args.conversationId}`);

    // Use provided data instead of querying
    const conversation = args.conversation;
    const existingMessages = args.existingMessages;

    // Create user message
    const userMessageId = await ctx.runMutation(
      internal.githubAccount.application.document.conversation.message.mutation.create.message,
      {
        conversationId: args.conversationId,
        role: "user",
        content: args.userMessage
      }
    );

    // Create AI response message only if there's actual content
    let aiMessageId: Id<"message"> | undefined;
    if (args.aiResponse && args.aiResponse.trim() !== "") {
      aiMessageId = await ctx.runMutation(
        internal.githubAccount.application.document.conversation.message.mutation.create.message,
        {
          conversationId: args.conversationId,
          role: "assistant",
          content: args.aiResponse,
          jsonResponse: args.aiJsonResponse,
          contextRestarted: args.contextRestarted
        }
      );
    }

    // Query the newly created messages to get their real data
    const userMessage = await ctx.db.get(userMessageId);
    const aiMessage = aiMessageId ? await ctx.db.get(aiMessageId) : null;

    if (!userMessage) {
      throw new Error("Failed to retrieve created user message");
    }

    // Return complete conversation with real data (strip jsonResponse for frontend)
    const sanitizeMessage = (msg: typeof userMessage) => ({
      _id: msg._id,
      _creationTime: msg._creationTime,
      conversationId: msg.conversationId,
      role: msg.role,
      content: msg.content,
      order: msg.order,
      contextRestarted: msg.contextRestarted,
    });

    // Build messages array, only including AI message if it exists
    const messagesToInclude = [userMessage];
    if (aiMessage) {
      messagesToInclude.push(aiMessage);
    }

    const completeConversation = {
      _id: conversation._id,
      _creationTime: conversation._creationTime,
      documentId: conversation.documentId,
      messages: [...existingMessages, ...messagesToInclude].map(sanitizeMessage)
    };

    const aiMessageInfo = aiMessageId ? `AI=${aiMessageId}` : "AI=(empty response skipped)";
    console.log(`✅ Messages saved and conversation updated: User=${userMessageId}, ${aiMessageInfo}`);

    return {
      success: true,
      userMessageId,
      aiMessageId,
      conversation: completeConversation,
    };
  },
});
