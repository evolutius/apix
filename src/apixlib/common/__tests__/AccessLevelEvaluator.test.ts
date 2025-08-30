/* eslint-disable @typescript-eslint/no-explicit-any */
import { AccessLevel } from '../AccessLevel';
import { AccessLevelEvaluator } from '../AccessLevelEvaluator';
import { EndpointMethod } from '../methods/EndpointMethod';
import { MethodCharacteristic } from '../methods/MethodCharacteristic';
import { Request } from '../Request';

describe('AccessLevelEvaluator', () => {
  let accessEvaluator: AccessLevelEvaluator;

  beforeEach(() => {
    accessEvaluator = new AccessLevelEvaluator();
    jest.clearAllMocks();
  })

  it('denied access for requestors with no access', async () => {
    jest.spyOn(accessEvaluator as any, 'isDeniedRequestor').mockReturnValueOnce(true);
    expect(await accessEvaluator.evaluate({} as EndpointMethod, {} as Request))
        .toBe(AccessLevel.NoAccess);
  });

  it('internal methods require internal access', async () => {
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([MethodCharacteristic.Internal]),
    } as any, {

    } as Request))
        .toBe(AccessLevel.NoAccess);

    jest.spyOn(accessEvaluator as any, 'isInternalRequestor').mockReturnValueOnce(true);

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([MethodCharacteristic.Internal]),
    } as any, {

    } as Request))
        .toBe(AccessLevel.Admin);
  });

  it('moderative methods require moderator access', async () => {
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([MethodCharacteristic.Moderative]),
    } as any, {

    } as Request))
        .toBe(AccessLevel.NoAccess);

    jest.spyOn(accessEvaluator as any, 'isModerativeRequestor').mockReturnValueOnce(true);

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([MethodCharacteristic.Moderative]),
    } as any, {

    } as Request))
        .toBe(AccessLevel.Moderator);
  });

  it('institutional methods require manager access', async () => {
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([MethodCharacteristic.Institutional]),
    } as any, {

    } as Request))
        .toBe(AccessLevel.NoAccess);

    jest.spyOn(accessEvaluator as any, 'isInstitutionalRequestor').mockReturnValueOnce(true);

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([MethodCharacteristic.Institutional]),
    } as any, {

    } as Request))
        .toBe(AccessLevel.Manager);
  });

  it('special methods require privileged access', async () => {
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([MethodCharacteristic.Special]),
    } as any, {

    } as Request))
        .toBe(AccessLevel.NoAccess);

    jest.spyOn(accessEvaluator as any, 'isPrivilegedRequestor').mockReturnValueOnce(true);

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([MethodCharacteristic.Special]),
    } as any, {

    } as Request))
        .toBe(AccessLevel.PrivilegedRequestor);
  });

  it('methods that are only privately owned require owner access', async () => {
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([MethodCharacteristic.PrivateOwnedData]),
      requestorOwnsResource: () => false
    } as any, {

    } as Request))
        .toBe(AccessLevel.NoAccess);

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([MethodCharacteristic.PrivateOwnedData]),
      requestorOwnsResource: () => true
    } as any, {

    } as Request))
        .toBe(AccessLevel.ResourceOwner);
  });

  it('methods with owned resource require least access', async () => {
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([
        MethodCharacteristic.PrivateOwnedData,
        MethodCharacteristic.PublicOwnedData,
      ]),
      requestorOwnsResource: () => false
    } as any, {

    } as Request))
        .toBe(AccessLevel.PublicRequestor); // require authentication

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([
        MethodCharacteristic.PrivateOwnedData,
        MethodCharacteristic.PublicOwnedData,
      ]),
      requestorOwnsResource: () => true
    } as any, {

    } as Request))
        .toBe(AccessLevel.ResourceOwner);

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([
        MethodCharacteristic.PublicOwnedData,
      ]),
      requestorOwnsResource: () => true
    } as any, {

    } as Request))
        .toBe(AccessLevel.ResourceOwner);

    jest.spyOn(accessEvaluator as any, 'isAuthenticatedRequestor').mockReturnValueOnce(true);
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([
        MethodCharacteristic.PrivateOwnedData,
        MethodCharacteristic.PublicOwnedData,
      ]),
      requestorOwnsResource: () => false
    } as any, {

    } as Request))
        .toBe(AccessLevel.AuthenticatedRequestor);
  });

  it('methods with unowned resource require least access', async () => {
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([
        MethodCharacteristic.PrivateOwnedData,
        MethodCharacteristic.PublicOwnedData,
        MethodCharacteristic.PublicUnownedData,
      ]),
      requestorOwnsResource: () => false
    } as any, {

    } as Request))
        .toBe(AccessLevel.PublicRequestor); // has access even if not authenticated or owner

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([
        MethodCharacteristic.PrivateOwnedData,
        MethodCharacteristic.PublicOwnedData,
        MethodCharacteristic.PublicUnownedData,
      ]),
      requestorOwnsResource: () => true
    } as any, {

    } as Request))
        .toBe(AccessLevel.ResourceOwner);  // has owner-level access

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([
        MethodCharacteristic.PublicUnownedData,
      ]),
      requestorOwnsResource: () => false
    } as any, {

    } as Request))
        .toBe(AccessLevel.PublicRequestor);  // public access only

    jest.spyOn(accessEvaluator as any, 'isAuthenticatedRequestor').mockReturnValueOnce(true);
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([
        MethodCharacteristic.PrivateOwnedData,
        MethodCharacteristic.PublicUnownedData,
      ]),
      requestorOwnsResource: () => false
    } as any, {

    } as Request))
        .toBe(AccessLevel.AuthenticatedRequestor); // has authenticated-level access
  });
})
