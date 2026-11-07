# Common commit process

Keep commitlint configuration at the repository root. Local commit hooks, the
shared [linter workflow](../../.github/workflows/linter.md), and the
[semantic pull request workflow](../../.github/workflows/semantic-pull-request.md)
read that configuration. Repository rules apply equally to contributors and bots.

Use Conventional Commits for commits and pull request titles:

```text
fix(release): preserve the prepared tag
build(deps): bump a dependency
feat(api)!: require a release tag
```

## Repository configuration

Use commitlint's standard configuration formats, such as `.commitlintrc.json`,
`commitlint.config.cjs`, or the `commitlint` field in the root `package.json`.
Keep one configuration source. Extend a preset and override only the rules that
need different behavior. See the [commitlint configuration reference](https://commitlint.js.org/reference/configuration.html).

For repositories using Dependabot, this configuration keeps conventional types
and required subjects blocking while reporting casing and line lengths as warnings:

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "subject-case": [
      1,
      "never",
      ["sentence-case", "start-case", "pascal-case", "upper-case"]
    ],
    "header-max-length": [1, "always", 100],
    "body-max-line-length": [1, "always", 100],
    "footer-max-line-length": [1, "always", 100]
  }
}
```

These overrides belong to the repository. The image and title workflow do not
change their severity. A repository can choose stricter rules.

The Super-Linter image supplies the conventional preset as a fallback when no
configuration is found. The title action follows commitlint's `--default-config`
behavior: it uses the conventional preset when configuration resolves to no rules.
Invalid configuration and missing presets fail validation.

## Local and CI validation

Call both shared workflows and keep their versions aligned. Grant `contents: read`
to the semantic workflow job so it can check out the repository configuration.
The checkout does not persist credentials. `pull_request` runs use the PR merge
revision; `pull_request_target` runs use the trusted base revision, so configuration
changes in that PR take effect after merging. No secrets are required.

The standalone [lint-pull-request-title action](../../actions/quality/lint-pull-request-title/README.md)
requires a checkout when called directly. It owns its locked dependencies and
installs them with lifecycle scripts disabled. The bundled conventional preset is
available without installing the repository's dependencies. Install any additional
presets or plugins before calling the action. Relative presets resolve from the
repository configuration. Repository rules, parser settings, plugins and ignore
settings are respected. Git-generated messages are not exempt as PR titles unless
the repository explicitly configures that behavior. Warnings appear as GitHub
annotations and do not fail the title check.

Use the same Super-Linter image version in local linting and CI. Run the repository's
`make lint` command before pushing. Set `LOG_LEVEL=INFO` when inspecting commitlint
warnings in Super-Linter, and leave `ENABLE_COMMITLINT_STRICT_MODE` disabled if warnings
should remain nonblocking. Node.js projects with a local `commit-msg` hook need
`@commitlint/cli` and their configured presets installed; let the hook discover the
same root configuration.

Merge settings must preserve a validated conventional message. If squash merging
is enabled, use the validated PR title for the resulting commit. A passing title
check does not validate edits made to the merge message afterward.

## Dependency updates

Configure each Dependabot ecosystem with its supported message options:

```yaml
commit-message:
  prefix: build
  include: scope
```

Dependabot does not read commitlint configuration. Its prefix setting does not
control every formatting detail: subjects may be capitalized and generated titles
or commit-body lines may exceed the preset's length limits. Configure the desired
severity in the repository's commitlint rules. Updating the Dependabot configuration
does not rewrite existing commits.

For Renovate, enable semantic commits and use `build` as `semanticCommitType`.
