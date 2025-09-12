# Frontend Architecture: Schema-Driven Components

> **🚨 IMPORTANT REMINDERS:**
> - **Always use absolute paths with `@/`** for all imports (no relative paths like `../../../`)
> - **Always import UI components from `@/components/ui/`** (never create custom UI components)
> - **Follow schema-driven nesting** where component structure mirrors database relationships

## Core Principle
**Route-Component Separation**: Thin route handlers delegate to rich component implementations that mirror database schema relationships.

## Architecture Pattern

### Dual-Layer Structure
```
app/                          # Next.js App Router (routes only)
├── page.tsx                  # Route: /
├── dashboard/page.tsx        # Route: /user
└── api/route.ts              # API routes

components/pages/             # Component implementations
├── page/component.tsx        # Home page component
├── dashboard/component.tsx   # Dashboard component
└── {entity}/                 # Nested by database schema
    ├── component.tsx         # Main entity component
    └── {childEntity}/        # Child entity components
        └── component.tsx
```

### Route Handler Pattern
```typescript
// app/user/page.tsx - Thin wrapper
"use client";
import { Dashboard } from "@/components/pages/user/component";

export default function DashboardPage() {
  return <Dashboard />;
}
```

### Component Implementation Pattern
```typescript
"use client";
import { useQuery } from "convex/react";
import { useState } from "react";

export function Dashboard() {
  const [selectedId, setSelectedId] = useState<Id<"entity"> | null>(null);
  const data = useQuery(api.query.getData);

  return selectedId ?
    <EntityDetail id={selectedId} /> :
    <EntityList onSelect={setSelectedId} />;
}
```

## Schema Mirroring Principle

### Database → Component Mapping
**Database Structure:**
```
ParentTable
└── ChildTable
    └── GrandchildTable
```

**Component Structure:**
```
components/pages/
└── parent/
    ├── component.tsx           # Parent entity management
    └── child/                  # Child entity context
        ├── component.tsx       # Child entity management
        └── grandchild/         # Grandchild entity context
            └── component.tsx   # Grandchild entity management
```

### Context Propagation
Each level provides context to child components:

```typescript
Parent (user context) →
  Child (selected entity) →
    Grandchild (nested entity) →
      Feature (specific functionality)
```

## Key Patterns

### 1. Route Delegation
- App router pages are minimal wrappers
- All business logic lives in components layer
- Clean separation of routing from implementation

### 2. Schema-Driven Nesting
- Component folder structure mirrors database relationships
- Each folder represents a data context
- Nesting creates clear ownership boundaries

### 3. State Management by Context
- State lifted to appropriate component level
- Parent manages child selection/navigation
- Child manages its own internal state

### 4. UI Component Usage
- **Always use components/ui/**: Import from `@/components/ui/` for consistency
- **Available UI Components**: button, input, textarea, card, dialog, drawer, select, table, etc.
- **Consistent Design System**: All UI components follow the same design patterns
- **Absolute Paths**: Always use `@/` prefix for all imports (components, pages, hooks, etc.)

```typescript
// ✅ Good: Use shared UI components with absolute paths
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useQuery } from "@/convex/_generated/api";
import { Dashboard } from "@/components/pages/user/component";

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <Input placeholder="Enter text" />
        <Button>Submit</Button>
      </CardHeader>
    </Card>
  );
}

// ❌ Bad: Relative paths
import { Button } from "../../../../components/ui/button";
```

### 5. Feature Grouping
```
{entity}/
├── component.tsx           # Main entity view
├── create/component.tsx    # Entity creation
├── settings/component.tsx  # Entity configuration
└── {feature}/              # Feature-specific components
    ├── component.tsx
    └── hook.ts
```