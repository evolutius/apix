---
title: Measuring Quality With Logging and Metrics
category: Logging & Operations
---
# Measuring Quality With Logging and Metrics

API-X comes equipped with an interface that allows users to specify a logger and a metric manager. Those can be used to diagnose issues and measure the health and quality of the service.

## Enabling Logging

The [`Logger`](/interfaces/apix.Logger.html) interface allows the The [`AppManager`](/classes/apix.AppManager.html) to log info, warnings, and debug messages. It logs enough information to be able to diagnose issues and identify common patterns in failed or rejected requests. Users should also use this logger to log information to a centralized location.

A common logger which is fully compatible with the `Logger` interface out of the box is `pino`. Example usage:

```ts
...
import pino from 'pino';

/// Logger
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  name: 'my-service'
});

...
const manager = new AppManager(
  ...,
  logger,
  ...
);
```

By default, Pino emits those logs to `stdout`, but it is highly flexible and can be configured to emit those logs to different services or files. Example:

```ts
const logger = pino({
  ...,
  transport: {
    target: 'pino-http-send',
    options: {
      url: 'https://your-logging-server.example.com/logs',
      method: 'POST',
    },
  },
  ...
});
```

An alternative method is to pipe the stdout out to another service using `pino-http-send`:

```
$ node app.js | pino-http-send --url=https://your-server.example.com/logs
```

Finally, you can also log to your local machine to a file:

```ts
const logger = pino(pino.destination('/var/logs/my-service.log'));
```

This will log to `/var/log/my-service.log` using pino.

## Measuring Quality with Metrics

In addition to logging, the `AppManager` emits various metrics if a The [`MetricManager`](/interfaces/apix.MetricManager.html) is provided. The `MetricManager` requires a single method to be implemented; `emit`. The `emit` method simply emits a count metric. Example implementation:

```ts
class MyMetricManager implements MetricManager {
  public emit(metricName: string, value?: number, tags?: MetricTags) {
    // TODO: Implement emit logic using some service such as Prometheus
    // The `metricName` will be options.namePrefix + AppManager metric name.
  }
}
```

We have a `metricName`, `value` (defaults to 1 if not provided), and `tags` which are dimensions associated with the metric emitted. The metric manager is then set in the `AppManager`:

```ts
const manager = new AppManager(...);
...
manager.setMetricManager(
  new MyMetricManager(),
  {
    namePrefix: 'myService:', // a prefix for all metrics emitted
    tags: {
      region: env.region, // gets a region where your service is deployed
    }, // some default tags that are emitted with every metric
  }  // these are options for the Metric Manager (`MetricManagerOptions`)
);
```

The `AppManager` then uses this metric manager to emit counter and latency metrics. Here are the metrics emitted by the manager and the tags used:

* SuccessfulRequest: Emits `1` when a request is successfully handled (200s or 300s status code). Emits `0` if the request is not rejected but failed at the request handler. Use the average of the metric to get a success rate for non-rejected requests.
  * Tags:
    * `endpoint`: The different available endpoints (e.g.: /example/endpoint)
    * `httpMethod`: The HTTP Method (GET, POST, PUT, etc.)
* RejectedRequest: Emits `1` when a request is reject before reaching the request handler. This could be because there's no permission, invalid headers, invalid parameters, missing JSON body, etc.
  * Tags:
    * `reason`:
      * `MissingRequiredHeaders`
      * `UnauthorizedApp`
      * `InvalidRequest`
      * `UrlParametersVerificationError`
      * `MissingRequiredJsonBody`
      * `InvalidJsonBody`
      * `UnauthorizedRequest`
    * `endpoint`: The different available endpoints (e.g.: /example/endpoint)
    * `httpMethod`: The HTTP Method (GET, POST, PUT, etc.)
* HttpStatusCode: Counts the requests per different status codes.
  * Tags:
    * `statusRange`:
      * `200x`
      * `300x`
      * `400x`
      * `500x`
    * `endpoint`: The different available endpoints (e.g.: /example/endpoint)
    * `httpMethod`: The HTTP Method (GET, POST, PUT, etc.)
* RequestTime: The time (in milliseconds) of non-rejected requests.
  * Tags:
    * `unit`:
      * `ms`
    * `endpoint`: The different available endpoints (e.g.: /example/endpoint)
    * `httpMethod`: The HTTP Method (GET, POST, PUT, etc.) 
