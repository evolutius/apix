
export interface ApiXDataManager {
  getAppKeyForApiKey(apiKey: string): string | null;
  getUserIdForSessionId(sessionId: string): string | null;
}
