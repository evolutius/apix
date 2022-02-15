import {createHash} from 'crypto';
import {Request} from 'express';
import {ApiXDataManager} from '../ApiXDataManager';

/**
 * Verifies that the app making the request is a valid app
 * @param {string} apiKey Api Key of the request
 * @param {string} appSessionId Unique app session ID of the request
 * @param {Request} req Request object
 * @param {number} maxDateDifference Maximum date difference in ms
 * @param {ApiXDataManager} appDataManager data manager
 * @return {boolean} true if the session ID is valid
 */
export function appSessionVerify(
    apiKey: string, appSessionId: string, req: Request,
    maxDateDifference: number, appDataManager: ApiXDataManager): boolean {
  // Verify Request Date is Valid
  const dateString = req.headers.date;

  if (!dateString) {
    return false;
  }

  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getUTCMilliseconds() - date.getUTCMilliseconds();

  if (diff < 0 || diff > maxDateDifference) {
    return false;
  }

  // Verify Session
  const hash = createHash('sha256');
  const appKey = appDataManager.getAppKeyForApiKey(apiKey) || '';
  const httpBody = Object.keys(req.body).length > 0 ?
         JSON.stringify(req.body, Object.keys(req.body).sort()) : '';
  const httpBodyBase64 = httpBody.length > 0 ?
        Buffer.from(httpBody, 'binary').toString('base64') : '';
  const calculatedSessionId =
      hash.update(httpBodyBase64 + appKey + dateString, 'utf-8')
          .digest()
          .toString('hex');

  return calculatedSessionId === appSessionId;
}
