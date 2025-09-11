# Convex Schema-Driven Architecture

## Core Algorithm
**Foreign Key Relationships → Folder Nesting**: Database schema dictates folder structure through dependency analysis.

## Schema Analysis Algorithm

### Step 1: Parse Schema Dependencies
```typescript
FOR EACH table IN schema.ts:
  dependencies = findForeignKeyReferences(table)

  IF dependencies.length === 0:
    CREATE: convex/{tableName}/          # Top-level table
  ELSE:
    parentTable = findPrimaryParent(dependencies)
    CREATE: convex/{parentTable}/{tableName}/  # Nested table
```

### Step 2: Base Structure Creation
```typescript
FOR EACH tableFolder:
  CREATE base structure:
  ├── query/                    # Read operations (internal.query)
  │   └── {queryType}.ts        # e.g., by_id.ts, by_parent.ts
  └── mutation/                 # Write operations
      ├── create.ts             # internalMutation
      ├── update.ts             # mutation
      └── delete.ts             # mutation
```

### Step 3: Actions Branching Logic
```typescript
IF operation NEEDS external APIs:
  CREATE: action/{operationName}.ts

IF operation HAS conditional logic:
  CREATE: action/{operationName}/
  ├── {condition1}.ts           # e.g., default.ts, custom.ts
  └── services/                 # Shared utilities
      └── {condition1}.ts

IF operation NEEDS service decomposition:
  CREATE: action/services/
  ├── {serviceName}.ts          # Pure business logic
  └── {serviceName}/            # Complex service branching
      └── {subService}.ts
```

## Schema-to-Folder Mapping Examples

### Database Schema:
```typescript
ParentTable: { /* no foreign keys */ }

ChildTable: {
  parentId: v.id("ParentTable")
}

GrandchildTable: {
  childId: v.id("ChildTable")
}
```

### Generated Folder Structure:
```
convex/
├── ParentTable/               # Top-level (no dependencies)
│   ├── query/
│   │   └── by_id.ts
│   ├── mutation/
│   │   ├── create.ts
│   │   ├── update.ts
│   │   └── delete.ts
│   └── action/                 # If external APIs needed
│       ├── create.ts
│       └── services/
└── ParentTable/
    └── ChildTable/            # Nested (depends on ParentTable)
        ├── query/
        │   └── by_parent.ts
        ├── mutation/
        │   ├── create.ts
        │   ├── update.ts
        │   └── delete.ts
        └── ParentTable/
            └── ChildTable/
                └── GrandchildTable/  # Deep nesting
```

## Pattern Recognition Rules

### 1. **Top-Level Tables** (No Dependencies)
```
convex/
├── User/
├── Organization/
└── Product/
```

### 2. **Nested Tables** (Foreign Key Dependencies)
```
convex/
├── User/
│   ├── Project/              # project.userId → User._id
│   └── Organization/
│       └── Team/             # team.organizationId → Organization._id
└── Product/
    └── Review/               # review.productId → Product._id
```

### 3. **Complex Branching** (Business Logic Paths)
```
action/
├── create.ts                 # Entry point
└── create/                   # Branching logic
    ├── standard.ts           # Standard creation path
    ├── premium.ts            # Premium creation path
    └── services/             # Shared services
        ├── validation.ts
        ├── notification.ts
        └── billing.ts
```

### 4. **Service Decomposition** (External API Calls)
```
action/
├── update.ts
└── update/
    ├── profile.ts            # Profile update logic
    ├── settings.ts           # Settings update logic
    └── services/
        ├── email/
        │   ├── sendWelcome.ts
        │   └── sendNotification.ts
        ├── payment/
        │   ├── processCharge.ts
        │   └── refundPayment.ts
        └── file/
            └── uploadAvatar.ts
```

## Implementation Checklist

### Adding New Table:
1. **Define schema** in `schema.ts`
2. **Analyze dependencies** → Find foreign key relationships
3. **Determine nesting level** → Top-level or nested?
4. **Create folder structure** → `convex/{parentTable}/{tableName}/`
5. **Add base operations** → query/, mutation/
6. **Plan complex operations** → Need action/ folder?
7. **Identify branching** → Conditional business logic?

### Adding New Feature:
1. **Pure database operation?** → Add to `mutation/`
2. **External API calls?** → Add to `action/services/`
3. **Complex branching logic?** → Create subfolder in `action/`
4. **Read operation?** → Add to `query/`

## Key Principles

1. **Schema-Driven**: Folder structure mirrors database relationships
2. **Dependency Nesting**: Child tables nest inside parent folders
3. **CRUD Foundation**: Every table has read/write operations
4. **Action Branching**: Complex logic gets dedicated folders
5. **Service Separation**: External APIs isolated in services/
6. **Naming Convention**: Files named by operation type or query field

## File Type Responsibilities

- **Queries** (`query/`): Database read operations
- **Mutations** (`mutation/`): Database write operations
- **Actions** (`action/`): Public API endpoints + orchestration
- **Services** (`action/services/`): External API calls + complex logic
- **Branched Actions**: Different business logic paths