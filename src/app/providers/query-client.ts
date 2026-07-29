import { QueryClient } from "@tanstack/react-query";

type StatusError = {
  status?: unknown;
  response?: {
    status?: unknown;
  };
};

function readErrorStatus(error: unknown) {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const statusError = error as StatusError;
  const status = statusError.status ?? statusError.response?.status;

  return typeof status === "number" ? status : undefined;
}

export function shouldRetryQuery(failureCount: number, error: unknown) {
  const status = readErrorStatus(error);

  if (status !== undefined) {
    return status === 503 && failureCount < 1;
  }

  return error instanceof TypeError && failureCount < 1;
}

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
      },
    },
  });
}

export const appQueryClient = createAppQueryClient();
