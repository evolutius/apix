# Changelog

All notable changes to this project are documented in this file.

The format is inspired by Keep a Changelog, and this project adheres to Semantic Versioning.

## [2.2.0] - 2025-08-29

- Added: Declarative endpoint declarations using TypeScript 5+ standard decorators (`@EndpointGenerator`, `@Route`, `@PrivateResource`, `@PublicResource`, etc.).
- Added: `BaseEndpointGenerator`, `getGeneratedEndpoints`, and `isValidEndpointGenerator` to synthesize endpoints from decorated classes.
- Added: `TypeUtil` helpers (type guards and safe extractors) and tests.
- Changed: Dropped the `ApiX` prefix from most exported names; provided deprecated aliases to ease migration.
- Changed: Upgraded TypeScript and tooling (TS 5+, ESLint, ts-jest) and adjusted `tsconfig` for standard decorators (`experimentalDecorators: false`, `useDefineForClassFields: true`, `target: ES2022`).
- Fixed: Avoid spreading `null` in endpoint object composition; use safe empty object spreads.
- Fixed: Enforce invariant that `GET` endpoints cannot require a JSON body.
- Fixed: Ownership evaluator requirement now applies to private resources and to public+auth endpoints.
- Fixed: URL query parameter extraction accepts only string values and handles arrays safely.
- Fixed: Express route building uses POSIX joins to avoid backslashes on Windows.
- Fixed: Header verification ensures required headers are present and non-empty.
- Security: Replay-protection TTL aligned to `MaxRequestAge` (with small skew). TTL not set when `MaxRequestAge` is `Infinity` to support test/dev scenarios.
- Stability: Deterministic endpoint ordering, frozen endpoint objects, and stronger runtime assertions.

## [2.1.0] - 2025-07-09

- Changed: Error responses now include a structured `error` object (ID + message) instead of only a message.
- Fixed: Minor corrections and preparations for v2.1 rollout.

## [2.0.0] - 2024-11-17

- Added: API-X v2 core redesign.
  - Access control via `AccessLevelEvaluator` with overridable checks.
  - Endpoint characteristics (e.g., Internal, Moderative, Institutional, Special, Public/Private Owned/Unowned) to drive authorization.
  - Owned-resource handling via `requestorOwnsResource` for endpoints serving owned data.
  - Custom `Logger` and `MetricManager` integration and additional operational logging.
  - Methods now return a typed `Response` (`{ status?, data }`).
- Security: Request signature calculation fixes (canonical JSON body sorting), duplicate-signature detection using cache, and stricter header validation.
- Changed: Application cache made required to support security features.
- Changed: `RedisStore` streamlined constructor (removed username; minor API adjustments).
- Docs: Substantial documentation updates, including deployments and operations guidance.

[2.2.0]: https://github.com/evolutius/apix/releases/tag/v2.2.0
[2.1.0]: https://github.com/evolutius/apix/releases/tag/v2.1.0
[2.0.0]: https://github.com/evolutius/apix/releases/tag/v2.0.0
