import { NextResponse } from "next/server";
import { jsonError } from "@/app/lib/response";

export type ParsedJsonResult<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly response: NextResponse };

/**
 * Safely parses a JSON request body and returns a standardized 400 response on malformed JSON.
 */
export async function parseJsonBody<T>(
  request: Request,
  errorMessage = "Invalid request body"
): Promise<ParsedJsonResult<T>> {
  try {
    const data = (await request.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, response: jsonError(errorMessage, 400) };
  }
}

/**
 * Parses an optional JSON body: empty bodies return `{ ok: true, data: undefined }`,
 * while malformed non-empty JSON returns a standardized 400 response.
 */
export async function parseOptionalJsonBody<T>(
  request: Request,
  errorMessage = "Invalid JSON request body"
): Promise<ParsedJsonResult<T | undefined>> {
  try {
    const raw = await request.text();
    if (!raw.trim()) {
      return { ok: true, data: undefined };
    }
    const data = JSON.parse(raw) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, response: jsonError(errorMessage, 400) };
  }
}
