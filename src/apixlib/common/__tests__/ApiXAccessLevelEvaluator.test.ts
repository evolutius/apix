/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiXAccessLevel } from '../ApiXAccessLevel';
import { ApiXAccessLevelEvaluator } from '../ApiXAccessLevelEvaluator';
import { ApiXMethod } from '../methods/ApiXMethod';
import { ApiXMethodCharacteristic } from '../methods/ApiXMethodCharacteristic';
import { ApiXRequest } from '../ApiXRequest';

describe('ApiXAccessLevelEvaluator', () => {
  let accessEvaluator: ApiXAccessLevelEvaluator;

  beforeEach(() => {
    accessEvaluator = new ApiXAccessLevelEvaluator();
    jest.clearAllMocks();
  })

  it('denied access for requestors with no access', async () => {
    jest.spyOn(accessEvaluator as any, 'isDeniedRequestor').mockReturnValueOnce(true);
    expect(await accessEvaluator.evaluate({} as ApiXMethod, {} as ApiXRequest))
        .toBe(ApiXAccessLevel.NoAccess);
  });

  it('internal methods require internal access', async () => {
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([ApiXMethodCharacteristic.Internal]),
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.NoAccess);

    jest.spyOn(accessEvaluator as any, 'isInternalRequestor').mockReturnValueOnce(true);

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([ApiXMethodCharacteristic.Internal]),
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.Admin);
  });

  it('moderative methods require moderator access', async () => {
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([ApiXMethodCharacteristic.Moderative]),
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.NoAccess);

    jest.spyOn(accessEvaluator as any, 'isModerativeRequestor').mockReturnValueOnce(true);

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([ApiXMethodCharacteristic.Moderative]),
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.Moderator);
  });

  it('institutional methods require manager access', async () => {
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([ApiXMethodCharacteristic.Institutional]),
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.NoAccess);

    jest.spyOn(accessEvaluator as any, 'isInstitutionalRequestor').mockReturnValueOnce(true);

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([ApiXMethodCharacteristic.Institutional]),
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.Manager);
  });

  it('special methods require privileged access', async () => {
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([ApiXMethodCharacteristic.Special]),
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.NoAccess);

    jest.spyOn(accessEvaluator as any, 'isPrivilegedRequestor').mockReturnValueOnce(true);

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([ApiXMethodCharacteristic.Special]),
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.PrivilegedRequestor);
  });

  it('methods that are only privately owned require owner access', async () => {
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([ApiXMethodCharacteristic.PrivateOwnedData]),
      requestorOwnsResource: () => false
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.NoAccess);

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([ApiXMethodCharacteristic.PrivateOwnedData]),
      requestorOwnsResource: () => true
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.ResourceOwner);
  });

  it('methods with owned resource require least access', async () => {
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([
        ApiXMethodCharacteristic.PrivateOwnedData,
        ApiXMethodCharacteristic.PublicOwnedData,
      ]),
      requestorOwnsResource: () => false
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.PublicRequestor); // require authentication

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([
        ApiXMethodCharacteristic.PrivateOwnedData,
        ApiXMethodCharacteristic.PublicOwnedData,
      ]),
      requestorOwnsResource: () => true
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.ResourceOwner);

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([
        ApiXMethodCharacteristic.PublicOwnedData,
      ]),
      requestorOwnsResource: () => true
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.ResourceOwner);

    jest.spyOn(accessEvaluator as any, 'isAuthenticatedRequestor').mockReturnValueOnce(true);
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([
        ApiXMethodCharacteristic.PrivateOwnedData,
        ApiXMethodCharacteristic.PublicOwnedData,
      ]),
      requestorOwnsResource: () => false
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.AuthenticatedRequestor);
  });

  it('methods with unowned resource require least access', async () => {
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([
        ApiXMethodCharacteristic.PrivateOwnedData,
        ApiXMethodCharacteristic.PublicOwnedData,
        ApiXMethodCharacteristic.PublicUnownedData,
      ]),
      requestorOwnsResource: () => false
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.PublicRequestor); // has access even if not authenticated or owner

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([
        ApiXMethodCharacteristic.PrivateOwnedData,
        ApiXMethodCharacteristic.PublicOwnedData,
        ApiXMethodCharacteristic.PublicUnownedData,
      ]),
      requestorOwnsResource: () => true
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.ResourceOwner);  // has owner-level access

    expect(await accessEvaluator.evaluate({
      characteristics: new Set([
        ApiXMethodCharacteristic.PublicUnownedData,
      ]),
      requestorOwnsResource: () => false
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.PublicRequestor);  // public access only

    jest.spyOn(accessEvaluator as any, 'isAuthenticatedRequestor').mockReturnValueOnce(true);
    expect(await accessEvaluator.evaluate({
      characteristics: new Set([
        ApiXMethodCharacteristic.PrivateOwnedData,
        ApiXMethodCharacteristic.PublicUnownedData,
      ]),
      requestorOwnsResource: () => false
    } as any, {

    } as ApiXRequest))
        .toBe(ApiXAccessLevel.AuthenticatedRequestor); // has authenticated-level access
  });
})
