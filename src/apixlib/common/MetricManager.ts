
/**
 * Tags to add dimensionality/context to metrics.
 * 
 * @category Logging & Operations
 */
export type MetricTags = Record<string, string | number>;

/**
 * A manager to emit metrics.
 * 
 * @category Logging & Operations
 */
export interface MetricManager {
  /**
   * Emits a count metric.
   * @param metricName The name of the metric to emit.
   * @param value The value to emit (defaults to 1).
   * @param tags The dimensions to emit with the metric.
   */
  readonly emit: (metricName: string, value?: number, tags?: MetricTags) => void;
}

/**
 * The options to set in the API-X Manager for a `MetricManager`.
 * 
 * @category Logging & Operations
 */
export interface MetricManagerOptions {
  /**
   * A prefix to use for all metric names.
   */
  readonly namePrefix?: string;

  /**
   * Metric tags to emit in addition to manager's tags.
   */
  readonly tags?: MetricTags;
}
