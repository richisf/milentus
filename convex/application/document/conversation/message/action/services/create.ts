import { GoogleGenAI } from "@google/genai";
import {
  ConceptExplorationSchema,
  FeatureDefinitionSchema,
  FunctionalityDetailSchema
} from "./configuration/schema";
import { Instructions } from "./configuration/system";

interface Message {
  content: string;
  role: 'user' | 'assistant';
}

// Stage configuration mapping
const stageConfigs = {
  concept: { instruction: Instructions.conceptExploration, schema: ConceptExplorationSchema },
  features: { instruction: Instructions.featureDefinition, schema: FeatureDefinitionSchema },
  details: { instruction: Instructions.functionalityDetail, schema: FunctionalityDetailSchema }
};

export async function sendMessageToGemini(
  stage: string, 
  conversation: Message[], 
  documentNodes?: Array<{ id: string; parentId: string; label: string; collapsed?: boolean }>,
  shouldRestartContext?: boolean
) {
  const config = stageConfigs[stage as keyof typeof stageConfigs] || stageConfigs.concept;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Determine if we should use fresh context (restart) or full conversation
  let contents;
  if (shouldRestartContext && conversation.length > 0) {
    // Use the last AI response + current user message for fresh context
    const lastMessage = conversation[conversation.length - 1];
    const secondToLastMessage = conversation.length > 1 ? conversation[conversation.length - 2] : null;

    // Start with the last AI response if it exists, then add current user message
    const freshContents = [];

    // Add the last AI response if it exists (provides context for the user's response)
    if (secondToLastMessage && secondToLastMessage.role === 'assistant') {
      freshContents.push({
        role: 'model',
        parts: [{ text: secondToLastMessage.content }]
      });
    }

    // Add the current user message with nodes structure
    let userMessageContent = lastMessage.content;
    if (documentNodes && documentNodes.length > 0) {
      userMessageContent = `${lastMessage.content}\n\nCURRENT APPLICATION STRUCTURE:\n${JSON.stringify(documentNodes, null, 2)}`;
    }

    freshContents.push({
      role: lastMessage.role === 'assistant' ? 'model' : lastMessage.role,
      parts: [{ text: userMessageContent }]
    });

    contents = freshContents;
    console.log("🔄 Using fresh context - last AI response + current message + complete nodes structure");
  } else {
    // Use full conversation history
    contents = conversation.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));
    console.log("📚 Using full conversation history + nodes");
  }

  console.log("📤 Gemini Input - contents:", contents);

  // Build system instruction with document context if nodes exist
  let systemInstruction = config.instruction;
  if (documentNodes && documentNodes.length > 0) {
    let contextDescription;
    if (shouldRestartContext) {
      contextDescription = "The current application structure has been included directly in the user's message above. Use this complete structure as context for their specific request.";
    } else {
      contextDescription = "When responding, consider these existing nodes and help the user refine, expand, or modify them as needed.";
      const nodesContext = `\n\nCURRENT DOCUMENT NODES:\n${JSON.stringify(documentNodes, null, 2)}\n\n${contextDescription}`;
      systemInstruction = config.instruction + nodesContext;
    }
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: config.schema,
      temperature: 0.7,
      topP: 0.95,
      topK: 40
    },
  });

  if (!response.text?.trim()) {
    throw new Error('Empty response from Gemini API');
  }

  return JSON.parse(response.text);
}
