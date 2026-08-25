---
name: package-library
description: Build, inspect, pack, and consumer-test the MyCompLib distribution artifact. Use when changing Vite library configuration, package exports, CSS output, declaration generation, dependencies, public APIs, publishing metadata, or release readiness.
---

# Package MyCompLib

Validate the artifact a consumer receives, not the source tree or a stale dist directory.

## Build and inspect

1. Record git status --short.
2. Run pnpm run build:lib; stop artifact claims if it fails.
3. Run node .agents/skills/package-library/scripts/inspect-package.mjs .
4. Run pnpm pack --dry-run and inspect the complete file list.

The inspector verifies declared entrypoints, CSS and type targets, and rejects leaked story/spec declarations or imports from the removed pre-colocalization architecture.

## Validate an isolated consumer

Use a fixture outside the library source graph. It must install the packed tarball rather than import src or use the @ alias.

The fixture must prove:

- ESM named component import.
- Default Vue plugin installation.
- TypeScript declaration resolution.
- CSS subpath import.
- At least one Reka-backed interactive component renders.
- Production Vite build succeeds without undeclared dependencies.

When CJS remains a documented output, add a require() smoke check. Use a temporary directory or a committed tests/fixtures/consumer project; never treat the Showcase as a consumer fixture.

## Packaging invariants

- Every path in main, module, types, and exports exists after a clean build.
- dist contains only current public artifacts.
- Specs, stories, Showcase declarations, source aliases, and removed src/shared/components/ui paths do not leak.
- External runtime packages are declared as dependencies or peer dependencies intentionally.
- The packed package contains consumer README, license, styles, JavaScript, and declarations.
- private, package scope, publishConfig, versioning, and registry visibility match the intended release channel.

Do not mark packaging green from pnpm pack --dry-run alone: a tarball can be internally inconsistent and still pack successfully.

## Finish

Run the full $verify-library scope after packaging changes. Update .agy.local.md with the tarball name, fixture command, artifact checks, and exact remaining failures.
