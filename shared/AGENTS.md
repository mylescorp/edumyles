# shared

## Purpose

Shared utilities and cross-surface code for EduMyles.

## Ownership

- Product owner: Myles.

## Local Contracts

- Shared changes can affect multiple surfaces and require broader verification.
- Do not place app-specific logic here unless it is truly reused.
- Keep types strict and avoid `any`.

## Work Guidance

- Prefer existing shared patterns over new abstractions.

## Verification

- Run typecheck and test all affected app surfaces.

## Child DOX Index

- No child DOX files yet.
