---
name: library-release-readiness
description: Orchestrate the stabilization of MyCompLib from a component catalogue into a buildable, testable, packaged, and independently consumable Vue library.
---

# Workflow: Library Release Readiness

## Outcome

Deliver a package whose source gates pass, whose generated exports match package.json, and whose packed tarball builds inside an isolated Vue consumer.

Use the active Library Release Readiness section in .agy.local.md as the tracking ledger. Use $verify-library for source and integration gates and $package-library for artifact gates.

## Non-negotiable invariants

- Preserve public App* aliases, semantic color/shadow tokens, useTheme, and documented component behavior unless a breaking change is explicitly approved.
- Treat command exit codes and consumer results as truth; documentation cannot override a red gate.
- Stabilize the current stack before upgrading major dependencies.
- Do not suppress failures with any, broad lint disables, deleted assertions, or catch-all mocks.
- Keep unrelated user changes intact.

## Phase sequence

### Phase 0 — Make quality signals trustworthy

1. Fix package scripts so typecheck targets tsconfig.app.json or project build mode.
2. Bound lint to source/config files and ignore generated Histoire output.
3. Add shared Vitest setup and deterministic DOM cleanup.
4. Capture the new baseline with $verify-library.

Exit when every command measures real files and failures are reproducible.

### Phase 1 — Restore TypeScript and public API integrity

1. Move reusable runtime CVA recipes to colocated variants.ts files when types depend on them.
2. Keep types.ts type-only; never import nonexistent runtime exports from script setup.
3. Resolve public barrel collisions with explicit names or component-prefixed types.
4. Fix invalid story props, unused declarations, and stale imports.

Exit when the real TypeScript gate is green and public exports compile.

### Phase 2 — Restore unit-test integrity

1. Provide only browser primitives required by jsdom/Reka UI.
2. Clean Teleports and shared singleton state after each test.
3. Classify failures as environment gaps, stale assertions, or component regressions.
4. Prefer observable behavior, roles, accessible names, state attributes, and emitted contracts over styling implementation details.

Exit when Vitest has zero failed tests and zero unhandled errors.

### Phase 3 — Produce a consumable artifact

1. Restrict declaration generation to public production sources.
2. Make Vite CSS output and package exports agree.
3. Remove stale dist artifacts and prevent story/spec/Showcase declarations.
4. Add root consumer documentation and release metadata.
5. Pack and build an isolated consumer via $package-library.

Exit only when the tarball, not src, passes consumer TypeScript and production build checks.

### Phase 4 — Improve maintainability and accessibility

1. Split DataTable and Showcase by responsibility while preserving their public facade.
2. Replace raw colors/shadows with semantic tokens and narrow global CSS.
3. Add reduced-motion behavior, axe coverage, keyboard/focus scenarios, and contrast checks.
4. Expand E2E to supported engines and responsive viewports.

Exit when architecture metrics improve without API or behavior regressions.

### Phase 5 — Automate release confidence

1. Add CI for source gates, Histoire, E2E, package inspection, and consumer smoke.
2. Consolidate stale AI/project documentation into one maintained source of truth.
3. Define supported browsers, Node/pnpm versions, semver, release visibility, and provenance.

Exit when a clean checkout can reproduce every release gate non-interactively.

## Slice execution

Work in the smallest causal slice that can turn one red signal green. At the end of each slice:

1. Run targeted checks.
2. Run the phase-level $verify-library scope.
3. Inspect git diff and generated files.
4. Update .agy.local.md with evidence and remaining failures.

Never mark a phase complete because its files exist; mark it complete only when its exit condition passes.
