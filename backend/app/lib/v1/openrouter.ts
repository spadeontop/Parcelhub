const OPENROUTER_RESPONSES_URL = "https://openrouter.ai/api/v1/responses";
const DEFAULT_TIMEOUT_MS = 8_000; // Fits within Vercel Hobby 10s limit; override via OPENROUTER_TIMEOUT_MS

function resolveTimeoutMs(explicitTimeoutMs?: number): number {
  if (typeof explicitTimeoutMs === "number" && explicitTimeoutMs > 0) {
    return explicitTimeoutMs;
  }
  const envVal = process.env.OPENROUTER_TIMEOUT_MS?.trim();
  const parsed = envVal ? parseInt(envVal, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
}

export type OpenRouterJsonSchemaFormat = {
  readonly type: "json_schema";
  readonly name: string;
  readonly strict: boolean;
  readonly schema: Record<string, unknown>;
};

export type OpenRouterProviderConfig = {
  readonly only?: readonly string[];
  readonly allow_fallbacks?: boolean;
  readonly require_parameters?: boolean;
};

export type OpenRouterReasoningEffort =
  | "max"
  | "xhigh"
  | "high"
  | "medium"
  | "low"
  | "minimal"
  | "none";

export type OpenRouterReasoningConfig = {
  readonly enabled?: boolean;
  readonly effort?: OpenRouterReasoningEffort;
};

export type OpenRouterImageRequest = {
  readonly model: string;
  readonly prompt: string;
  readonly imageUrl: string;
  readonly detail?: "auto" | "low" | "high";
  readonly format?: OpenRouterJsonSchemaFormat;
  readonly provider?: OpenRouterProviderConfig;
  readonly reasoning?: OpenRouterReasoningConfig;
  readonly temperature?: number;
  readonly timeoutMs?: number;
};

export type OpenRouterUsage = {
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly totalTokens: number | null;
  readonly cost?: number | null;
};

export type OpenRouterCallResult =
  | {
      readonly ok: true;
      readonly model: string;
      readonly provider?: string;
      readonly usage?: OpenRouterUsage;
      readonly text: string;
    }
  | {
      readonly ok: false;
      readonly error: string;
      readonly status?: number;
    };

type OpenRouterResponsePayload = {
  model?: string;
  provider?: string;
  status?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
    cost?: number;
  } | null;
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
        role: "system",
        content: [{ type: "input_text", text: req.prompt }],
      },
      {
        role: "user",
        content: [
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
  if (req.provider) {
    body.provider = req.provider;
  }
  if (req.reasoning) {
    body.reasoning = req.reasoning;
  }
  if (typeof req.temperature === "number") {
    body.temperature = req.temperature;
  }

  let response: Response;
  try {
    response = await fetch(OPENROUTER_RESPONSES_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(resolveTimeoutMs(req.timeoutMs)),
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

  const inputTokens = data.usage?.input_tokens ?? data.usage?.prompt_tokens ?? null;
  const outputTokens = data.usage?.output_tokens ?? data.usage?.completion_tokens ?? null;
  const totalTokens =
    data.usage?.total_tokens ??
    (inputTokens !== null && outputTokens !== null ? inputTokens + outputTokens : null);

  return {
    ok: true,
    model: data.model ?? req.model,
    provider: data.provider,
    usage: data.usage
      ? {
          inputTokens,
          outputTokens,
          totalTokens,
          cost: data.usage.cost ?? null,
        }
      : undefined,
    text: outputText,
  };
}
