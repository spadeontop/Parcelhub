const OPENROUTER_RESPONSES_URL = "https://openrouter.ai/api/v1/responses";
const DEFAULT_TIMEOUT_MS = 20_000;

export type OpenRouterJsonSchemaFormat = {
  readonly type: "json_schema";
  readonly name: string;
  readonly strict: boolean;
  readonly schema: Record<string, unknown>;
};

export type OpenRouterImageRequest = {
  readonly model: string;
  readonly prompt: string;
  readonly imageUrl: string;
  readonly detail?: "auto" | "low" | "high";
  readonly format?: OpenRouterJsonSchemaFormat;
  readonly timeoutMs?: number;
};

export type OpenRouterCallResult =
  | {
      readonly ok: true;
      readonly model: string;
      readonly text: string;
    }
  | {
      readonly ok: false;
      readonly error: string;
      readonly status?: number;
    };

type OpenRouterResponsePayload = {
  model?: string;
  status?: string;
  error?: { message?: string } | null;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

/**
 * Ensures imageUrl is either an http(s) URL or a data URI before sending to OpenRouter.
 */
function normalizeImageInput(imageUrl: string): string {
  const trimmed = imageUrl.trim();
  if (/^(https?:\/\/|data:image\/)/i.test(trimmed)) {
    return trimmed;
  }
  return `data:image/jpeg;base64,${trimmed.replace(/\s+/g, "")}`;
}

/**
 * Bare HTTP call to OpenRouter's `/api/v1/responses` endpoint with an image + text prompt.
 */
export async function callOpenRouterWithImage(
  req: OpenRouterImageRequest
): Promise<OpenRouterCallResult> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      error: "OPENROUTER_API_KEY is not configured",
    };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  if (process.env.OPENROUTER_SITE_URL) {
    headers["HTTP-Referer"] = process.env.OPENROUTER_SITE_URL;
  }
  if (process.env.OPENROUTER_SITE_NAME) {
    headers["X-OpenRouter-Title"] = process.env.OPENROUTER_SITE_NAME;
  }

  const body: Record<string, unknown> = {
    model: req.model,
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: req.prompt },
          {
            type: "input_image",
            imageUrl: normalizeImageInput(req.imageUrl),
            detail: req.detail ?? "auto",
          },
        ],
      },
    ],
  };

  if (req.format) {
    body.text = { format: req.format };
  }

  let response: Response;
  try {
    response = await fetch(OPENROUTER_RESPONSES_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(req.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "OpenRouter request failed",
    };
  }

  let data: OpenRouterResponsePayload;
  try {
    data = (await response.json()) as OpenRouterResponsePayload;
  } catch {
    return {
      ok: false,
      status: response.status,
      error: `Invalid JSON response from OpenRouter (HTTP ${response.status})`,
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: data.error?.message ?? `OpenRouter returned HTTP ${response.status}`,
    };
  }

  if (data.status !== "completed") {
    return {
      ok: false,
      status: response.status,
      error: data.error?.message ?? `OpenRouter response ended with status: ${data.status ?? "unknown"}`,
    };
  }

  const message = data.output?.find((item) => item.type === "message");
  const outputText = message?.content?.find((part) => part.type === "output_text")?.text;

  if (!outputText) {
    return {
      ok: false,
      status: response.status,
      error: "OpenRouter response did not contain output_text",
    };
  }

  return {
    ok: true,
    model: data.model ?? req.model,
    text: outputText,
  };
}
