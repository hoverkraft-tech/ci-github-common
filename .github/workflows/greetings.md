# Workflow - Greetings

Workflow to greet new contributors.

- On issue creation, a comment is added to the issue.
- On first contribution, a comment is added to the pull request.

## Usage

### As required workflow

Configure workflow to be required in your organization settings.

- Go to your organization actions settings to add a new required workflow: Settings > Actions > General > Required workflows > Add workflow
  `https://github.com/organizations/[your-organization]/settings/actions/required_workflows/new` (replace `[your-organization]` with your organization name)
- Select the repository `ci-github-common`
- Select the workflow file: `.github/workflows/greetings.yml`
- Add workflow
