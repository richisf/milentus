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

export async function sendMessageToGemini(stage: string, conversation: Message[], documentNodes?: Array<{ id: string; parentId: string; label: string; collapsed?: boolean }>) {
  const config = stageConfigs[stage as keyof typeof stageConfigs] || stageConfigs.concept;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const contents = conversation.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : msg.role,
    parts: [{ text: msg.content }]
  }));

  console.log("📤 Gemini Input - contents:", contents);

  // Build system instruction with document context if nodes exist
  let systemInstruction = config.instruction;
  if (documentNodes && documentNodes.length > 0) {
    const nodesContext = `\n\nCURRENT DOCUMENT NODES:\n${JSON.stringify(documentNodes, null, 2)}\n\nWhen responding, consider these existing nodes and help the user refine, expand, or modify them as needed.`;
    systemInstruction = config.instruction + nodesContext;
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
