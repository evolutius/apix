
export interface AppDataManager {
  getAppKeyForApiKey(apiKey: string): string | null;
  getUserIdForSessionId(sessionId: string): string | null;
}
