import { SchemaType } from "@google/generative-ai";

export const Schema = {
  type: SchemaType.OBJECT,
  properties: {
    nodes: {
      type: SchemaType.ARRAY,
      description: "Array of NEW nodes to be added to the existing hierarchical tree structure",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: {
            type: SchemaType.STRING,
            description: "Unique sequential number (e.g., '1', '2', '3'). Continue from the highest existing ID."
          },
          parentId: {
            type: SchemaType.STRING,
            description: "The ID of this node's parent. Use empty string if this is a root node."
          },
          label: {
            type: SchemaType.STRING,
            description: "Human-readable label describing what we do in this step"
          }
        },
        required: ["id", "parentId", "label"]
      }
    }
  },
  required: ["nodes"]
} as const;