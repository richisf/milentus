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
      description: "Your response that PROPOSES the core data entities (database tables) for the application. Focus on what data the app manages, not UI features. Present entities like User, Contact, Deal, Task with their relationships. Leave empty ('') when shouldProceedToDetails is true."
    },
    shouldProceedToDetails: {
      type: SchemaType.BOOLEAN,
      description: "Set to true when user validates your proposed entity model with responses like 'yes', 'that works', 'perfect', etc."
    },
    nodes: {
      type: SchemaType.ARRAY,
      description: "REQUIRED when shouldProceedToDetails is true. Document nodes representing the core entities and their relationships. Always provide the actual nodes structure when transitioning.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: {
            type: SchemaType.STRING,
            description: "Unique identifier for the node (use sequential numbers: '1', '2', etc.)"
          },
          parentId: {
            type: SchemaType.STRING,
            description: "Parent node ID (empty string '' for root nodes, or parent's id for children)"
          },
          label: {
            type: SchemaType.STRING,
            description: "Descriptive label for this entity or operation, focusing on data management like 'CRM manages Contacts' or 'Users can create Deals'"
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
  required: ["shouldProceedToDetails", "nodes"],
  additionalProperties: false
} as const;

// Stage 3: Data model and API structure - AI defines backend entities and operations
export const FunctionalityDetailSchema = {
  type: SchemaType.OBJECT,
  properties: {
    response: {
      type: SchemaType.STRING,
      description: "Your response that PROPOSES the data model and API structure. Focus on database entities, their relationships, and CRUD operations rather than UI features. Leave empty ('') when isComplete is true."
    },
    isComplete: {
      type: SchemaType.BOOLEAN,
      description: "Whether you've defined all core entities and operations needed for the backend API"
    },
    nodes: {
      type: SchemaType.ARRAY,
      description: "Complete data model specification with entities and operations",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: {
            type: SchemaType.STRING,
            description: "Unique identifier for the node (use sequential numbers)"
          },
          parentId: {
            type: SchemaType.STRING,
            description: "Parent node ID (empty string for root entities, entity ID for operations/relationships)"
          },
          label: {
            type: SchemaType.STRING,
            description: "Descriptive label explaining the entity, operation, or relationship. Focus on backend functionality like 'Users can create Contact with Records' or 'Contact has many Deals'"
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
  required: ["isComplete", "nodes"],
  additionalProperties: false
} as const;
