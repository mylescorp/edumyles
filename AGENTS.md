# AGENTS.md

Instructions for AI coding agents working with this codebase.

## Purpose

EduMyles product codebase, including backend, frontend, landing, mobile, shared code, tests, scripts, and documentation.

## Ownership

- Product owner: Myles.

## Local Contracts

- Use the vault, product notes, Git state, and handoff notes as the default operating record.
- Do not add placeholder UI, mock data, fake users, hardcoded secrets, or raw user-facing system errors.
- Panel naming must use `platform`, `admin`, and `dashboard` where panel concepts apply.

## Work Guidance

- Read the nearest child `AGENTS.md` before editing a folder.
- Build backend contracts before UI that depends on them.

## Verification

- Run the relevant typecheck, lint, test, and browser verification gates for code changes.
- Read changed `AGENTS.md` files back after DOX updates.

<!-- opensrc:start -->

## Source Code Reference

Source code for dependencies is available in `opensrc/` for deeper understanding of implementation details.

See `opensrc/sources.json` for the list of available packages and their versions.

Use this source code when you need to understand how a package works internally, not just its types/interface.

### Fetching Additional Source Code

To fetch source code for a package or repository you need to understand, run:

```bash
npx opensrc <package>           # npm package (e.g., npx opensrc zod)
npx opensrc pypi:<package>      # Python package (e.g., npx opensrc pypi:requests)
npx opensrc crates:<package>    # Rust crate (e.g., npx opensrc crates:serde)
npx opensrc <owner>/<repo>      # GitHub repo (e.g., npx opensrc vercel/ai)
```

<!-- opensrc:end -->

# DOX Framework

- DOX is a self-documenting `AGENTS.md` hierarchy installed here.
- Agents must follow DOX instructions across any edits.

## Core Contract

- `AGENTS.md` files are binding work contracts for their subtrees.
- Source files, tests, scripts, docs, and generated artifacts must stay understandable from the nearest applicable `AGENTS.md` plus every parent `AGENTS.md` above it.

## Read Before Editing

1. Read this root `AGENTS.md`.
2. Identify every file or folder you expect to touch.
3. Walk from the repository root to each target path.
4. Read every `AGENTS.md` found along each route.
5. Use the nearest `AGENTS.md` as the local contract and parent docs for repo-wide rules.
6. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX.

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done. Update the closest owning `AGENTS.md` when a change affects purpose, scope, ownership, responsibilities, durable structure, contracts, workflows, or child index contents.

## Hierarchy

- Root `AGENTS.md` owns repository-wide instructions and the top-level Child DOX Index.
- Child `AGENTS.md` files own domain-specific instructions and their own Child DOX Index.

## Child Doc Shape

Default section order:
- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

## Style

- Keep docs concise, current, and operational.
- Document stable contracts, not diary entries.
- Put broad rules in parent docs and concrete details in child docs.

## Closeout

1. Re-check changed paths against the DOX chain.
2. Update nearest owning docs and any affected parents or children.
3. Refresh every affected Child DOX Index.
4. Remove stale or contradictory text.
5. Run existing verification when relevant.

## Child DOX Index

- [convex/AGENTS.md](convex/AGENTS.md): Convex schema, functions, modules, actions, crons, and backend contracts.
- [docs/AGENTS.md](docs/AGENTS.md): project documentation and implementation references.
- [e2e/AGENTS.md](e2e/AGENTS.md): end-to-end tests and browser verification flows.
- [frontend/AGENTS.md](frontend/AGENTS.md): legacy frontend application surface.
- [landing/AGENTS.md](landing/AGENTS.md): public landing and marketing surface.
- [mobile/AGENTS.md](mobile/AGENTS.md): mobile app surface.
- [scripts/AGENTS.md](scripts/AGENTS.md): local automation and maintenance scripts.
- [shared/AGENTS.md](shared/AGENTS.md): shared utilities and cross-surface code.
