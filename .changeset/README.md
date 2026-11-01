# Changesets

Add one Changeset Markdown file for each user-visible feature, fix, or improvement. Every pull request
merged to `main` creates and publishes its own semantic version. Each Changeset in that pull request
becomes its own What's new card in that release.

Use the `edumyles` package with a semantic version bump:

```md
---
edumyles: patch
type: improvement
panels: admin, platform
---

Short user-facing title

Describe the user benefit in one or two concise sentences.
```

Use `minor` for a backward-compatible feature, `patch` for a fix or improvement, and `major` for a
breaking change. `type` must be `feature`, `improvement`, `fix`, or `breaking`; `panels` must list
the affected panels (`admin`, `teacher`, `student`, `parent`, `alumni`, `partner`, `developer`,
`affiliate`, `reseller`, or `platform`). Separate unrelated changes into separate files. Do not edit
release manifests by hand for an ordinary feature pull request.

The largest bump in a merged pull request's Changesets determines that release's version increment.
Each direct commit to `main` also creates one patch, minor, or major release; when it has no Changeset,
the release uses a concise card inferred from the commit subject and changed panel paths. Multiple
direct commits pushed together still receive separate versions. Preview builds and unmerged Changesets
never appear as published releases.
