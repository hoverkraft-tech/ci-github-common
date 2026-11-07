<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItY2hlY2stY2lyY2xlIiBjb2xvcj0iYmx1ZSI+PHBhdGggZD0iTTIyIDExLjA4VjEyYTEwIDEwIDAgMSAxLTUuOTMtOS4xNCI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjIyIDQgMTIgMTQuMDEgOSAxMS4wMSI+PC9wb2x5bGluZT48L3N2Zz4=) GitHub Action: Lint pull request title

<!-- header:end -->
<!-- overview:start -->

## Overview

Validate the event's pull request title using the checked-out repository's commitlint config.
Fall back to `@commitlint/config-conventional` when no rules are configured.
The same repository rules apply to people and bots; warnings produce annotations.
Requires a pull request event and a repository checkout.
Dependencies are installed from the action's lockfile with lifecycle scripts disabled.

See the [common commit process](../../../docs/usage/commits.md).

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/quality/lint-pull-request-title@deba829171da15c448db4affbd2ece840a0de809 # feat/shared-commit-policy
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

| **Input** | **Description** | **Required** | **Default** |
| --------- | --------------- | ------------ | ----------- |

<!-- inputs:end -->
<!-- secrets:start -->
<!-- secrets:end -->
<!-- outputs:start -->
<!-- outputs:end -->
