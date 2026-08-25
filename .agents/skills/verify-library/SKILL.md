---
name: verify-library
description: Run trustworthy source, test, build, story, E2E, and packaging quality gates for MyCompLib. Use when implementing or reviewing refactors, diagnosing a red build, validating a component change, preparing a release, or deciding whether the library is genuinely complete.
---

# Verify MyCompLib

Treat executable checks as the source of truth. Never infer completion from file presence, a journal entry, or a previously generated dist directory.

## Select the verification scope

- **Targeted:** Run the affected spec plus lint on changed files during a local edit loop.
- **Source:** Run real TypeScript, source lint, and all unit tests after a cross-cutting source change.
- **Full:** Run every gate below for release, packaging, theme, build-system, or public-API work.

If the user asks for implementation, run the proportional scope without waiting for a separate request to test. If the user asks only for analysis, keep checks read-only.

## Run gates

Before trusting package scripts, inspect package.json and the root TypeScript project. Until the scripts are repaired, use these explicit commands:

1. Real TypeScript check:
   pnpm exec vue-tsc -p tsconfig.app.json --noEmit --incremental false
2. Source lint without generated Histoire output:
   pnpm exec eslint src e2e vite.config.ts histoire.config.ts playwright.config.ts
3. Unit suite:
   pnpm run test:unit
4. Library build:
   pnpm run build:lib
5. Histoire build:
   pnpm run story:build
6. Showcase E2E:
   pnpm run e2e
7. Distribution and consumer checks: invoke $package-library.

Use pnpm.cmd instead of pnpm only when the Windows shell requires it. A timeout, unhandled rejection, warning threshold breach, or skipped required gate is not a pass.

## Diagnose in causal order

1. Fix TypeScript and public export errors before interpreting generated declarations.
2. Fix test-environment gaps separately from real component-contract regressions.
3. Build from current sources before inspecting dist.
4. Fix packaging before running the isolated consumer fixture.
5. Run Histoire and E2E after source and package contracts are stable.

Do not weaken types, blanket-disable lint rules, delete assertions, or add broad mocks merely to turn a gate green.

## Report and anchor results

For every gate, record the exact command, exit code, failure count, affected files, and whether the failure predates the current change. Check git status --short before and after validation so generated files do not silently enter the patch.

After a milestone, update the active section of .agy.local.md. Mark the roadmap complete only when every required full gate passes and $package-library validates an isolated consumer.
