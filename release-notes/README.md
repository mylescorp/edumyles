# Product release notes

Add one JSON manifest per product release at `release-notes/<semver>.json` and include it in the release tag. Use semantic versions (`MAJOR.MINOR.PATCH`, with an optional prerelease suffix). Each item in `entries` becomes its own What's new card.

```json
{
  "entries": [
    {
      "title": "Bulk invoice export",
      "description": "Export filtered invoices as a spreadsheet.",
      "type": "feature",
      "panels": ["admin"],
      "module": "finance",
      "tags": ["billing", "export"],
      "links": [{ "label": "Open invoices", "url": "/admin/finance/invoices" }]
    }
  ]
}
```

Allowed categories are `feature`, `improvement`, `fix`, and `breaking`. Panel audience values are `admin`, `teacher`, `student`, `parent`, `alumni`, `partner`, `developer`, `affiliate`, `reseller`, and `platform`. Set multiple panel values when an update applies in multiple places. Workspace targeting is optional and uses tenant IDs. Links must use HTTPS or a relative application path. Releases are published to Convex when the matching GitHub Release is published; repeated delivery of the same tag is safe.

The release workflow requires the GitHub Actions secrets `CONVEX_DEPLOY_KEY` and `WHATS_NEW_RELEASE_SECRET`. Configure the same `WHATS_NEW_RELEASE_SECRET` as a production Convex environment variable. Keep that secret separate from all application session credentials.

## Merged update history

The `Sync What's New repository history` workflow also keeps a separate history of merged pull requests. Use its `workflow_dispatch` action to backfill previously merged pull requests; future merged pull requests are synchronized automatically. Each pull request is shown as a dated update card and categorized from its labels and title. Its affected panel audience is inferred from changed file paths; if the scope cannot be determined, the card is limited to the Platform panel. Contributor names, repository links, and pull request identifiers are not part of the customer-facing feed.

These history cards do not create or imply a semantic version. Versioned Release cards still come only from a release manifest after its matching product version is published. Keep adding one Changeset per user-facing change so future releases have concise, customer-ready notes instead of relying only on the automatic history summary.
