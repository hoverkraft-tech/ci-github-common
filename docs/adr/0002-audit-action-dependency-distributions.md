# ADR 0002: Distribute action-owned dependencies before execution

- Status: Proposed
- Date: 2026-11-08
- Related: [CI optimization issue](https://github.com/cloud-native-aixmarseille/pleey/issues/475)

## Context

[ADR 0001](0001-bundle-ci-report-parser.md) removes installation of the report
parser's own dependencies. The same recurring cost can occur in other actions.
The audit covers all six `hoverkraft-tech/ci-github-*` repositories returned by
the organization catalog, including nested composite actions and their scripts.

| Repository          | Revision       | Actions | Own Node.js installations |
| ------------------- | -------------- | ------: | ------------------------: |
| ci-github-common    | `979e86fa119f` |      14 |                         2 |
| ci-github-container | `dc707d83a7cc` |      17 |                         2 |
| ci-github-iac       | `1158c1f23be1` |       5 |                         0 |
| ci-github-nodejs    | `0340fba99303` |      16 |                         0 |
| ci-github-php       | `41b42b7c00ad` |       4 |                         0 |
| ci-github-publish   | `704e6c786af0` |      25 |                         4 |

This is 81 action manifests and eight internal dependency installations.
Node.js and PHP project installation, package-manager bootstrap, and IaC tools
such as Ansible are execution requirements, not internal JavaScript helpers.
Dependency-free helpers gain nothing from adding a bundler.

## Decision

Apply the distribution contract from ADR 0001 to eligible helpers: a locked
build, committed output and license notices, reproducibility checks, source
coverage, and isolated distribution tests. Preserve each action's existing
inputs, outputs, side effects and error handling. The report parser's explicit
missing-report policy is specific to that action.

A successful compiler exit is insufficient. Dynamic configuration, plugins,
provider loading and native binaries must work without development dependencies
before their runtime installation can be removed. Keep related common changes
in PR #643; submit implementation in each other owning repository for its CI.

| Action                                  | Outcome                                                                             |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| common: quality/parse-ci-reports        | Bundled in [PR #643](https://github.com/hoverkraft-tech/ci-github-common/pull/643). |
| publish: release/get-configuration      | Implement a distribution and preserve configuration scope.                          |
| publish: release/prepare                | Implement a distribution and preserve preview/draft behavior.                       |
| container: helm/release-chart           | Bundle the YAML lockfile helper; retain Helm execution.                             |
| common: quality/lint-pull-request-title | Retain installation until dynamic configuration loading is packaged and tested.     |
| publish: release/summarize-changelog    | Retain installation until all supported provider loaders are bundled.               |
| publish: deploy/jampack                 | Retain platform-aware installation for native dependencies.                         |
| container: helm/generate-docs           | Retain the configurable documentation toolchain pending plugin distribution.        |

## Compatibility evidence

Probes on 2026-11-08 used the audited lockfiles and ncc 0.45.0. Build output was
copied outside the repositories, with no adjacent `node_modules`.

- Commitlint compiled but failed on import with `Cannot find module
'./commitlint.schema.json'`. Its conventional preset, custom presets, plugins
  and TypeScript configuration loading also need explicit compatibility coverage.
- The summarizer compiled, but invoking its real default LLM service failed with
  `Cannot find module '@langchain/openai'`. LangChain resolves `config.package`
  dynamically; its provider imports are absent from the generated distribution.
- Textlint compiled, but the action's default comments/terminology/Markdown
  configuration reported "No rules found". Bundling only its CLI omits the
  plugins and rules selected by configuration. Prettier and markdownlint's
  consumer-selected plugins and configuration need equivalent checks.
- Jampack's lockfile includes platform-selected esbuild and Sharp packages.
  A distribution built on one host does not establish support for another OS,
  CPU architecture or libc. No portable native bundle is claimed.

## Follow-up acceptance criteria

- [ ] Commitlint: package schema and the default preset, then verify JSON, CJS,
      ESM and TypeScript configuration, relative and installed presets, plugins,
      ignores, invalid configuration and missing dependencies without action-time npm.
- [ ] Summarizer: package all three supported providers while preserving model
      selection, configuration overrides, response parsing and retry behavior. Verify
      OpenAI, Anthropic and Google through local provider stubs with no credentials.
- [ ] Documentation: distribute default plugins and preserve caller configuration,
      rule and plugin discovery, fix behavior and generated-file results. Compare a
      bundle against a versioned tool image before changing runner requirements.
- [ ] Jampack: evaluate a versioned tool image or per-platform artifacts; declare
      supported OS/architecture/libc combinations, verify native binary provenance,
      and measure image/artifact transfer against installation and cache costs.

These are unfinished implementations, not exemptions from future optimization.
Do not remove working runtime setup until the relevant acceptance criteria pass.

## Consequences

Repository downloads grow with committed distributions. Measure bundle size and
local setup/startup separately; this audit does not establish end-to-end CI gains.
Dependency updates must rebuild output. Keep security analysis on maintained
sources and dependency review on lockfiles; generated exclusions must be scoped.

## References

- [ncc asset relocation caveat](https://github.com/vercel/ncc#caveats)
- [Release distributions decision](https://github.com/hoverkraft-tech/ci-github-publish/blob/perf/bundle-action-dependencies/docs/adr/0002-bundle-action-dependencies.md)
- [Chart distribution decision](https://github.com/hoverkraft-tech/ci-github-container/blob/perf/bundle-chart-release-dependencies/docs/adr/0002-bundle-chart-release-dependencies.md)
