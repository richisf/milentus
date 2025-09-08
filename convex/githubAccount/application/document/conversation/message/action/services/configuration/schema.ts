import { SchemaType } from "@google/generative-ai";

export const Schema = {
  type: SchemaType.OBJECT,
  properties: {
    response: {
      type: SchemaType.STRING,
      description: "Your response to the user's message"
    }
  },
  required: ["response"]
} as const;