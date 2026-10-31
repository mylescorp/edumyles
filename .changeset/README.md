# Changesets

Add one Changeset Markdown file for each user-visible feature, fix, or improvement. The release workflow
turns every Changeset into its own What's new card when its version is published.

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

Merging Changesets to `main` prepares a versioned release pull request and a release manifest. The
manifest is published to the What&apos;s new timeline only when the corresponding semantic version is
published. Preview builds and pending Changesets never appear as published releases.
