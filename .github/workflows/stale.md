# Workflow - Stale

Workflow to mark issues and pull requests as stale when needed.

- First add labels to issues and pull requests to mark them as stale.
- Then add a comment to the issue or pull request to explain why it is marked as stale.
- Finally, close the issue or pull request if it is still stale after a given period of time.

## Usage

### As required workflow

Configure workflow to be required in your organization settings.

- Go to your organization actions settings to add a new required workflow: Settings > Actions > General > Required workflows > Add workflow
  `https://github.com/organizations/[your-organization]/settings/actions/required_workflows/new` (replace `[your-organization]` with your organization name)
- Select the repository `ci-github-common`
- Select the workflow file: `.github/workflows/stale.yml`
- Add workflow
