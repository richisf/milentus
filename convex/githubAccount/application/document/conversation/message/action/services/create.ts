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

export async function sendMessageToGemini(stage: string, conversation: Message[]) {
  const config = stageConfigs[stage as keyof typeof stageConfigs] || stageConfigs.concept;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const contents = conversation.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : msg.role,
    parts: [{ text: msg.content }]
  }));

  console.log("📤 Gemini Input - contents:", contents);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: contents,
    config: {
      systemInstruction: config.instruction,
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
