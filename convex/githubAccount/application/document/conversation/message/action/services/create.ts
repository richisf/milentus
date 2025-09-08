import { GoogleGenAI } from "@google/genai";

interface Message {
  content: string;
  role: 'user' | 'assistant';
}

export async function sendMessageToGemini<T>(
  systemInstruction: string | object,
  responseSchema: object,
  conversation: Message[],
): Promise<T> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const formattedConversation = conversation
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }]
    }));

  try {
    console.log("📤 Gemini Input - contents:", formattedConversation);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: formattedConversation,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
        topP: 0.95,
        topK: 40
      },
    });

    if (!response.text?.trim()) {
      throw new Error('Empty response from Gemini API');
    }

    return JSON.parse(response.text) as T;
  } catch (error) {
    throw error;
  }
}
