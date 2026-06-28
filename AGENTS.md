# Agents: Realtime Chat Support

## Monorepo

- Turborepo v2 + pnpm workspaces.
- `turbo.json` at root defines `build` (`dependsOn: ["^build"]`), `test` (`dependsOn: ["^build"]`), `typecheck` (`dependsOn: ["^build"]`).
- Root scripts delegate to turbo (`"build": "turbo build"`). `lint`/`fmt` run at root only (oxlint/oxfmt).
- No cache outputs configured — task orchestration only.
- Workspaces: `apps/frontend`, `apps/backend`, `packages/shared`, `packages/database`.

## Package naming

- Internal packages: `@repo/shared`, `@repo/database`.
- Apps: no scope (just `frontend`, `backend` in their `package.json`).

## Database

- `packages/database/` is NestJS-agnostic. Schema + client factory + `drizzle-kit generate` SQL migrations live here.
- `apps/backend/src/database/database.module.ts` is a thin NestJS wrapper importing `createClient` from `@repo/database`.
- Migrations: SQL files in `packages/database/src/migrations/`.
- Build tool for packages: `tsdown`.

## Build graph

```
@repo/shared ──► frontend
@repo/database ──► backend
@repo/shared ──► backend
```

## CI

- Parallel jobs: lint, `turbo typecheck`, `turbo test`, `turbo build` + `pnpm audit --prod`.

## Reference

| Tool            | Docs                         |
| --------------- | ---------------------------- |
| Turborepo       | https://turborepo.dev/docs   |
| pnpm            | https://pnpm.io/workspaces   |
| tsdown          | https://tsdown.dev           |
| Drizzle ORM     | https://orm.drizzle.team     |
| NestJS          | https://docs.nestjs.com      |
| Oxlint / Oxfmt  | https://oxc.rs               |
| Vitest          | https://vitest.dev           |
| better-auth     | https://better-auth.com/docs |
| Vite            | https://vite.dev             |
| TanStack Router | https://tanstack.com/router  |
| shadcn/ui       | https://ui.shadcn.com        |
| Socket.io       | https://socket.io/docs       |
