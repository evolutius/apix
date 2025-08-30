import { TypeUtil } from '../../utils/TypeUtil';

describe('TypeUtil', () => {
  test('isValidDateString', () => {
    expect(TypeUtil.isValidDateString('2024-01-01T00:00:00Z')).toBe(true);
    expect(TypeUtil.isValidDateString('not-a-date')).toBe(false);
    expect(TypeUtil.isValidDateString(123 as any)).toBe(false);
  });

  test('isString and isNonEmptyString', () => {
    expect(TypeUtil.isString('x')).toBe(true);
    expect(TypeUtil.isString(1)).toBe(false);
    expect(TypeUtil.isNonEmptyString('')).toBe(false);
    expect(TypeUtil.isNonEmptyString('hello')).toBe(true);
  });

  test('isNumber and isFiniteNumber', () => {
    expect(TypeUtil.isNumber(1)).toBe(true);
    expect(TypeUtil.isNumber('1')).toBe(false);
    expect(TypeUtil.isFiniteNumber(42)).toBe(true);
    expect(TypeUtil.isFiniteNumber(NaN)).toBe(false);
    expect(TypeUtil.isFiniteNumber(Infinity)).toBe(false);
  });

  test('isBoolean', () => {
    expect(TypeUtil.isBoolean(true)).toBe(true);
    expect(TypeUtil.isBoolean(false)).toBe(true);
    expect(TypeUtil.isBoolean('true' as any)).toBe(false);
  });

  test('isArray and isNonEmptyArray', () => {
    expect(TypeUtil.isArray([])).toBe(true);
    expect(TypeUtil.isArray('x' as any)).toBe(false);
    expect(TypeUtil.isNonEmptyArray([])).toBe(false);
    expect(TypeUtil.isNonEmptyArray(['a'])).toBe(true);
  });

  test('isObject and isNonEmptyObject', () => {
    expect(TypeUtil.isObject({})).toBe(true);
    expect(TypeUtil.isObject([])).toBe(false);
    expect(TypeUtil.isObject(null)).toBe(false);
    expect(TypeUtil.isNonEmptyObject({})).toBe(false);
    expect(TypeUtil.isNonEmptyObject({ a: 1 })).toBe(true);
  });

  test('isNil and isDefined', () => {
    expect(TypeUtil.isNil(undefined)).toBe(true);
    expect(TypeUtil.isNil(null)).toBe(true);
    expect(TypeUtil.isNil(0)).toBe(false);
    const val: string | undefined = 'x';
    expect(TypeUtil.isDefined(val)).toBe(true);
    const val2: string | undefined = undefined;
    expect(TypeUtil.isDefined(val2)).toBe(false);
  });

  test('hasOwn', () => {
    const obj = Object.create({ protoProp: 1 });
    (obj as any).ownProp = 2;
    expect(TypeUtil.hasOwn(obj, 'ownProp')).toBe(true);
    expect(TypeUtil.hasOwn(obj, 'protoProp')).toBe(false);
  });

  test('getFirstStringFromQueryValue', () => {
    expect(TypeUtil.getFirstStringFromQueryValue('hello')).toBe('hello');
    expect(TypeUtil.getFirstStringFromQueryValue(['a', 'b'])).toBe('a');
    expect(TypeUtil.getFirstStringFromQueryValue([1, 2] as any)).toBeUndefined();
    expect(TypeUtil.getFirstStringFromQueryValue({})).toBeUndefined();
    expect(TypeUtil.getFirstStringFromQueryValue(undefined)).toBeUndefined();
  });
});

