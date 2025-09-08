import { SchemaType } from "@google/generative-ai";

// Schema for different conversation stages

// Stage 1: Concept exploration - AI suggests specific interpretations for user validation
export const ConceptExplorationSchema = {
  type: SchemaType.OBJECT,
  properties: {
    response: {
      type: SchemaType.STRING,
      description: "Your response that SUGGESTS specific interpretations, use cases, or target audiences for their application concept. Present concrete suggestions for them to validate rather than asking open questions. Leave empty ('') when shouldProceedToFeatures is true."
    },
    shouldProceedToFeatures: {
      type: SchemaType.BOOLEAN,
      description: "Whether the user has validated your concept interpretation and you can proceed to feature definition"
    },
    conceptSummary: {
      type: SchemaType.STRING,
      description: "Brief summary of the validated concept (only if shouldProceedToFeatures is true)"
    }
  },
  required: ["shouldProceedToFeatures"],
  additionalProperties: false
} as const;

// Stage 2: Core entities definition - AI suggests main data entities for user validation
export const FeatureDefinitionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    response: {
      type: SchemaType.STRING,
      description: "Your response that PROPOSES the core data entities (database tables) for the application. Focus on what data the app manages, not UI features. Present the main entities and their relationships using plain English. Leave empty ('') when shouldProceedToDetails is true."
    },
    shouldProceedToDetails: {
      type: SchemaType.BOOLEAN,
      description: "Set to true when user validates your proposed entity model with responses like 'yes', 'that works', 'perfect', etc."
    },
    kickoffMessage: {
      type: SchemaType.STRING,
      description: "Helpful kickoff message for the details stage (only when shouldProceedToDetails is true). Suggest specific next steps for defining detailed fields and operations for the core entities identified in the features stage."
    },
    nodes: {
      type: SchemaType.ARRAY,
      description: "REQUIRED when shouldProceedToDetails is true. Create a clear nested hierarchy that represents how users interact with the application. Use parentId to create 'inside inside' relationships where child nodes break down parent concepts into sub-components. Let the structure emerge naturally from the application's needs.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: {
            type: SchemaType.STRING,
            description: "Unique identifier for the node (use sequential numbers: '1', '2', etc.)"
          },
          parentId: {
            type: SchemaType.STRING,
            description: "Parent node ID (empty string '' for root nodes, or parent's id for children). Use this to create clear nested relationships where children break down or expand on their parent concepts."
          },
          label: {
            type: SchemaType.STRING,
            description: "Clear, natural description of what users do or what data contains. Use conversational language that anyone can understand. Focus on user actions and important relationships."
          },
          collapsed: {
            type: SchemaType.BOOLEAN,
            description: "Whether this node should be collapsed in the UI (default false). Set to false for important nodes users should see expanded."
          }
        },
        required: ["id", "parentId", "label"]
      }
    }
  },
  required: ["shouldProceedToDetails", "nodes"],
  additionalProperties: false
} as const;

// Stage 3: Data model and API structure - AI defines backend entities and operations
export const FunctionalityDetailSchema = {
  type: SchemaType.OBJECT,
  properties: {
    response: {
      type: SchemaType.STRING,
      description: "Your response that PROPOSES the detailed data model and structure. Focus on database entities, their relationships, and user operations rather than UI features. Use the established hierarchy patterns. Leave empty ('') when hasChanges is true."
    },
    hasChanges: {
      type: SchemaType.BOOLEAN,
      description: "Whether you want to add new nodes to extend the existing structure. Set to true when you have new details to add."
    },
    newNodes: {
      type: SchemaType.ARRAY,
      description: "ONLY NEW nodes to add to the existing structure. Do NOT repeat existing nodes. These will be added to the current document nodes. Only provide when hasChanges is true.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: {
            type: SchemaType.STRING,
            description: "Unique identifier for the NEW node (use sequential numbers that don't conflict with existing nodes)"
          },
          parentId: {
            type: SchemaType.STRING,
            description: "Parent node ID - can reference existing nodes or other new nodes. Use existing node IDs to attach new details to current structure."
          },
          label: {
            type: SchemaType.STRING,
            description: "Friendly plain English description of the new detail or specification. Use patterns like 'Users can create [Entity] with [specific fields]' or '[Field] must be [constraint/validation rule]'."
          },
          collapsed: {
            type: SchemaType.BOOLEAN,
            description: "Whether this node should be collapsed in the UI (default false)"
          }
        },
        required: ["id", "parentId", "label"]
      }
    }
  },
  required: ["hasChanges"],
  additionalProperties: false
} as const;
