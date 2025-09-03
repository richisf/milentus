import { SchemaType } from "@google/generative-ai";

export const NodeHierarchySchema = {
  type: SchemaType.OBJECT,
  properties: {
    nodes: {
      type: SchemaType.ARRAY,
      description: "Array of nodes forming a hierarchical tree structure",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: {
            type: SchemaType.STRING,
            description: "Unique identifier for this node"
          },
          parentId: {
            type: SchemaType.STRING,
            description: "The ID of this node's parent. Use empty string if this is a root node."
          },
          label: {
            type: SchemaType.STRING,
            description: "Human-readable label for the node"
          }
        },
        required: ["id", "parentId", "label"]
      }
    }
  },
  required: ["nodes"]
} as const;