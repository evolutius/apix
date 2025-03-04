/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * An interface for a logger.
 * 
 * @category Logging & Operations
 */
export interface Logger {
  /**
   * Logs _info_-level information.
   * @param message A message to log 
   */
  readonly info: (message: any) => void;

  /**
   * Logs _warning_-level information.
   * @param message A message to log 
   */
  readonly warn: (message: any) => void;

  /**
   * Logs _error_-level information.
   * @param message A message to log 
   */
  readonly error: (message: any) => void;
}
