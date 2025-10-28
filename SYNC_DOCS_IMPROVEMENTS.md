# Sync Documentation Workflow - Implementation Guide

This guide provides instructions for implementing the sync-docs workflow in a repository, based on learnings from integrating it into ci-github-common.

## Quick Implementation

Add the following job to your main CI workflow (e.g., `__main-ci.yml`):

```yaml
sync-docs:
  needs: ci # or your primary CI job name
  if: github.event_name != 'schedule'
  uses: hoverkraft-tech/public-docs/.github/workflows/sync-docs-dispatcher.yml@18facec04f2945f4d66d510e8a06568497b73c54 # 0.1.0
  with:
    paths: |
      actions/**/README.md
      .github/workflows/*.md
      README.md
  secrets:
    github-token: ${{ secrets.PUBLIC_DOCS_TOKEN }}
```

## Key Points for Implementation

1. **Workflow Type**: This is a reusable workflow, not an action. Use `uses:` at the job level.

2. **Version Pinning**: Always pin to a specific commit SHA with version tag comment for security.

3. **Paths Configuration**: Be specific with glob patterns:
   - Use `actions/**/README.md` instead of `actions/`
   - Use `.github/workflows/*.md` instead of `.github/workflows/`
   - Only sync Markdown documentation files

4. **Secret Required**: `PUBLIC_DOCS_TOKEN` must be configured in repository secrets with `repo` scope and `repository_dispatch` write access to public-docs.

5. **Integration Pattern**: Add as a job in main CI workflow after primary CI job completes, skip on scheduled runs.

## YAML Formatting Tips

For long workflow references that may fail yamllint:

- Line was too long, so removed YAML folding (`>-`) and used single line
- Comment version tag at end of line for clarity

## Upstream Documentation Improvements Needed

The [sync-docs-dispatcher.md](https://github.com/hoverkraft-tech/public-docs/blob/main/.github/workflows/sync-docs-dispatcher.md) should include:

1. **Workflow vs Action**: Clarify this is a reusable workflow (job-level `uses:`), not an action (step-level)
2. **Complete Example**: Show full workflow file with triggers and permissions, not just the job
3. **Token Setup**: Detail required scopes, how to obtain/configure `PUBLIC_DOCS_TOKEN`
4. **Path Patterns**: Recommend using specific glob patterns for Markdown files only
5. **Version Pinning**: Explain commit SHA pinning strategy and how to update
6. **YAML Linting**: Show proper line formatting for repositories with strict yamllint rules
7. **Troubleshooting**: Add verification steps and links to check sync status in both repos
