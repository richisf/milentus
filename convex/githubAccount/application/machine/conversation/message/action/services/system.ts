"use node";

export const CLAUDE_SYSTEM_PROMPT = `
> ** IMPORTANT REMINDERS:**
> - **Always use absolute paths with @/** for all imports (no relative paths like ../../../)
> - **Always import UI components from @/components/ui/** (never create custom UI components)
> - **Follow schema-driven nesting** where component and convex folder structure mirrors database relationships

# Frontend Architecture: Schema-Driven Components

## Core Principle
**Route-Component Separation**: Thin route handlers delegate to rich component implementations that mirror database schema relationships.

## Architecture Pattern

### Dual-Layer Structure

app/                          # Next.js App Router (routes only)
├── page.tsx                  # Route: /
├── dashboard/page.tsx        # Route: /dashboard
└── api/route.ts              # API routes

components/pages/             # Component implementations
├── page/component.tsx        # Home page component
├── dashboard/component.tsx   # Dashboard component
└── {entity}/                 # Nested by database schema
    ├── component.tsx         # Main entity component
    └── {childEntity}/        # Child entity components
        └── component.tsx

### Route Handler Pattern
typescript
// app/dashboard/page.tsx - Thin wrapper
"use client";
import { Dashboard } from "@/components/pages/dashboard/component";

export default function DashboardPage() {
  return <Dashboard />;
}

### Component Implementation Pattern
typescript
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

## Schema Mirroring Principle

### Database → Component Mapping
**Database Structure:**
ParentTable
└── ChildTable
    └── GrandchildTable

**Component Structure:**
components/pages/
└── parent/
    ├── component.tsx           # Parent entity management
    └── child/                  # Child entity context
        ├── component.tsx       # Child entity management
        └── grandchild/         # Grandchild entity context
            └── component.tsx   # Grandchild entity management

### Context Propagation
Each level provides context to child components:

typescript
Parent (user context) →
  Child (selected entity) →
    Grandchild (nested entity) →
      Feature (specific functionality)

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
- **Always use components/ui/**: Import from @/components/ui/ for consistency
- **Available UI Components**: button, input, textarea, card, dialog, drawer, select, table, etc.
- **Consistent Design System**: All UI components follow the same design patterns

typescript
//  Good: Use shared UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <Input placeholder=Enter text />
        <Button>Submit</Button>
      </CardHeader>
    </Card>
  );
}

### 5. Feature Grouping
{entity}/
├── component.tsx           # Main entity view
├── create/component.tsx    # Entity creation
├── settings/component.tsx  # Entity configuration
└── {feature}/              # Feature-specific components
    ├── component.tsx
    └── hook.ts


## Backend Convex Folder
**Foreign Key Relationships → Folder Nesting**: Database schema dictates folder structure through dependency analysis.

## Schema Analysis Algorithm

### Step 1: Parse Schema Dependencies
typescript
FOR EACH table IN schema.ts:
  dependencies = findForeignKeyReferences(table)

  IF dependencies.length === 0:
    CREATE: convex/{tableName}/          # Top-level table
  ELSE:
    parentTable = findPrimaryParent(dependencies)
    CREATE: convex/{parentTable}/{tableName}/  # Nested table

### Step 2: Base Structure Creation
typescript
FOR EACH tableFolder:
  CREATE base structure:
  ├── query/                    # Read operations (internalQuery)
  │   └── {queryType}.ts        # e.g., by_id.ts, by_parent.ts
  └── mutation/                 # Write operations
      ├── create.ts             # internalMutation
      ├── update.ts             # mutation
      └── delete.ts             # mutation


### Step 3: Actions Branching Logic
typescript
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

## Schema-to-Folder Mapping Examples

### Database Schema:
typescript
ParentTable: { /* no foreign keys */ }

ChildTable: {
  parentId: v.id("ParentTable")
}

GrandchildTable: {
  childId: v.id("ChildTable")
}

### Generated Folder Structure:

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

## Pattern Recognition Rules

### 1. **Top-Level Tables** (No Dependencies)

convex/
├── User/
├── Organization/
└── Product/

### 2. **Nested Tables** (Foreign Key Dependencies)

convex/
├── User/
│   ├── Project/              # project.userId → User._id
│   └── Organization/
│       └── Team/             # team.organizationId → Organization._id
└── Product/
    └── Review/               # review.productId → Product._id

### 3. **Complex Branching** (Business Logic Paths)
action/
├── create.ts                 # Entry point
└── create/                   # Branching logic
    ├── standard.ts           # Standard creation path
    ├── premium.ts            # Premium creation path
    └── services/             # Shared services
        ├── validation.ts
        ├── notification.ts
        └── billing.ts

### 4. **Service Decomposition** (External API Calls)
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

## Implementation Checklist

### Adding New Table:
1. **Define schema** in schema.ts
2. **Analyze dependencies** → Find foreign key relationships
3. **Determine nesting level** → Top-level or nested?
4. **Create folder structure** → convex/{parentTable}/{tableName}/
5. **Add base operations** → query/, mutation/
6. **Plan complex operations** → Need action/ folder?
7. **Identify branching** → Conditional business logic?

### Adding New Feature:
1. **Pure database operation?** → Add to mutation/
2. **External API calls?** → Add to action/services/
3. **Complex branching logic?** → Create subfolder in action/
4. **Read operation?** → Add to query/

## Key Principles

1. **Schema-Driven**: Folder structure mirrors database relationships
2. **Dependency Nesting**: Child tables nest inside parent folders
3. **CRUD Foundation**: Every table has read/write operations
4. **Action Branching**: Complex logic gets dedicated folders
5. **Service Separation**: External APIs isolated in services/
6. **Naming Convention**: Files named by operation type or query field

## File Type Responsibilities

- **Queries** (query/): Database read operations
- **Mutations** (mutation/): Database write operations
- **Actions** (action/): Public API endpoints + orchestration
- **Services** (action/services/): External API calls + complex logic
- **Branched Actions**: Different business logic paths

# Convex guidelines
## Function guidelines
### New function syntax
- ALWAYS use the new function syntax for Convex functions. For example:
typescript
import { query } from "./_generated/server";
import { v } from "convex/values";
export const f = query({
    args: {},
    returns: v.null(),
    handler: async (ctx, args) => {
    // Function body
    },
});
 

### Http endpoint syntax
- HTTP endpoints are defined in convex/http.ts and require an httpAction decorator. For example:
typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
const http = httpRouter();
http.route({
    path: "/echo",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
    const body = await req.bytes();
    return new Response(body, { status: 200 });
    }),
});
 
- HTTP endpoints are always registered at the exact path you specify in the path field. For example, if you specify /api/someRoute, the endpoint will be registered at /api/someRoute.

### Validators
- Below is an example of an array validator:
typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export default mutation({
args: {
    simpleArray: v.array(v.union(v.string(), v.number())),
},
handler: async (ctx, args) => {
    //...
},
});
 
- Below is an example of a schema with validators that codify a discriminated union type:
typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    results: defineTable(
        v.union(
            v.object({
                kind: v.literal("error"),
                errorMessage: v.string(),
            }),
            v.object({
                kind: v.literal("success"),
                value: v.number(),
            }),
        ),
    )
});
 
- Always use the v.null() validator when returning a null value. Below is an example query that returns a null value:
typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const exampleQuery = query({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
      console.log("This query returns a null value");
      return null;
  },
});
 
- Here are the valid Convex types along with their respective validators:
Convex Type  | TS/JS type  |  Example Usage         | Validator for argument validation and schemas  | Notes                                                                                                                                                                                                 |
| ----------- | ------------| -----------------------| -----------------------------------------------| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Id          | string      | doc._id              | v.id(tableName)                              |                                                                                                                                                                                                       |
| Null        | null        | null                 | v.null()                                     | JavaScript's undefined is not a valid Convex value. Functions the return undefined or do not return will return null when called from a client. Use null instead.                             |
| Int64       | bigint      | 3n                   | v.int64()                                    | Int64s only support BigInts between -2^63 and 2^63-1. Convex supports bigint's in most modern browsers.                                                                                              |
| Float64     | number      | 3.1                  | v.number()                                   | Convex supports all IEEE-754 double-precision floating point numbers (such as NaNs). Inf and NaN are JSON serialized as strings.                                                                      |
| Boolean     | boolean     | true                 | v.boolean()                                  |
| String      | string      | "abc"                | v.string()                                   | Strings are stored as UTF-8 and must be valid Unicode sequences. Strings must be smaller than the 1MB total size limit when encoded as UTF-8.                                                         |
| Bytes       | ArrayBuffer | new ArrayBuffer(8)   | v.bytes()                                    | Convex supports first class bytestrings, passed in as ArrayBuffer's. Bytestrings must be smaller than the 1MB total size limit for Convex types.                                                     |
| Array       | Array       | [1, 3.2, "abc"]      | v.array(values)                             | Arrays can have at most 8192 values.                                                                                                                                                                  |
| Object      | Object      | {a: "abc"}           | v.object({property: value})                  | Convex only supports "plain old JavaScript objects" (objects that do not have a custom prototype). Objects can have at most 1024 entries. Field names must be nonempty and not start with $ or _. |
| Record      | Record      | {"a": "1", "b": "2"} | v.record(keys, values)                       | Records are objects at runtime, but can have dynamic keys. Keys must be only ASCII characters, nonempty, and not start with $ or _.                                                               |

### Function registration
- Use internalQuery, internalMutation, and internalAction to register internal functions. These functions are private and aren't part of an app's API. They can only be called by other Convex functions. These functions are always imported from ./_generated/server.
- Use query, mutation, and action to register public functions. These functions are part of the public API and are exposed to the public Internet. Do NOT use query, mutation, or action to register sensitive internal functions that should be kept private.
- You CANNOT register a function through the api or internal objects.
- ALWAYS include argument and return validators for all Convex functions. This includes all of query, internalQuery, mutation, internalMutation, action, and internalAction. If a function doesn't return anything, include returns: v.null() as its output validator.
- If the JavaScript implementation of a Convex function doesn't have a return value, it implicitly returns null.

### Function calling
- Use ctx.runQuery to call a query from a query, mutation, or action.
- Use ctx.runMutation to call a mutation from a mutation or action.
- Use ctx.runAction to call an action from an action.
- ONLY call an action from another action if you need to cross runtimes (e.g. from V8 to Node). Otherwise, pull out the shared code into a helper async function and call that directly instead.
- Try to use as few calls from actions to queries and mutations as possible. Queries and mutations are transactions, so splitting logic up into multiple calls introduces the risk of race conditions.
- All of these calls take in a FunctionReference. Do NOT try to pass the callee function directly into one of these calls.
- When using ctx.runQuery, ctx.runMutation, or ctx.runAction to call a function in the same file, specify a type annotation on the return value to work around TypeScript circularity limitations. For example,

export const f = query({
  args: { name: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    return "Hello " + args.name;
  },
});

export const g = query({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    const result: string = await ctx.runQuery(api.example.f, { name: "Bob" });
    return null;
  },
});

### Function references
- Function references are pointers to registered Convex functions.
- Use the api object defined by the framework in convex/_generated/api.ts to call public functions registered with query, mutation, or action.
- Use the internal object defined by the framework in convex/_generated/api.ts to call internal (or private) functions registered with internalQuery, internalMutation, or internalAction.
- Convex uses file-based routing, so a public function defined in convex/example.ts named f has a function reference of api.example.f.
- A private function defined in convex/example.ts named g has a function reference of internal.example.g.
- Functions can also registered within directories nested within the convex/ folder. For example, a public function h defined in convex/messages/access.ts has a function reference of api.messages.access.h.

### Api design
- Convex uses file-based routing, so thoughtfully organize files with public query, mutation, or action functions within the convex/ directory.
- Use query, mutation, and action to define public functions.
- Use internalQuery, internalMutation, and internalAction to define private, internal functions.

### Pagination
- Paginated queries are queries that return a list of results in incremental pages.
- You can define pagination using the following syntax:

typescript
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
export const listWithExtraArg = query({
    args: { paginationOpts: paginationOptsValidator, author: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
        .query("messages")
        .filter((q) => q.eq(q.field("author"), args.author))
        .order("desc")
        .paginate(args.paginationOpts);
    },
});

Note: paginationOpts is an object with the following properties:
- numItems: the maximum number of documents to return (the validator is v.number())
- cursor: the cursor to use to fetch the next page of documents (the validator is v.union(v.string(), v.null()))
- A query that ends in .paginate() returns an object that has the following properties:
                            - page (contains an array of documents that you fetches)
                            - isDone (a boolean that represents whether or not this is the last page of documents)
                            - continueCursor (a string that represents the cursor to use to fetch the next page of documents)


## Validator guidelines
- v.bigint() is deprecated for representing signed 64-bit integers. Use v.int64() instead.
- Use v.record() for defining a record type. v.map() and v.set() are not supported.

## Schema guidelines
- Always define your schema in convex/schema.ts.
- Always import the schema definition functions from convex/server:
- System fields are automatically added to all documents and are prefixed with an underscore. The two system fields that are automatically added to all documents are _creationTime which has the validator v.number() and _id which has the validator v.id(tableName).
- Always include all index fields in the index name. For example, if an index is defined as ["field1", "field2"], the index name should be "by_field1_and_field2".
- Index fields must be queried in the same order they are defined. If you want to be able to query by "field1" then "field2" and by "field2" then "field1", you must create separate indexes.

## Typescript guidelines
- You can use the helper typescript type Id imported from './_generated/dataModel' to get the type of the id for a given table. For example if there is a table called 'users' you can use Id<'users'> to get the type of the id for that table.
- If you need to define a Record make sure that you correctly provide the type of the key and value in the type. For example a validator v.record(v.id('users'), v.string()) would have the type Record<Id<'users'>, string>. Below is an example of using Record with an Id type in a query:
ts
import { query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export const exampleQuery = query({
    args: { userIds: v.array(v.id("users")) },
    returns: v.record(v.id("users"), v.string()),
    handler: async (ctx, args) => {
        const idToUsername: Record<Id<"users">, string> = {};
        for (const userId of args.userIds) {
            const user = await ctx.db.get(userId);
            if (user) {
                idToUsername[user._id] = user.username;
            }
        }

        return idToUsername;
    },
});
- Be strict with types, particularly around id's of documents. For example, if a function takes in an id for a document in the 'users' table, take in Id<'users'> rather than string.
- Always use as const for string literals in discriminated union types.
- When using the Array type, make sure to always define your arrays as const array: Array<T> = [...];
- When using the Record type, make sure to always define your records as const record: Record<KeyType, ValueType> = {...};
- Always add @types/node to your package.json when using any Node.js built-in modules.

## Full text search guidelines
- A query for "10 messages in channel '#general' that best match the query 'hello hi' in their body" would look like:

const messages = await ctx.db
  .query("messages")
  .withSearchIndex("search_body", (q) =>
    q.search("body", "hello hi").eq("channel", "#general"),
  )
  .take(10);

## Query guidelines
- Do NOT use filter in queries. Instead, define an index in the schema and use withIndex instead.
- Convex queries do NOT support .delete(). Instead, .collect() the results, iterate over them, and call ctx.db.delete(row._id) on each result.
- Use .unique() to get a single document from a query. This method will throw an error if there are multiple documents that match the query.
- When using async iteration, don't use .collect() or .take(n) on the result of a query. Instead, use the for await (const row of query) syntax.
### Ordering
- By default Convex always returns documents in ascending _creationTime order.
- You can use .order('asc') or .order('desc') to pick whether a query is in ascending or descending order. If the order isn't specified, it defaults to ascending.
- Document queries that use indexes will be ordered based on the columns in the index and can avoid slow table scans.


## Mutation guidelines
- Use ctx.db.replace to fully replace an existing document. This method will throw an error if the document does not exist.
- Use ctx.db.patch to shallow merge updates into an existing document. This method will throw an error if the document does not exist.

## Action guidelines
- Always add "use node"; to the top of files containing actions that use Node.js built-in modules.
- Never use ctx.db inside of an action. Actions don't have access to the database.
- Below is an example of the syntax for an action:
typescript
import { action } from "./_generated/server";

export const exampleAction = action({
    args: {},
    returns: v.null(),
    handler: async (ctx, args) => {
        console.log("This action does not return anything");
        return null;
    },
});
typescript

## Scheduling guidelines
### Cron guidelines
- Only use the crons.interval or crons.cron methods to schedule cron jobs. Do NOT use the crons.hourly, crons.daily, or crons.weekly helpers.
- Both cron methods take in a FunctionReference. Do NOT try to pass the function directly into one of these methods.
- Define crons by declaring the top-level crons object, calling some methods on it, and then exporting it as default. For example,
typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

const empty = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log("empty");
  },
});

const crons = cronJobs();

// Run internal.crons.empty every two hours.
crons.interval("delete inactive users", { hours: 2 }, internal.crons.empty, {});

export default crons;

- You can register Convex functions within crons.ts just like any other file.
- If a cron calls an internal function, always import the internal object from '_generated/api', even if the internal function is registered in the same file.


## File storage guidelines
- Convex includes file storage for large files like images, videos, and PDFs.
- The ctx.storage.getUrl() method returns a signed URL for a given file. It returns null if the file doesn't exist.
- Do NOT use the deprecated ctx.storage.getMetadata call for loading a file's metadata.

                    Instead, query the _storage system table. For example, you can use ctx.db.system.get to get an Id<"_storage">.
typescript
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

type FileMetadata = {
    _id: Id<"_storage">;
    _creationTime: number;
    contentType?: string;
    sha256: string;
    size: number;
}

export const exampleQuery = query({
    args: { fileId: v.id("_storage") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const metadata: FileMetadata | null = await ctx.db.system.get(args.fileId);
        console.log(metadata);
        return null;
    },
});
typescript
- Convex storage stores items as Blob objects. You must convert all items to/from a Blob when using Convex storage.


A query function that takes two arguments looks like:

typescript
// convex/myFunctions.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myQueryFunction = query({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Read the database as many times as you need here.
    // See https://docs.convex.dev/database/reading-data.
    const documents = await ctx.db.query("tablename").collect();

    // Arguments passed from the client are properties of the args object.
    console.log(args.first, args.second);

    // Write arbitrary JavaScript here: filter, aggregate, build derived data,
    // remove non-public properties, or create new objects.
    return documents;
  },
});
typescript

Using this query function in a React component looks like:

typescript
const data = useQuery(api.myFunctions.myQueryFunction, {
  first: 10,
  second: "hello",
});

A mutation function looks like:

typescript
// convex/myFunctions.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const myMutationFunction = mutation({
  // Validators for arguments.
  args: {
    first: v.string(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Insert or modify documents in the database here.
    // Mutations can also read from the database like queries.
    // See https://docs.convex.dev/database/writing-data.
    const message = { body: args.first, author: args.second };
    const id = await ctx.db.insert("messages", message);

    // Optionally, return a value from your mutation.
    return await ctx.db.get(id);
  },
});
typescript

Using this mutation function in a React component looks like:

typescript
const mutation = useMutation(api.myFunctions.myMutationFunction);
function handleButtonPress() {
  // fire and forget, the most common way to use mutations
  mutation({ first: "Hello!", second: "me" });
  // OR
  // use the result once the mutation has completed
  mutation({ first: "Hello!", second: "me" }).then((result) =>
    console.log(result),
  );
}
typescript
`;
