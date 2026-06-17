# e2e

## Purpose

End-to-end tests and browser verification flows for EduMyles.

## Ownership

- Product owner: Myles.
- Tests protect product routes, auth boundaries, tenant isolation, and user flows.

## Local Contracts

- Tests must use real app routes and real verification paths.
- Do not add fake users, fake credentials, or placeholder data in committed tests.
- Keep browser traces and generated reports out of this folder unless intentionally committed.

## Work Guidance

- Add or update E2E coverage when changing routes, auth, payment, onboarding, or tenant-isolated flows.

## Verification

- Run the relevant Playwright or E2E command before merging route-level changes.

## Child DOX Index

- No child DOX files yet.
