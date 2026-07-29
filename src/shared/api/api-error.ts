import type { ProblemDetail, ValidationProblem } from "./contracts";

export type ApiProblem = ProblemDetail | ValidationProblem;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasOptionalNullableString(
  value: Record<string, unknown>,
  key: string,
): boolean {
  return (
    !(key in value) ||
    value[key] === null ||
    typeof value[key] === "string"
  );
}

function isValidationError(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.field === "string" &&
    typeof value.message === "string" &&
    hasOptionalNullableString(value, "code")
  );
}

function isApiProblem(value: unknown): value is ApiProblem {
  if (
    !isRecord(value) ||
    typeof value.code !== "string" ||
    typeof value.title !== "string" ||
    typeof value.message !== "string" ||
    !hasOptionalNullableString(value, "trace_id")
  ) {
    return false;
  }

  if (value.code === "validation_failed") {
    return Array.isArray(value.errors) && value.errors.every(isValidationError);
  }

  return true;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ApiProblem | undefined;
  readonly payload: unknown;

  constructor(status: number, payload: unknown) {
    const problem = isApiProblem(payload) ? payload : undefined;

    super(problem?.message ?? `API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.problem = problem;
  }
}
