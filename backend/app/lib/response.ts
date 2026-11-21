import { NextResponse } from "next/server";
import { ApiErrorResponse, StandardSuccessResponse } from "@/app/types/v1/api";

const DEFAULT_ERROR_LABELS: Record<number, string> = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  503: "Service Unavailable",
};

export function jsonSuccess<T extends StandardSuccessResponse | Record<string, unknown>>(
  data: T,
  status = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function jsonError(
  message: string,
  statusCode = 400,
  error?: string,
  extra?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  const resolvedError =
    error ?? DEFAULT_ERROR_LABELS[statusCode] ?? (statusCode >= 500 ? "Internal Server Error" : "Bad Request");

  const body: ApiErrorResponse & Record<string, unknown> = {
    ...(extra ?? {}),
    success: false,
    error: resolvedError,
    message,
    statusCode,
  };
  return NextResponse.json(body, { status: statusCode });
}
