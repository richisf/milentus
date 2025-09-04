import { GoogleGenAI } from "@google/genai";

interface MessageWithImage {
  content: string;
  role: 'user' | 'assistant' | 'system';
  imageBase64?: string;
}

export async function sendMessageToGemini<T>(
  systemInstruction: string | object,
  responseSchema: object,
  conversation: MessageWithImage[],
): Promise<T> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const formattedConversation = conversation.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : msg.role,
    parts: [
      { text: msg.content },
      ...(msg.imageBase64 ? [{
        inlineData: {
          data: msg.imageBase64,
          mimeType: "image/png"
        }
      }] : [])
    ]
  }));

  try {
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
    console.error("Gemini API error:", error);
    throw error;
  }
}
