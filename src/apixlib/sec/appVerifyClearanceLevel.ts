import {ApiXClearanceLevel} from './ApiXClearanceLevel';

/**
 * Verifies if player has enough clearance to access the resource
 * @param {ApiXClearanceLevel} requiredCl required clearance level
 * @param {ApiXClearanceLevel} currentCl current clearance level in request
 * @return {boolean} true if enough clereance to access the resource
 */
export function appVerifyClearanceLevel(
    requiredCl: ApiXClearanceLevel, currentCl: ApiXClearanceLevel): boolean {
  return currentCl <= requiredCl;
}
