# AGENTS

This document is a concise guide for automation and AI coding agents contributing to this repository. Follow it to make safe, minimal, and correct changes.

## Purpose
- Ship focused, high‑quality changes with strong safety and test coverage.
- Preserve security and behavioral invariants of the API runtime.
- Maintain backward compatibility and public API stability across minor versions.

## Stack & Requirements
- Language: TypeScript 5+ (standard decorators; `experimentalDecorators: false`).
- Target: ES2022; CommonJS in tests via `ts-jest`.
- Frameworks: Express 4, Jest, ESLint.
- Decorators: TC39 standard decorators (TS5 semantics) used for endpoint declaration.

## Architecture Overview
- `AppManager`: Express wiring, security checks, metrics/logging, and endpoint registration.
- Declarative endpoints: See `src/apixlib/common/methods/Decorators.ts` for `@EndpointGenerator`, `@Route`, resource/auth decorators, and synthesis helpers.
- Access control: `AccessLevelEvaluator` determines effective `AccessLevel` based on endpoint characteristics and ownership logic.
- Endpoint model: `EndpointMethod` defines the runtime contract for handlers and validation.
- Utilities:
  - `TypeUtil`: type guards and helpers (query value extraction, null checks, etc.).
  - Query params: `UrlQueryParameter`, validator + processor pipeline.
  - HTTP body: `HttpBodyValidator`.
  - Errors: `makeErrorResponse`, `ApiXError` IDs.

## Security & Behavioral Invariants (Do Not Weaken)
- Request verification (AppManager.verifyRequest):
  - Require non‑empty headers: `X-API-Key`, `Date`, `X-Signature`, `X-Signature-Nonce`.
  - Reject requests older than `ApiXConfig.maxRequestAge` (ms). If set to `Infinity`, age checks are disabled (used in tests/dev).
  - Replay protection: cache `apiKey+signature` with TTL ≈ `maxRequestAge` (+ small skew) in seconds; omit TTL if `Infinity`.
  - Signature canonicalization: JSON body keys must be sorted recursively before hashing. Body is optional; empty → "".
- Route invariants:
  - `GET` endpoints must not require a JSON body.
  - Endpoints must declare at least one characteristic.
  - Ownership evaluator is required when endpoint has private resources, or public resources with auth.
  - `@OwnerEvaluator` must not be decorated with `@Route`.
- URL building must be POSIX (no backslashes): use `path.posix.join` or existing helpers.

## Code Style & Conventions
- Prefer modern names (without `ApiX` prefix). Backward‑compatibility aliases are exported from `src/index.ts` only; do not introduce new `ApiX*` names.
- Keep changes minimal, targeted, and consistent with surrounding code.
- Use `TypeUtil` for robust guards:
  - `isNonEmptyString` for header presence.
  - `getFirstStringFromQueryValue` for Express `req.query[name]` normalization.
  - `isObject`/`isNonEmptyObject` for body handling.
  - `isFunction` for runtime function checks.
- Do not introduce network calls in tests. Avoid non‑deterministic behavior.
- When handling time or TTL, be explicit about units (ms vs s).

## Testing & Validation
- Run unit tests: `npm test` (Jest + ts‑jest).
- Lint before changes ship: `npm run lint`.
- Add tests for new logic, especially around:
  - Decorator semantics and endpoint synthesis.
  - Security invariants (headers, age, replay, signature correctness).
  - Query parameter validation and processing.
- Keep tests fast and isolated. Use provided mocks for cache, data manager, and evaluator.

## Public API & Exports
- All primary entry points are re‑exported via `src/index.ts`, including deprecated aliases.
- Maintain stability of exported symbols across minor versions. If adding new exports:
  - Prefer non‑prefixed names.
  - Consider adding deprecated aliases for one release where appropriate.

## Common Pitfalls
- Using `path.join` for routes (Windows backslashes). Use POSIX join.
- Spreading `null` into objects (`...null` throws). Use `{}` as fallback.
- Treating `req.query[name]` as always `string`. Normalize with `TypeUtil`.
- Assuming `req.body` is always present. Guard with `TypeUtil.isObject` and canonicalize properly.
- Forgetting `Infinity` handling for `MaxRequestAge` in tests/dev.

## Change Checklist
- Minimal scope: only modify files relevant to the task.
- Preserve invariants listed in this document.
- Use `TypeUtil` guards instead of ad‑hoc `typeof` checks where applicable.
- Add or update unit tests (and only tests that cover the change).
- Ensure all tests pass and lint is clean.
- Update `CHANGELOG.md` for user‑visible behavior changes.

## Quick Reference — Adding an Endpoint (Decorators)
1. Create a class and decorate with `@EndpointGenerator('entity')`.
2. Add methods decorated with `@Route('method', 'VERB')` and resource decorators.
3. If required, add `@OwnerEvaluator()` to a single method with signature `(req) => boolean | Promise<boolean)`.
4. Optionally add `@HttpBody(validator, required)` and `@QueryParameters([...])`.
5. Register the generator instance with `AppManager.registerMethodGenerator(...)`.

Example:

```ts
@EndpointGenerator('users')
@AuthRequired()
class Users extends BaseEndpointGenerator {
  @Route(':id')
  @PrivateResource()
  async getUser(req: Request, res: ExpressResponse) { return { data: { success: true } }; }

  @OwnerEvaluator()
  owns(req: Request) { return true; }
}
```

---
This guide is intentionally brief and operational. When in doubt, prefer safety, tests, and minimal surface area changes.
