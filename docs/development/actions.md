# Maintaining actions

Use Node.js 24 or later for the packages below. Keep implementation and test
instructions in this guide; action descriptions and generated readmes describe
how to use the actions.

## Action package structure

JavaScript actions own their `package.json`, lockfile and ES modules under `src/`.
Keep `*.test.js` beside the code they cover. Use `npm test` for Node's test runner,
`npm run test:watch` during development and `npm run test:ci` for test output plus
`coverage/lcov.info` and `coverage/junit.xml`. The CI command creates the coverage directory on a clean
checkout; coverage output is not committed.

Follow `parse-ci-reports` for each JavaScript action: call the Node.js
`continuous-integration` workflow with the action's working directory and explicit
job permissions. Disable its build and lint jobs; keep CodeQL with the repository
config, dependency review and GitHub coverage enabled. Set `test.comment` to false
and `test.report-group` to the calling job ID in `__shared-ci.yml`. Source tests
run through the package-owned `test:ci` script. One `ci-reports` job collects the
native reports after all source-test jobs, including failures, and updates one
coverage comment with separate figures for each action. It also combines test
results and lint summaries; individual producer comments stay disabled.
Each action's integration workflow exercises its public entrypoint. Actions with
runtime dependencies bundle them with their licenses; dependency-free helpers
load their own source without adding a build step.

## Updating npm dependencies

From an interactive terminal at the repository root, run:

```bash
make npm-update
```

The target uses [npm-check-updates](https://github.com/raineorshine/npm-check-updates)
to select dependency upgrades for each package under `actions/`, excluding
`node_modules/` and `dist/`. It downloads the tool through npm when needed, without
adding it to the action dependencies. Accept the install prompt after selecting
upgrades to update installed dependencies and `package-lock.json`. Review the
changes, run `make test`, and rebuild affected distributions as described below.

## CI report parser

The parser lives in `actions/quality/parse-ci-reports`. Its `src/models/` define
report data, `src/parsers/` handle report formats, and `src/formatters/` produce
summaries and Markdown. `ReportPathResolver.js` resolves paths and auto-detection;
`ReportParserCore.js` coordinates parsing; `src/index.js` is the action entrypoint.

From the repository root, install the locked dependencies and run the tests and
distribution check:

```bash
cd actions/quality/parse-ci-reports
npm ci --ignore-scripts
npm test
npm run check:dist
```

After changing source or dependencies, run `npm run build` and commit the complete
`dist/` directory, including third-party licenses. Do not edit generated files.
`npm run check:dist` rebuilds and fails if output differs from Git, including added
or removed files. Run it again after committing the rebuilt distribution.

The shared distribution workflow discovers packages declaring `build` and
`check:dist`, then checks them on a host and in a container. Its shared test action
copies only `dist/` to a temporary directory and runs the package-owned
`test:distribution` script with `ACTION_ENTRYPOINT` pointing at the isolated bundle.
The parser uses one public-entrypoint suite in `src/index.test.js` for both runs.
Local `npm test` exercises source; the shared action runs the same assertions
against the isolated bundle through `test:distribution`. CodeQL
scans maintained source and excludes the generated copy; dependency review checks
the lockfile. Repository package commands also skip distribution metadata.

To add a report format:

1. Extend `BaseParser` with `canParse()`, `parse()`, `getCategory()` and
   `getAutoPatterns()`. Override `getPriority()` when format detection needs to
   run before a more general parser.
2. Register the parser in `ParserFactory`.
3. Add parsing tests and a public-entrypoint fixture, then rebuild the distribution.
4. Update the action's `action.yml` description or leading documentation comments
   and regenerate its
   [usage documentation](../../actions/quality/parse-ci-reports/README.md#supported-formats).

See [ADR 0001](../adr/0001-bundle-ci-report-parser.md) for the bundle decision and
dated validation evidence.

## Distribution automation

The composite action in `actions/action-distributions` owns discovery, build and
publication logic. It bundles its YAML parser to read trusted workflow definitions
without runtime installation. Install its locked dependencies before testing:

```bash
npm ci --ignore-scripts --prefix actions/action-distributions
npm test --prefix actions/action-distributions
npm run check:dist --prefix actions/action-distributions
```

Tests cover bot identities, custom inputs, grouped updates, artifact validation,
stale heads, atomic commits, package discovery, trusted workflow resolution and
same-App loop prevention. The shared distribution matrix also runs the publication
contracts against an isolated bundle on the host and in a container. Rebuild and
commit `dist/` after source or dependency changes. Keep tests beside the
action and maintain the security contract recorded in
[ADR 0002](../adr/0002-audit-action-dependency-distributions.md).

Run `npm test --prefix actions/quality/test-action-distribution` to validate
isolated execution, missing runtime dependencies, failure propagation and cleanup.

Allowed dependency updates regenerate bundles in the same PR through the shared
distribution workflow. Human source changes must include their rebuilt bundles.

The rebuild workflow uses `ci-github-nodejs/actions/setup-node` for tooling and
`get-package-manager` for locked installation and script commands. It configures
the first affected package, then installs and builds each affected directory
with those commands. Selected packages must use the same package manager. The
explicit `node-version` is applied after shared setup so package version files
do not override the requested build runtime.

For a pnpm workspace, select `working-directories: .`
and the workspace's bundling script with `build-script`. Commit the root
`packageManager` pin and `pnpm-lock.yaml`. Installation uses the frozen lockfile;
`ignore-scripts: false` permits lifecycle hooks subject to pnpm's build approvals.
Set `output-directory: actions/**/dist` for bundles below `actions/`, or use
newline-separated literal directories and patterns (`*`, `**`, `?`). Patterns are
relative to each selected package. Both jobs resolve them against committed
directories in the trusted PR base revision; PR-created paths cannot expand the
writer's scope. New directories become eligible after merging to the default branch.
Hidden and `node_modules` directories are excluded. Every pattern must match a
directory; duplicate or overlapping resolved paths fail. The writer requires
`required-files` in every resolved directory. Keep both event callers' patterns
and size limits equal.

The default serialized artifact limit is 20 MiB. `max-artifact-size` can raise it
to 128 MiB for workspaces, with at most 1,000 files and 50 MiB per file. Large
changes upload blobs separately, preserve the parent tree and create one commit.
The final ref update compares the expected head and never forces or retries a
conflict. Unlike small changes, this Git Data API path does not automatically
sign commits; check repository signing rules before enabling it. The trusted
writer still never installs dependencies or executes repository code.

The npm-oriented `test-action-distributions` workflow requires one package-owned
bundle and a `test:distribution` contract. Workspace consumers of the rebuild
workflow retain their own `check:dist` and action integration checks.

## Generated documentation

Edit each action's `action.yml` description, leading documentation comments and
input/output metadata, or a reusable workflow's leading documentation comments.
Put examples containing workflow expressions in leading comments so GitHub does
not evaluate them as action metadata. The existing documentation generation
workflow updates readmes through CI Dokumentor. Do not edit generated files by hand.
