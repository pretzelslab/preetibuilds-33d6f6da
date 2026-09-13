// Type-safe replacement for the `delete window.location` trick in tests.
//
// Why this exists: `window.location` is declared as `string & Location` (so
// that `window.location = "/somewhere"` typechecks), which makes assigning a
// plain stub object a TS2322 error. The usual workaround — `delete
// window.location` followed by an assignment — needs a suppression comment,
// and under this project's tsconfig (`strict: false`, so no
// `strictNullChecks`) the `delete` is not an error at all, which made the
// `@ts-expect-error` above it report as unused (TS2578).
//
// Object.defineProperty is the supported jsdom technique and needs neither a
// cast nor a suppression. `configurable: true` is what lets the property be
// redefined again on the next test and restored afterwards.

/**
 * Replaces `window.location` with a mutable copy carrying `overrides`.
 * Returns the original, to hand back to {@link restoreWindowLocation}.
 *
 * `overrides` is `Partial<Location>`, so a misspelled field is a compile
 * error rather than a silently ignored property.
 */
export function stubWindowLocation(overrides: Partial<Location>): Location {
  const original = window.location;
  Object.defineProperty(window, "location", {
    value: { ...original, ...overrides },
    writable: true,
    configurable: true,
  });
  return original;
}

/** Restores the real `window.location` captured by {@link stubWindowLocation}. */
export function restoreWindowLocation(original: Location): void {
  Object.defineProperty(window, "location", {
    value: original,
    writable: true,
    configurable: true,
  });
}
