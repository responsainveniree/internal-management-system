# Project AI Guidelines

## 1. Project Overview & Context

This project is an internal hotel management system designed to be extended into a Point of Sale (POS), ordering, and booking application. Its primary objective is to empower hotel staff with precise auditing mechanisms and real-time inventory/storage tracking.

## 2. Tech Stack Specification

- **Framework:** Next.js (App Router)
- **Language:** TypeScript (Strict Mode required)
- **Database & ORM:** PostgreSQL running with Prisma ORM
- **Styling & UI:** Tailwind CSS combined with shadcn/ui components. Always use shadcn element if there's already installed.
- **State Management & Fetching:** React Server Components (RSC), TanStack Query, and Zod for schema validation
- **Testing:** Playwright for end-to-end testing and jest for unit tests. For unit test use jest-extended-mock for mocking.

## 3. Core Coding Rules & Standards

- **Component Architecture:** Default aggressively to React Server Components (RSC). Apply the `'use client'` directive exclusively when implementing state, lifecycle effects, or interactive browser APIs.
- **Data Fetching Layer:** Perform data fetching directly inside async Server Components utilizing Prisma. Refrain from creating standalone Next.js internal API routes (`app/api/*`) unless handling third-party webhooks, authentication triggers, or complex clientside pooling demands.
- **Naming Conventions:**
  - Use `PascalCase` for React Component filenames and export names.
  - Use `camelCase` for variable, method, and function declarations.
  - Use `kebab-case` for general structural directories and feature asset configurations.
  - **Strict Feature File Extensions:** Append exact operational classifiers to matching files: `*.api.ts`, `*.hooks.ts`, `*.keys.ts`, `*.repository.ts`, `*.service.ts`, `*.styles.ts`, `*.types.ts`, and `*.utils.ts`.

## 4. Database & Prisma Workflow

- **Schema Evolution:** Do not modify the target database layout without explicit permission. If modification is agreed upon, make structural adaptations inside `prisma/schema.prisma` first.
- **Database Connection Management:** Instantiate `PrismaClient` using a global singleton configuration block to mitigate connection-exhaustion errors during Next.js live hot-reloading development loops.
- **Data Sanitization:** Validate all incoming requests and payload parameters using a rigorous Zod schema layer prior to feeding arguments to Prisma execution queries.

## 5. Key Commands & Scripts

- **Local Workspace Development:** `npm run dev`
- **Production Build Validation:** `npm run build`
- **Database Sync & Client Update:** `npx prisma generate && npx prisma migrate dev`

## 6. Negative Constraints ("Do Not" Parameters)

- **No Escape Hatches:** Never invoke the TypeScript `any` type interface. Build out explicit structural shapes or clear type maps.
- **ORM First:** Do not execute raw SQL syntax blocks unless explicitly directed due to performance bottlenecking limitations.
- **Pure Utility Styles:** Do not inject native inline structural style parameters; defer layout design configurations completely to Tailwind utility signatures.
- **Preserve Intent:** Never clear out operational logic comments, diagnostic wrappers, or error boundary handlers while rewriting code implementations.
- **No Direct Client Queries:** Never bridge runtime database calls onto the client side. Ensure all user-facing visual modules stream values via RSC pipelines or pass client mutations through secure API handlers or server boundaries.

## 7. Project Folder Structure

Adhere strictly to this feature-driven structural layout when adding files or features:

```text
├── app/                      # Routing Layer (Keep as thin as possible)
│   ├── (auth)/               # Unauthenticated routes group
│   ├── (authenticated)/      # Authenticated workflow routes group
│   └── api/                  # Public endpoints, Webhooks, or NextAuth handlers
├── features/                 # Modular Domain Layer (Core Business Logic Slices)
│   └── [feature-name]/       # Target Domain Slice (e.g., categories, items, locations)
│       ├── [feature].api.ts         # Network API client abstractions
│       ├── [feature].hooks.ts       # React Query / TanStack hooks mutations
│       ├── [feature].keys.ts        # Query key factories for cache invalidation
│       ├── [feature].repository.ts  # Prisma database direct execution tier
│       ├── [feature].service.ts     # Pure validation & formatting calculations
│       ├── [feature].styles.ts      # Feature-scoped structural Tailwind designs
│       ├── [feature].types.ts       # Domain specific TS type declarations
│       ├── [feature].utils.ts       # Standalone mathematical/data helpers
│       └── components/              # Parent UI layout elements
│           └── sub-components/      # Micro modular isolated UI primitives
├── prisma/                   # Persistence Layer config
│   ├── schema.prisma         # Database blueprints
│   └── migrations/           # Time-travel database schemas
├── shared/                   # Universal Infrastructure Layer (Cross-cutting concerns)
│   ├── components/           # System global components (Sidebar, Topbar)
│   ├── db/                   # Global Prisma initialization singleton
│   ├── hooks/                # Universal React window/state actions
│   └── lib/                  # Centralized cross-feature configurations
│       ├── validations/      # Runtime cross-entity validators
│       └── zods/             # Strict database request schemas
└── tests/                    # Testing Suites (Integration, Specs, Mock engines)
```

## 8. Feature Development Workflow Pipeline

Follow this rigid development order chronologically for every new feature, table, or slice:

### A. Data & Business Logic Layer (Server-Side)

1. **Repository (`*.repository.ts`):** Write the direct Prisma Client database queries, mutations, and isolation scopes.
2. **Service (`*.service.ts`):** Build validation schemas, wrap parameters with business logic validations, handle error states, and prepare clean response transformations.

### B. Interface & Verification Layer

#### For Read-Only data via React Server Components (RSC):

1. Skip API endpoints entirely. Import and execute the **Service Layer** functions directly inside your `page.tsx` or RSC wrapper within an `async/await` sequence.

#### For Mutations (Create, Update, Delete) or Client-Side Rendering Flows:

2. **Route (`app/api/[route]/route.ts`):** Establish the HTTP API handler endpoint or Next.js Server Action wrapper.
3. **Postman & Test File Validation:** Verify the query interface payload against execution outputs via a test script or manual request assertion before crafting UI bindings.
4. **API Client (`*.api.ts`):** Implement the frontend network transfer wrapper (e.g., fetch or axios instance tracking).
5. **Hooks (`*.hooks.ts`):** Encapsulate the API client abstraction inside an asynchronous TanStack Query (`useQuery` / `useMutation`) state tracking lifecycle. Use `*.keys.ts` globally to cleanly invalidate cache arrays.

### C. Frontend Presentation Layer

1. **FE / UI Components:** Create atomic component interfaces inside `components/` and `sub-components/` matching local tailwind style variables (`*.styles.ts`).
2. **Page Layer (`page.tsx`):** Tie features together at the Next.js page route file tree endpoint.

## 9. AI-Optimized Machine Reference Materials

When pulling structural patterns or API lookups, favor reading raw text summaries via these context-optimized endpoints:

- **Next.js AI Context Map:** `https://nextjs.org/llms.txt`
- **Prisma Core Reference:** `https://raw.githubusercontent.com/prisma/prisma/main/README.md`
- **TypeScript Language Specifications:** `https://www.typescriptlang.org/llms.txt`
- **Design System Guidelines:** `DESIGN.MD`
