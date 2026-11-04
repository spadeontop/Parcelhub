import { NextResponse } from "next/server";
import { ApiErrorResponse, StandardSuccessResponse } from "@/app/types/api";

export function jsonSuccess<T extends StandardSuccessResponse | Record<string, unknown>>(
  data: T,
  status = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function jsonError(
  message: string,
  statusCode = 400,
  error = "Bad Request"
): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = {
    success: false,
    error,
    message,
    statusCode,
  };
  return NextResponse.json(body, { status: statusCode });
}
