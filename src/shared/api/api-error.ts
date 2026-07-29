import type { ProblemDetail, ValidationProblem } from "./contracts";

type ApiProblem = ProblemDetail | ValidationProblem | unknown;

function getProblemMessage(problem: ApiProblem, status: number): string {
  if (
    typeof problem === "object" &&
    problem !== null &&
    "message" in problem &&
    typeof problem.message === "string"
  ) {
    return problem.message;
  }

  return `API request failed with status ${status}`;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ApiProblem;

  constructor(status: number, problem: ApiProblem) {
    super(getProblemMessage(problem, status));
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }
}
