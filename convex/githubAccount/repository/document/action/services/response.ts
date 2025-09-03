import { GoogleGenAI } from "@google/genai";

// Define the missing types
interface MessageWithImage {
  content: string;
  role: 'user' | 'assistant' | 'system';
  imageBase64?: string;
}

interface GeminiPart {
  text?: string;
  inlineData?: {
    data: string;
    mimeType: string;
  };
}

interface FormattedMessage {
  role: string;
  parts: GeminiPart[];
}


export async function sendMessageToGemini<T>(
  systemInstruction: string | object,
  responseSchema: object,
  conversation: MessageWithImage[],
): Promise<T> {

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const formattedConversation: FormattedMessage[] = conversation.map(msg => {
    const parts: GeminiPart[] = [{ text: msg.content }];
    
    // Add image to parts if provided
    if (msg.imageBase64) {
      parts.push({
        inlineData: {
          data: msg.imageBase64,
          mimeType: "image/png"
        }
      });
    }
    
    // Convert 'assistant' role to 'model' for Gemini API compatibility
    const role = msg.role === 'assistant' ? 'model' : msg.role;
    
    return {
      role: role,
      parts
    };
  });
  
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
        
    let jsonText = response.text ?? '';
    
    // Handle empty response
    if (!jsonText || jsonText.trim() === '') {
      console.error('Empty response from Gemini API');
      throw new Error('Empty response from Gemini API');
    }
    
    // Clean up common formatting issues
    jsonText = jsonText.trim();
    
    // Handle markdown code blocks
    if (jsonText.includes('```json')) {
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const jsonMatch = jsonRegex.exec(jsonText);
      if (jsonMatch?.[1]) {
        jsonText = jsonMatch[1].trim();
      }
    }
    
    // Handle cases where response starts with unwanted text
    if (jsonText.startsWith('ny\n') || jsonText.startsWith('ny')) {
      jsonText = jsonText.replace(/^ny\n?/, '').trim();
    }
    
    // Ensure we have valid JSON
    if (!jsonText.startsWith('{') && !jsonText.startsWith('[')) {
      console.error('Response does not appear to be JSON:', jsonText);
      throw new Error('Invalid JSON response format');
    }
    
    console.log("🔄 Parsing JSON response...");
    const parsedResponse = JSON.parse(jsonText) as T;
    console.log("✅ JSON parsed successfully");
        
    return parsedResponse;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof SyntaxError) {
      console.error("JSON parsing failed. Raw response might be malformed.");
    }
    throw error;
  }
}


