
export interface ApiXDataManager {
  getAppKeyForApiKey(apiKey: string): string | Promise<string> | null;
  getUserIdForSessionId(sessionId: string): string | Promise<string> | null;
}
