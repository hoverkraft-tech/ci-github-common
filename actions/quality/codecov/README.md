<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItdXBsb2FkLWNsb3VkIiBjb2xvcj0iYmx1ZSI+PHBvbHlsaW5lIHBvaW50cz0iMTYgMTYgMTIgMTIgOCAxNiI+PC9wb2x5bGluZT48bGluZSB4MT0iMTIiIHkxPSIxMiIgeDI9IjEyIiB5Mj0iMjEiPjwvbGluZT48cGF0aCBkPSJNMjAuMzkgMTguMzlBNSA1IDAgMCAwIDE4IDloLTEuMjZBOCA4IDAgMSAwIDMgMTYuMyI+PC9wYXRoPjxwb2x5bGluZSBwb2ludHM9IjE2IDE2IDEyIDEyIDggMTYiPjwvcG9seWxpbmU+PC9zdmc+) GitHub Action: Codecov

<!-- header:end -->
<!-- overview:start -->

## Overview

Action to upload coverage to Codecov.

- **Automatic dependency management**: Automatically detects and installs missing dependencies (Git, cURL, gnupg) using pkgxdev
- **Configuration fixes**: Automatically fixes pkgxdev configuration issues with unexpanded environment variables in gpgconf.ctl and .curlrc files
- **Cleanup**: Uninstalls dependencies after Codecov upload is complete
- **OIDC support**: Uses OIDC authentication with Codecov for secure uploads

Note that this action must have write permission for id-token for this to work:

```yml
permissions:
  id-token: write
```

<!-- overview:end -->
<!-- usage:start -->

## Usage

```yaml
- uses: hoverkraft-tech/ci-github-common/actions/quality/codecov@<commit-sha>
  with:
    # Working directory where coverage files are located.
    # Can be absolute or relative to the repository root.
    #
    # Default: `.`
    working-directory: .

    # Optional comma-separated coverage report files. When supplied, only these files are uploaded and automatic discovery is disabled.
    files: ""

    # Fail the job when Codecov upload fails. Enable when coverage publication is required.
    # Default: `false`
    fail-ci-if-error: "false"
```

<!-- usage:end -->
<!-- inputs:start -->

## Inputs

| **Input**               | **Description**                                                                                                                   | **Required** | **Default** |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| **`working-directory`** | Working directory where coverage files are located.                                                                               | **false**    | `.`         |
|                         | Can be absolute or relative to the repository root.                                                                               |              |             |
| **`files`**             | Optional comma-separated coverage report files. When supplied, only these files are uploaded and automatic discovery is disabled. | **false**    | -           |
| **`fail-ci-if-error`**  | Fail the job when Codecov upload fails. Enable when coverage publication is required.                                             | **false**    | `false`     |

<!-- inputs:end -->
<!-- secrets:start -->
<!-- secrets:end -->
<!-- outputs:start -->
<!-- outputs:end -->
