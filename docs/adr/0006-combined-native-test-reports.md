# ADR 0006: Prefer complete combined native test reports

- Status: accepted
- Date: 2026-11-28
- Extends: [ADR 0005](0005-ci-reporting-contract.md)

## Decision

Use a single native file for test results and coverage when the producer retains
both complete test outcomes and publishable source measurements. Accept the same
path in the existing test and coverage selectors. Validate each requirement,
retain the file once, and count each test only from its test interpretation.
Coverage is required only on the selected runtime; missing requested coverage
fails validation while available test diagnostics remain retained.

Support the native JSON shared by Vitest and Jest, with their `testResults` and
Istanbul `coverageMap`. Preserve failures, skipped tests, durations, suite setup
errors, source mappings, zero-hit lines and branch measurements. Reparse the
original bytes during collection; do not trust embedded normalized findings.
Use Istanbul's maintained coverage library and writers instead of a custom
coverage converter. Generate LCOV or Cobertura only for the selected publisher.

Node.js producers default to `results.json` for both roles. Other native runners
retain their supported pairs. Do not install another runner or write a custom
reporter solely to force one physical file.

## Verified format boundaries

| Producer | Retained outputs | Reason |
| --- | --- | --- |
| Vitest ordinary runs | Combined JSON | Includes assertion results and final Istanbul coverage. |
| Jest | Combined JSON | Includes assertion results and the aggregate coverage map. |
| Vitest shard merge | JSON and LCOV | The merge lifecycle ends test reporting before merging coverage. |
| node:test | JUnit and LCOV | Its built-in machine-readable reporters separate outcomes and source coverage. |
| pytest / coverage.py | JUnit and coverage XML | The runner and coverage tool emit separate native reports. |
| Go / gotestsum | JUnit and coverage profile | Test events do not contain the source block coverage profile. |
| PHPUnit / Pest | JUnit and Cobertura | Coverage exports do not provide complete assertion outcomes. |
| Goss / container tests | Native test results | These checks do not promise source code coverage. |
| OpenClover | Separate test results required | XML loses skipped outcomes and individual parameterized executions. |

### OpenClover experiment

OpenClover 5.1.1, Maven 3.9 with Temurin 21, JUnit 4.13.2 and Surefire 3.5.4
were executed against a small Java fixture on 2026-11-28. The command was
`mvn -B -ntp -Dmaven.test.failure.ignore=true clover:setup test clover:clover`.
The failure-ignore flag allowed this deliberately failing experiment to generate
both reports; it is not part of a CI producer configuration.

The fixture contains ordinary passing, failing and ignored methods, plus two
parameterized invocations of one method (one passes and one fails).

| Case | Surefire JUnit | OpenClover XML |
| --- | --- | --- |
| `passes` | Passed | `testsuccess=true` |
| `fails` | Failed, with assertion details | `testsuccess=false` |
| `skipped` | Skipped, with reason | No test outcome |
| `answers[enabled=true]` | Passed | Combined into `answers()` |
| `answers[enabled=false]` | Failed, with assertion details | Combined into `answers()` with `testsuccess=false` |

JUnit retained five cases; Clover emitted three method outcomes. The Clover
writer records success and duration but no failure details. Its `testproject`
also contains test-source coverage, which must not be mistaken for executed
test outcomes. Therefore combined OpenClover XML is not a valid replacement for
our detailed test-result contract. Other tools' Clover exporters may emit only
coverage, so the format name cannot establish completeness either.

The container used was
`maven@sha256:99e61abcff91a9b1333463bd8451fb18495d6eba9250ac66a338b518f8278320`.
The first build and report generation took 11.39 seconds, excluding image pull.

### Vitest shard experiment

The existing real shard test exercises inventory, missing-shard rejection,
coverage source lines, threshold failures and failed-test retention. A direct
JSON run contains coverage. After `--merge-reports`, JSON has complete tests but
no `coverageMap`; the native coverage reporter still emits the correct merged
measurement. Keep both outputs on this path and use `CI_TEST_MERGE` to enable
the final LCOV reporter. Do not invent a combined report or silently accept
missing coverage. The released 5.1.1 source retains this ordering.

## Validation strategy

Extend existing recording and collection tests for shared physical files and
duplicate-result rejection. Cover malformed or missing maps separately from
valid test results, and verify publisher exports against native line and branch
measurements. Reuse the real Jest fixture, Vitest shard fixture, single-project
landing-page and multi-project CI Dokumentor consumers for tool integration.

## Sources

- [Vitest JSON reporter](https://vitest.dev/guide/reporters#json-reporter)
- [Vitest 5.1.1 merge lifecycle](https://github.com/vitest-dev/vitest/blob/v5.1.1/packages/vitest/src/node/core.ts#L708-L755)
- [Jest coverage aggregation](https://github.com/jestjs/jest/blob/main/packages/jest-reporters/src/CoverageReporter.ts)
- [OpenClover 5.1.1 XML writer](https://github.com/openclover/clover/blob/openclover-5.1.1/clover-core/src/main/java/org/openclover/core/reporters/xml/XMLReporter.java)
- [OpenClover XML schema](https://github.com/openclover/clover/blob/openclover-5.1.1/clover-core/src/main/resources/clover.xsd)
- [Node.js built-in reporters](https://nodejs.org/api/test.html#test-reporters)
