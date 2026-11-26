# ADR 0004: Publish complete coverage collections to GitHub Code Quality

- Status: proposed
- Date: 2026-11-26

## Context

Language test actions retain coverage reports and the common CI reports workflow
renders summaries and comments. GitHub Code Quality accepts Cobertura XML with a
language and label per upload, compares line coverage against the default branch,
and offers coverage rulesets. Independent actions and monorepo projects produce
multiple reports. Shards and runtime matrices can produce duplicate or partial
coverage for the same source.

GitHub requires PR head coverage, whereas existing CI normally tests the PR merge
commit. Its uploader skips fork PRs and merge queues. Coverage rules do not wait
for expected uploads and a zero threshold disables that rule. These constraints
come from the upstream documentation checked on this date; they are not evidence
that publication has been exercised on every consumer.

## Decision

Keep existing coverage destinations unchanged and add explicit native publication.
Language actions produce Cobertura artifacts through the common coverage-reports
action. The action normalizes source paths and records stable labels, language,
producer job, actual tested commit, repository, run, attempt and file checksums.
Container consumers without Git metadata explicitly provide the image's source
commit and repository-relative project prefix. A claimed SHA cannot override an
available checkout's actual revision.

CI reports accepts an explicit inventory of expected component labels and producer
jobs. Collection rejects missing, extra, duplicate, stale or modified results and
overlapping source files. It requires successful producers; failed test reports
remain diagnostic artifacts and summaries. Partial reruns require all producers
to rerun. Native framework mergers own shard and overlapping-suite aggregation.
Only one designated runtime version publishes coverage. Percentages are never
averaged and different components remain separate uploads.

Use the official upload-code-coverage action, pinned by release commit. A small
publish-coverage reusable workflow consumes the validated collection, verifies
each report and waits for successful processing. This separate permission boundary
is necessary: adding code-quality write permission to ci-reports would require
existing callers to grant it even when native publication is disabled. Reporting
keeps its existing permissions. Publication downloads only data and executes no
project scripts. The caller must require producer, collection and publication
completion checks, alongside any coverage rules.

Native mode in language workflows explicitly checks out the PR head for matching
builds and reports. Existing destinations retain their checkout behavior. Callers
that require tested merge-result validation retain a separate merge validation
invocation; head coverage does not establish merge-result compatibility. Prebuilt
containers must be built from the same source revision.

Keep summaries and test/lint comments when native coverage is selected, and let
GitHub own its coverage comment. Keep branch, function and statement thresholds
in the project test framework because GitHub evaluates line coverage only.

## Consequences and rollout

No repository setting, subscription, AI feature or ruleset is enabled by these
actions. Confirm Code Quality eligibility and enable it explicitly before using
the publication workflow. Public repositories have no per-committer charge, but
the documented plans are Team and Enterprise Cloud. The organization API reported
Free and the Node.js/Python setup APIs reported not-configured during research.

Pilot a Python consumer and a Node.js consumer, checking source paths, multiple
components, default-branch baselines, missing reports and fork behavior before
enabling coverage gates. Go converts native profiles to Cobertura; PHP and Python
generate it directly. Node.js projects select a Cobertura reporter in their own
test tooling. This integration does not install a different test framework.

## References

- [Coverage setup](https://docs.github.com/en/code-security/how-tos/maintain-quality-code/set-up-code-coverage)
- [Multiple reports and publication jobs](https://github.com/actions/upload-code-coverage/blob/main/docs/workflow-strategies.md)
- [Coverage rules](https://docs.github.com/en/code-security/how-tos/maintain-quality-code/restrict-code-coverage)
- [Reusable workflow permissions](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations)
