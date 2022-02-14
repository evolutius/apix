import {ClearanceLevel} from './ClearanceLevel';

/**
 * Verifies if player has enough clearance to access the resource
 * @param {ClearanceLevel} requiredCl required clearance level
 * @param {ClearanceLevel} currentCl current clearance level in request
 * @return {boolean} true if enough clereance to access the resource
 */
export function appVerifyClearanceLevel(
    requiredCl: ClearanceLevel, currentCl: ClearanceLevel): boolean {
  return currentCl <= requiredCl;
}
