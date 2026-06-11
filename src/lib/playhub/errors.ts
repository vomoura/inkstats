/**
 * Typed errors for PlayHub API interactions.
 * The PlayHub API is unofficial and may change without notice.
 */

export class PlayHubError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "PlayHubError";
  }
}

export class PlayHubNetworkError extends PlayHubError {
  constructor(operation: string, cause?: unknown) {
    super(
      `Network error during ${operation}. The PlayHub API may be unavailable.`,
      operation,
      cause
    );
    this.name = "PlayHubNetworkError";
  }
}

export class PlayHubValidationError extends PlayHubError {
  constructor(operation: string, details: string) {
    super(
      `Unexpected response shape from PlayHub during ${operation}: ${details}`,
      operation
    );
    this.name = "PlayHubValidationError";
  }
}

export class PlayHubNotFoundError extends PlayHubError {
  constructor(entity: string, id: string | number) {
    super(
      `${entity} with id "${id}" not found on PlayHub`,
      "fetch"
    );
    this.name = "PlayHubNotFoundError";
  }
}
