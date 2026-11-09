# Maintaining actions

Use Node.js 24 or later for the packages below. Keep implementation and test
instructions in this guide; action descriptions and generated readmes describe
how to use the actions.

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

CI checks distribution consistency before tests and exercises the action on a
host and in a container. Distribution tests copy only `dist/` to a temporary
directory and compare its outputs with source across supported formats. CodeQL
scans maintained source and excludes the generated copy; dependency review checks
the lockfile. Repository package commands also skip distribution metadata.

To add a report format:

1. Extend `BaseParser` with `canParse()`, `parse()`, `getCategory()` and
   `getAutoPatterns()`. Override `getPriority()` when format detection needs to run
   before a more general parser.
2. Register the parser in `ParserFactory`.
3. Add parsing and source/distribution parity tests, then rebuild the distribution.
4. Update the [formats and examples guide](../usage/parse-ci-reports.md).

See [ADR 0001](../adr/0001-bundle-ci-report-parser.md) for the bundle decision and
dated validation evidence.

## Distribution automation

The dependency-free composite action in `actions/action-distributions` owns the
build and publication logic. Its source and tests use Node.js built-ins; no npm
installation is needed to run its tests:

```bash
npm test --prefix actions/action-distributions
```

Tests cover bot identities, custom inputs, grouped updates, artifact validation,
stale heads, atomic commits and same-App loop prevention. Keep tests beside the
action and maintain the security contract recorded in
[ADR 0002](../adr/0002-audit-action-dependency-distributions.md).

Allowed dependency updates regenerate bundles in the same PR through the shared
distribution workflow. Human source changes must include their rebuilt bundles.

## Generated documentation

Edit each action's `action.yml` description and input/output metadata, or a
reusable workflow's leading documentation comments. The existing documentation
generation workflow updates their readmes through CI Dokumentor. Do not edit those
generated files by hand.
