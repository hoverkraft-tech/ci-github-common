# AGENTS.md — agent instructions and operational contract

This file is written for automated coding agents (for example: Copilot coding agents). It exists to provide a concise operational contract and guardrails for agents working in this repository. It is not the canonical source for design or style rules. Those live in the developer documentation linked below.

## Organization-wide guidelines (required)

- Follow the prioritized shared instructions in [hoverkraft-tech/.github/AGENTS.md](https://github.com/hoverkraft-tech/.github/blob/main/AGENTS.md) before working in this repository.

## Quick Start

This project is a collection of **opinionated GitHub Actions** and reusable workflows that provide common continuous-integration building blocks.

### Key sections to reference

- **[Overview](README.md#overview)** – Project purpose, supported scenarios, and scope
- **[Actions](README.md#actions)** – Catalog of available actions grouped by usage
- **[Reusable Workflows](README.md#reusable-workflows)** – Ready-to-consume workflows for frequent CI automation needs
- **[Contributing](README.md#contributing)** – Structure patterns, development standards, and review expectations
- **[Development Workflow](README.md#development-workflow)** – Commands for linting, testing, and local verification

## Agent-specific development patterns

### Critical workflow knowledge

```bash
# Essential commands for development
make lint        # Run Super Linter (dockerized)
make lint-fix    # Auto-fix linting issues where possible
gh act -W .github/workflows/workflow-file-to-test.yml  # Test workflows locally with `act`
```

For detailed documentation on each action and workflow, refer to the individual readme files linked in the main [README.md](README.md).
