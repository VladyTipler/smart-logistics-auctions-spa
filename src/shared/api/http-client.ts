import { ApiError } from "./api-error";

interface HttpClientOptions {
  baseUrl: string;
}

export interface HttpClient {
  get<TResponse>(path: string): Promise<TResponse>;
  post<TResponse, TBody = undefined>(
    path: string,
    body?: TBody,
  ): Promise<TResponse>;
}

const ACCEPT_HEADER = "application/json, application/problem+json";

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function isJsonMediaType(contentType: string): boolean {
  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase() ?? "";

  return (
    mediaType === "application/json" ||
    /^[^/\s]+\/[^/\s]+\+json$/.test(mediaType)
  );
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const body = await response.text();

  if (body.length === 0) {
    return undefined;
  }

  if (isJsonMediaType(response.headers.get("content-type") ?? "")) {
    try {
      return JSON.parse(body) as unknown;
    } catch (error) {
      if (response.ok) {
        throw error;
      }

      return body;
    }
  }

  return body;
}

export function createHttpClient(options: HttpClientOptions): HttpClient {
  async function request<TResponse, TBody = undefined>(
    method: "GET" | "POST",
    path: string,
    body?: TBody,
  ): Promise<TResponse> {
    const hasBody = body !== undefined;
    const headers = new Headers({
      Accept: ACCEPT_HEADER,
    });

    if (hasBody) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(joinUrl(options.baseUrl, path), {
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
    });
    const parsedBody = await parseResponseBody(response);

    if (!response.ok) {
      throw new ApiError(response.status, parsedBody);
    }

    return parsedBody as TResponse;
  }

  return {
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, body),
  };
}
