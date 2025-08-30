/**
 * Utility functions for working with types.
 */

/**
 * Type utility functions.
 */
export namespace TypeUtil {

  /** A type that represents an optional value. Missing values are represented as undefined or null. */
  export type Optional<T> = T | undefined | null;

  /**
   * Checks if the given value is a valid date string.
   * @param value The value to check.
   * @returns True if the value is a valid date string, false otherwise.
   */
  export function isValidDateString(value: unknown): value is string {
    return typeof value === 'string' && !isNaN(Date.parse(value));
  }

  /**
   * Checks if the given value is a string.
   * @param value The value to check.
   * @returns True if the value is a string, false otherwise.
   */
  export function isString(value: unknown): value is string {
    return typeof value === 'string';
  }

  /**
   * Checks if the given value is a non-empty string.
   * @param value The value to check.
   * @returns True if the value is a non-empty string, false otherwise.
   */
  export function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
  }

  /**
   * Checks if the given value is a number.
   * @param value The value to check.
   * @returns True if the value is a number, false otherwise.
   */
  export function isNumber(value: unknown): value is number {
    return typeof value === 'number';
  }

  /**
   * Checks if the given value is a boolean.
   * @param value The value to check.
   * @returns True if the value is a boolean, false otherwise.
   */
  export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
  }

  /**
   * Checks if the given value is an array.
   * @param value The value to check.
   * @returns True if the value is an array, false otherwise.
   */
  export function isArray<T>(value: unknown): value is T[] {
    return Array.isArray(value);
  }

  /**
   * Checks if the given value is an object.
   * @param value The value to check.
   * @returns True if the value is an object, false otherwise.
   */
  export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  /**
   * Checks if the given value is a function.
   * @param value The value to check.
   * @returns True if the value is a function, false otherwise.
   */
  export function isFunction(value: unknown): value is (...args: any[]) => any {
    return typeof value === 'function';
  }

  /**
   * Checks if the given value is null or undefined.
   * @param value The value to check.
   * @returns True if the value is nullish, false otherwise.
   */
  export function isNil(value: unknown): value is null | undefined {
    return value === null || value === undefined;
  }

  /**
   * Checks if the given value is defined (not null or undefined).
   * @param value The value to check.
   * @returns True if defined, false otherwise.
   */
  export function isDefined<T>(value: T | undefined | null): value is T {
    return value !== undefined && value !== null;
  }

  /**
   * Checks if the given value is a non-empty array.
   * @param value The value to check.
   * @returns True if the value is an array with length > 0.
   */
  export function isNonEmptyArray<T>(value: unknown): value is T[] {
    return Array.isArray(value) && value.length > 0;
  }

  /**
   * Checks if the given value is a finite number.
   * @param value The value to check.
   * @returns True if the value is a finite number, false otherwise.
   */
  export function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  /**
   * Checks if the given value is an integer.
   * @param value The value to check.
   * @returns True if the value is an integer, false otherwise.
   */
  export function isInteger(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value);
  }

  /**
   * Checks if the given value is a positive integer (>= 1).
   * @param value The value to check.
   * @returns True if positive integer, false otherwise.
   */
  export function isPositiveInteger(value: unknown): value is number {
    return isInteger(value) && (value as number) >= 1;
  }

  /**
   * Checks if the given value is a non-empty plain object (not an array).
   * @param value The value to check.
   * @returns True if the value is an object with at least one own key.
   */
  export function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
    return isObject(value) && Object.keys(value as Record<string, unknown>).length > 0;
  }

  /**
   * Safe hasOwnProperty check.
   * @param obj The object to check.
   * @param prop The property name or symbol.
   */
  export function hasOwn(obj: object, prop: PropertyKey): boolean {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  /**
   * Extracts the first string from an Express query value. Express `req.query[name]`
   * can be `string | string[] | ParsedQs | ParsedQs[]`. This utility returns
   * the first string value if available, otherwise undefined.
   * @param value The raw query value.
   * @returns A string or undefined.
   */
  export function getFirstStringFromQueryValue(value: unknown): string | undefined {
    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      for (const v of value) {
        if (typeof v === 'string') {
          return v;
        }
      }
      return undefined;
    }
    return undefined;
  }
}
