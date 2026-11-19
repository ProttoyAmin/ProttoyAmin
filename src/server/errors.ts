/**
 * Typed application errors. Server-only.
 */

export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "unauthorized");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You are not allowed to do that") {
    super(message, 403, "forbidden");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "not_found");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super(message, 422, "validation_error");
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests, please slow down") {
    super(message, 429, "rate_limited");
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
