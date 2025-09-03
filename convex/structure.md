# Convex Folder Structure Algorithm

## Core Principle
**Schema-Driven Architecture**: Folder structure mirrors database schema relationships

## Algorithm

### 1. Schema Analysis
```typescript
// For each table in schema.ts:
FOR EACH table IN schema.tables:
  - Create folder: convex/{tableName}/
  - If table has foreign key relationships:
    - Nest related tables inside parent table folder
    - Example: repository table → convex/githubAccount/repository/
```

### 2. Base Table Structure
```typescript
// For every table folder:
CREATE: convex/{tableName}/
├── query.ts                    // Read operations (internalQuery)
├── mutations/
│   ├── actions/               // External API calls (action)
│   ├── create.ts              // Create operations (internalMutation)
│   ├── update.ts              // Update operations (mutation)
│   └── remove.ts              // Delete operations (mutation)
```

### 3. Actions Branching Logic
```typescript
// For mutations/actions/:
IF action NEEDS external API calls:
  CREATE: mutations/actions/{actionName}.ts

IF action HAS branching logic BASED ON database fields:
  CREATE: mutations/actions/{actionName}/
  ├── {branchCondition}.ts     // e.g., isDefault.ts, isNotDefault.ts

IF action NEEDS service functions:
  CREATE: mutations/actions/services/
  ├── {serviceName}.ts         // Pure service functions
```

### 4. Service Layer Pattern
```typescript
// For external API interactions:
CREATE: mutations/actions/services/
├── {apiService}.ts           // e.g., fetchgithubAccount.ts, exchangeCodeForToken.ts
└── {createService}.ts        // e.g., createRepositoryFromTemplate.ts
```

## Current Implementation Example

### Schema → Folder Mapping:
```typescript
// schema.ts defines:
githubAccount: defineTable({...})
repository: defineTable({
  githubAccountId: v.id("githubAccount"),  // Foreign key relationship
  ...
})
machine: defineTable({
  repositoryId: v.id("repository"),  // Foreign key relationship
  ...
})

// Results in:
convex/
├── githubAccount/                 # Parent table
│   ├── query.ts
│   ├── mutations/
│   │   ├── actions/
│   │   │   ├── services/
│   │   │   │   ├── exchangeCodeForToken.ts
│   │   │   │   └── fetchgithubAccount.ts
│   │   │   ├── create.ts       # Main action router
│   │   │   └── create.ts       # OAuth flow action
│   │   ├── create.ts
│   │   └── remove.ts
│   └── repository/             # Nested child table
│       ├── query.ts
│       ├── mutations/
│       │   ├── actions/
│       │   │   ├── create/     # Branched by isDefault field
│       │   │   │   ├── isDefault.ts
│       │   │   │   └── isNotDefault.ts
│       │   │   ├── services/
│       │   │   │   ├── fetchGithubRepositories.ts
│       │   │   │   ├── fetchGithubRepository.ts
│       │   │   │   └── createRepositoryFromTemplate.ts
│       │   │   └── create.ts   # Main repository action router
│       │   ├── create.ts
│       │   ├── update.ts
│       │   └── remove.ts
│       └── machine/             # Nested grandchild table
│           ├── query.ts
│           ├── mutations/
│           │   ├── actions/
│           │   │   ├── services/
│           │   │   │   ├── createVM.ts
│           │   │   │   └── manageVM.ts
│           │   │   └── create.ts   # Main machine action router
│           │   ├── create.ts
│           │   ├── update.ts
│           │   └── remove.ts
```

## File Creation Checklist

### When Adding New Table:
1. **Define table in schema.ts**
2. **Determine nesting**: Parent table folder or top-level?
3. **Create base structure**: query.ts + mutations/ folder
4. **Add CRUD operations**: create.ts, update.ts, remove.ts
5. **Plan external APIs**: Do you need actions/ folder?
6. **Identify branching**: Any conditional logic based on fields?
7. **Design services**: Pure functions for external calls?

### When Adding New Feature:
1. **Database branching?** → Create subfolder in actions/
2. **External API calls?** → Add to actions/services/
3. **Pure business logic?** → Add to mutations/ root
4. **Read operations?** → Add to query.ts

## Key Patterns

- **Foreign Key = Nesting**: Related tables nest inside parent folders
- **Database Fields = Branching**: Field values determine action subfolders
- **External APIs = Services**: All API calls isolated in services/
- **Runtime Separation**: Actions (Node.js) vs Mutations/Queries (V8)
- **Router Pattern**: Main action files route to specialized handlers

## Quick Reference

```typescript
// Adding new table "posts" with user relationship:
1. schema.ts: defineTable posts with userId foreign key
2. Create: convex/githubAccount/posts/  (nested)
3. Add: query.ts, mutations/, actions/, services/
4. Branch by: postType field → actions/create/byType/
5. Services for: external APIs, file uploads, etc.
```
