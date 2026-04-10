<!-- header:start -->

# ![Icon](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJmZWF0aGVyIGZlYXRoZXItY29weSIgY29sb3I9ImJsdWUiPjxyZWN0IHg9IjkiIHk9IjkiIHdpZHRoPSIxMyIgaGVpZ2h0PSIxMyIgcng9IjIiIHJ5PSIyIj48L3JlY3Q+PHBhdGggZD0iTTUgMTVIM2EyIDIgMCAwIDEtMi0yVjNhMiAyIDAgMCAxIDItMmgxMGEyIDIgMCAwIDEgMiAydjIiPjwvcGF0aD48L3N2Zz4=) GitHub Action: Local actions

<div align="center">
  <img src="../../.github/logo.svg" width="60px" align="center" alt="Local actions" />
</div>

---

<!-- header:end -->

## Overview

Action to expose sibling local actions next to the current action directory.
It creates a symlink to the parent actions directory at `../self-actions` relative to `github.workspace` during the main step and removes it automatically in the post step.

## Usage

```yaml
- uses: ./../local-actions
  with:
    source-path: ${{ github.action_path }}/../..

- uses: ./../self-actions/get-issue-number
```

## Inputs

| **Input**         | **Description**                                                                | **Required** | **Default** |
| ----------------- | ------------------------------------------------------------------------------ | ------------ | ----------- |
| **`source-path`** | The actions root path. Pass `${{ github.action_path }}/../..` from the caller. | **true**     | -           |

## Outputs

| **Output** | **Description**                                      |
| ---------- | ---------------------------------------------------- |
| **`path`** | The resolved destination path for the copied actions |
