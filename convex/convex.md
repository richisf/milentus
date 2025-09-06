# Convex Folder Structure

## Core Principle
**Schema-Driven Architecture**: Folder structure mirrors database schema relationships and nesting.

## Creation Algorithm

### 1. Schema Analysis
For each table in `schema.ts`:
- Create folder: `convex/{tableName}/`
- If table has foreign key relationships, nest related tables inside parent table folder
- Example: `repository` table → `convex/githubAccount/repository/`

### 2. Base Table Structure
For every table folder:
```
CREATE: convex/{tableName}/
├── query.ts                    # Read operations (internalQuery)
├── mutations/
│   ├── create.ts              # Create operations (internalMutation)
│   ├── update.ts              # Update operations (mutation)
│   └── remove.ts              # Delete operations (mutation)
```

### 3. Actions Branching Logic
For mutations/actions/:
```
IF action NEEDS external API calls:
  CREATE: mutations/actions/{actionName}.ts

IF action HAS branching logic BASED ON database fields:
  CREATE: mutations/actions/{actionName}/
  ├── {branchCondition}.ts     # e.g., default.ts, nonDefault.ts

IF action NEEDS service functions:
  CREATE: mutations/actions/services/
  ├── {serviceName}.ts         # Pure service functions
```

## Schema Foundation
- **Schema Definition**: All tables defined in `schema.ts`
- **Auth Integration**: Basic auth table with `auth.ts` in `/convex/`
- **Table Relationships**: Tables can be independent or nested based on foreign key relationships
- **Foreign Key = Nesting**: Related tables nest inside parent folders

## Folder Structure Pattern

### 1. Parent Table Structure
```
convex/
├── githubAccount/          # Parent table (no dependencies)
│   ├── query/
│   │   └── by_user.ts      # Read operations (named by query field)
│   ├── mutation/
│   │   ├── create.ts       # Database create operations
│   │   ├── remove.ts       # Database delete operations
│   │   └── update.ts       # Database update operations
│   └── action/
│       ├── create.ts       # API entry point (orchestrator)
│       └── services/
│           ├── create.ts   # Main service orchestrator
│           └── create/     # Individual operations
│               ├── exchange.ts
│               └── fetch.ts
```

### 2. Nested Table Structure
Tables with foreign key dependencies nest inside their parent:

```
convex/
└── githubAccount/
    └── repository/         # Depends on githubAccount
        ├── query/
        ├── mutation/
        ├── action/
        │   ├── create.ts   # Entry point
        │   ├── create/     # Branched business logic
        │   │   ├── default.ts      # Default repository creation
        │   │   ├── nonDefault.ts   # User repository creation
        │   │   └── services/
        │   │       └── nonDefault.ts
        │   ├── remove.ts
        │   └── services/
        │       └── remove.ts
        ├── document/       # Depends on repository
        └── machine/        # Depends on repository
```

### 3. Business Logic Branching
When actions have different business logic paths, create subfolders:

```
action/
├── create.ts               # Main entry point
└── create/                 # Branched logic folder
    ├── default.ts          # Path 1: Default creation
    ├── nonDefault.ts       # Path 2: Custom creation
    └── services/           # Services for branched logic
        └── nonDefault.ts
```

### 4. Complex Operations
For operations with multiple orchestration paths:

```
action/
├── update.ts               # Entry point
└── update/                 # Branched operations
    ├── files.ts            # File-based updates
    ├── message.ts          # Message-based updates
    └── services/           # Shared services
        ├── response.ts     # Common response handler
        ├── files/          # File-specific services
        └── message/        # Message-specific services
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

1. **CRUD Operations**: Every table has `query/` (Read) and `mutation/` (Create, Update, Delete)
2. **API Entry Points**: Actions serve as public API endpoints
3. **Service Orchestration**: Services handle business logic and external API calls
4. **Business Logic Branching**: Different logic paths get separate action files
5. **Nesting by Dependency**: Child tables nest inside parent table folders
6. **Naming Convention**: Files named by primary operation or query field

## File Responsibilities

- **Queries**: Database read operations (`by_user.ts`, `by_id.ts`)
- **Mutations**: Database write operations (`create.ts`, `update.ts`, `remove.ts`)
- **Actions**: API endpoints and business logic orchestration
- **Services**: External API calls and complex business logic
- **Branched Actions**: Different business logic paths for the same operation