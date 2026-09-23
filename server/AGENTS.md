# Backend Agent Instructions

This file defines the conventions for the Express + TypeScript backend in `server/`.

## Request Architecture

Application request handling must follow this dependency direction:

```text
routes -> controller -> services -> repository
```

Validation and middleware run around this flow:

```text
request -> middleware / validator -> route -> controller -> service -> repository -> Prisma
```

Keep dependencies flowing inward. Repositories must not import controllers or routes; services must not depend on Express request or response objects.

## Source Layout

```text
src/
  index.ts                 Express entry point
  routes/                  HTTP route definitions
  controller/              HTTP request and response handling
  services/                Business logic and application workflows
  repository/              Prisma data access
  validators/              Zod schemas and inferred input types
  middleware/              Express middleware, including authentication
  lib/                     Shared integrations such as auth and database setup
  types/                   Shared TypeScript types and application errors
  utils/                   Reusable request and error helpers
```

The route, controller, service, and repository folders are intentionally separated even when a feature is small. Add feature files to the appropriate layer instead of putting logic in `src/index.ts`.

## Layer Responsibilities

### Routes

- Define HTTP methods, paths, route parameters, and middleware composition.
- Use validators for request params, query strings, and bodies.
- Call controllers and contain no business rules or Prisma queries.

### Controllers

- Read validated request data and authenticated session data from Express.
- Call service methods and translate results into HTTP responses.
- Handle HTTP concerns only; do not contain business rules or direct database access.

### Services

- Implement business rules and application workflows.
- Coordinate repositories and other domain operations.
- Accept plain typed data rather than Express request or response objects.

### Repositories

- Own persistence operations and Prisma queries.
- Return data or propagate persistence errors to services.
- Do not implement HTTP behavior, authentication, or response formatting.

## Validation

- Use Zod schemas from `src/validators/` for all external input.
- Keep reusable parameter schemas in the relevant validator module.
- Export inferred TypeScript types with `z.infer` when a service or controller needs the validated shape.
- Current validator modules cover workspaces, sources, chat, memory, and artifacts.
- Keep validation messages user-readable and reject empty or whitespace-only values.

## Authentication and HTTP

- `src/index.ts` loads environment variables, configures CORS, mounts Better Auth at `/api/auth/*`, and starts the server.
- `GET /health` is public and returns the service health status.
- Better Auth routes remain public.
- All other `/api` routes are protected by `requireAuth`.
- `requireAuth` obtains the Better Auth session and stores it in `res.locals.session`; unauthenticated requests receive HTTP 401.
- Use the existing auth and middleware helpers rather than duplicating session checks.
- Keep `CLIENT_URL`, `PORT`, `BETTER_AUTH_URL`, and auth secrets configurable through environment variables.

## Database and Prisma

- PostgreSQL is accessed through the Prisma PostgreSQL adapter in `src/lib/db.ts`.
- Use the generated Prisma client for database access; do not edit files under `generated/prisma` manually.
- Update `prisma/schema.prisma` first when changing the data model, then create and apply a migration.
- The `Workspace` model belongs to one `User`; a user can have many workspaces.
- New workspaces default to the `gpt-4o-mini` model.
- Preserve existing timestamp, relation, index, and cascade-delete conventions.

## Error Handling and Utilities

- Reuse the shared application error type in `src/types/app-error.ts`.
- Reuse `src/utils/async-handler.ts` for async Express handlers when appropriate.
- Reuse `src/utils/zod-error.ts` for consistent validation error formatting.
- Keep error handling centralized in middleware and avoid leaking database or secret details in responses.

## Implementation Workflow

When adding a backend feature:

1. Add or update the Prisma schema and migration if persistence changes.
2. Add or update Zod validators for external input.
3. Implement repository methods.
4. Implement service workflows.
5. Implement controllers.
6. Add routes and authentication middleware.
7. Register routes from the application entry point.
8. Regenerate Prisma when the schema changes and run the relevant TypeScript checks.

Use TypeScript source files, preserve the existing ESM import style, and keep imports consistent with the project configuration.