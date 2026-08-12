import { randomUUID } from 'crypto';
import { GroqConnectionStatus, GroqDiagnosticState, GroqModelDiagnostic } from '../src/types.js';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const SUCCESS_CACHE_TTL_MS = 5 * 60 * 1000;
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

export function getGroqModels() {
  const primaryEvaluatorModel = process.env.GROQ_PRIMARY_MODEL || 'openai/gpt-oss-120b';
  return {
    tutorModel: process.env.GROQ_TUTOR_MODEL || primaryEvaluatorModel,
    primaryEvaluatorModel,
    secondaryEvaluatorModel: process.env.GROQ_SECONDARY_MODEL || 'openai/gpt-oss-20b',
    searchModel: process.env.GROQ_SEARCH_MODEL || 'groq/compound-mini',
    // Backward-compatible names used by existing evaluation and UI code.
    primaryModel: primaryEvaluatorModel,
    secondaryModel: process.env.GROQ_SECONDARY_MODEL || 'openai/gpt-oss-20b',
  };
}

export interface GroqUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export class GroqRequestError extends Error {
  readonly state: GroqDiagnosticState;
  readonly status?: number;
  readonly requestId: string;
  readonly model?: string;
  readonly retryable: boolean;

  constructor(input: {
    message: string;
    state: GroqDiagnosticState;
    requestId: string;
    status?: number;
    model?: string;
    retryable?: boolean;
  }) {
    super(input.message);
    this.name = 'GroqRequestError';
    this.state = input.state;
    this.status = input.status;
    this.requestId = input.requestId;
    this.model = input.model;
    this.retryable = input.retryable ?? false;
  }
}

function hasConfiguredKey() {
  const key = process.env.GROQ_API_KEY?.trim();
  return Boolean(key && key !== 'MY_GROQ_API_KEY');
}

function getApiKey(requestId: string, model?: string) {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key || key === 'MY_GROQ_API_KEY') {
    throw new GroqRequestError({
      message: 'Groq secret is not configured on the server.',
      state: 'not_configured',
      requestId,
      model,
    });
  }
  return key;
}

export function mapGroqStatus(status: number): GroqDiagnosticState {
  if (status === 400) return 'invalid_request';
  if (status === 401 || status === 403) return 'invalid_credentials';
  if (status === 404) return 'model_unavailable';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'provider_unavailable';
  return 'error';
}

export function safeGroqMessage(state: GroqDiagnosticState) {
  const messages: Record<GroqDiagnosticState, string> = {
    connected: 'Groq connection verified successfully.',
    not_configured: 'Add GROQ_API_KEY in Google AI Studio Settings → Secrets, then restart or redeploy the app.',
    invalid_request: 'The Groq request format was rejected. Check the configured model and structured-output schema.',
    invalid_credentials: 'Groq rejected the server credential. Rotate the key and update the secret.',
    model_unavailable: 'A configured model is not available to this Groq project.',
    rate_limited: 'Groq rate limit reached. Wait briefly and retry.',
    timeout: 'Groq did not respond before the timeout.',
    provider_unavailable: 'Groq is temporarily unavailable. Retry shortly.',
    invalid_response: 'Groq returned a response that did not match the required format.',
    error: 'The Groq request could not be completed.',
  };
  return messages[state];
}

function logSafeFailure(error: GroqRequestError) {
  console.error('[Groq]', {
    requestId: error.requestId,
    model: error.model,
    state: error.state,
    status: error.status,
    retryable: error.retryable,
  });
}

function boundedTimeout(requested?: number) {
  const configured = Number.parseInt(
    process.env.ARTHA_REQUEST_TIMEOUT_MS || process.env.FINTRUST_REQUEST_TIMEOUT_MS || '45000',
    10,
  );
  const safeConfigured = Number.isFinite(configured) ? configured : 45000;
  return Math.max(1000, Math.min(requested ?? safeConfigured, 45000));
}

function waitWithJitter(attempt: number) {
  const delayMs = Math.min(4000, 500 * 2 ** attempt) + Math.floor(Math.random() * 250);
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export interface GroqJsonSchema {
  name: string;
  schema: Record<string, unknown>;
}

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CallGroqChatOptions {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  responseFormatJson?: boolean;
  responseSchema?: GroqJsonSchema;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface GroqChatResult {
  text: string;
  latencyMs: number;
  requestId: string;
  usage: GroqUsage;
}

export async function callGroqChat(options: CallGroqChatOptions): Promise<GroqChatResult> {
  const requestId = `req_${randomUUID()}`;
  const apiKey = getApiKey(requestId, options.model);
  const timeoutMs = boundedTimeout(options.timeoutMs);
  const maxRetries = Math.max(0, Math.min(options.maxRetries ?? 2, 2));
  const startTime = Date.now();
  let lastError: GroqRequestError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const elapsedMs = Date.now() - startTime;
    const remainingMs = timeoutMs - elapsedMs;
    if (remainingMs <= 0) {
      throw new GroqRequestError({
        message: safeGroqMessage('timeout'),
        state: 'timeout',
        requestId,
        model: options.model,
      });
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remainingMs);

    try {
      const messages: GroqMessage[] = [
        { role: 'system', content: options.systemPrompt },
        ...(options.history || []),
        { role: 'user', content: options.userPrompt },
      ];
      const payload: Record<string, unknown> = {
        model: options.model,
        messages,
        stream: false,
        temperature: options.temperature ?? 0.1,
        max_tokens: Math.max(1, Math.min(options.maxTokens ?? 3500, 6000)),
      };

      if (options.responseSchema) {
        payload.response_format = {
          type: 'json_schema',
          json_schema: {
            name: options.responseSchema.name,
            strict: true,
            schema: options.responseSchema.schema,
          },
        };
      } else if (options.responseFormatJson) {
        payload.response_format = { type: 'json_object' };
      }

      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Client-Request-Id': requestId,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        const state = mapGroqStatus(response.status);
        const error = new GroqRequestError({
          message: safeGroqMessage(state),
          state,
          status: response.status,
          requestId: response.headers.get('x-request-id') || requestId,
          model: options.model,
          retryable: RETRYABLE_STATUSES.has(response.status),
        });
        if (!error.retryable || attempt === maxRetries) {
          logSafeFailure(error);
          throw error;
        }
        lastError = error;
      } else {
        const data = (await response.json()) as any;
        const text = data?.choices?.[0]?.message?.content;
        if (typeof text !== 'string' || text.trim() === '') {
          throw new GroqRequestError({
            message: safeGroqMessage('invalid_response'),
            state: 'invalid_response',
            status: response.status,
            requestId: response.headers.get('x-request-id') || requestId,
            model: options.model,
          });
        }
        return {
          text,
          latencyMs: Date.now() - startTime,
          requestId: response.headers.get('x-request-id') || requestId,
          usage: {
            promptTokens: Number(data?.usage?.prompt_tokens || 0),
            completionTokens: Number(data?.usage?.completion_tokens || 0),
            totalTokens: Number(data?.usage?.total_tokens || 0),
          },
        };
      }
    } catch (caught: any) {
      clearTimeout(timer);
      if (caught instanceof GroqRequestError) {
        if (!caught.retryable || attempt === maxRetries) throw caught;
        lastError = caught;
      } else {
        const isTimeout = caught?.name === 'AbortError';
        const error = new GroqRequestError({
          message: safeGroqMessage(isTimeout ? 'timeout' : 'provider_unavailable'),
          state: isTimeout ? 'timeout' : 'provider_unavailable',
          requestId,
          model: options.model,
          retryable: false,
        });
        logSafeFailure(error);
        throw error;
      }
    }

    if (attempt < maxRetries) {
      const retryStartedAt = Date.now();
      await waitWithJitter(attempt);
      if (retryStartedAt - startTime >= timeoutMs || Date.now() - startTime >= timeoutMs) {
        throw new GroqRequestError({
          message: safeGroqMessage('timeout'),
          state: 'timeout',
          requestId,
          model: options.model,
        });
      }
    }
  }

  throw lastError || new GroqRequestError({
    message: safeGroqMessage('error'),
    state: 'error',
    requestId,
    model: options.model,
  });
}

let cachedVerificationStatus: { status: GroqConnectionStatus; timestamp: number } | null = null;

export function resetGroqVerificationCache() {
  cachedVerificationStatus = null;
}

function statusToHttp(state: GroqDiagnosticState) {
  if (state === 'not_configured' || state === 'rate_limited' || state === 'provider_unavailable') return 503;
  if (state === 'timeout') return 504;
  if (state === 'connected') return 200;
  return 502;
}

function modelDiagnostic(role: GroqModelDiagnostic['role'], model: string, state: GroqDiagnosticState, latencyMs?: number): GroqModelDiagnostic {
  return {
    role,
    model,
    state,
    verified: state === 'connected',
    latencyMs,
    message: safeGroqMessage(state),
  };
}

export async function verifyGroqConnection(forceFresh = false): Promise<GroqConnectionStatus> {
  const models = getGroqModels();
  const base = {
    primaryModel: models.primaryEvaluatorModel,
    secondaryModel: models.secondaryEvaluatorModel,
    tutorModel: models.tutorModel,
    primaryEvaluatorModel: models.primaryEvaluatorModel,
    secondaryEvaluatorModel: models.secondaryEvaluatorModel,
    searchModel: models.searchModel,
    models: {
      tutor: models.tutorModel,
      primaryEvaluator: models.primaryEvaluatorModel,
      secondaryEvaluator: models.secondaryEvaluatorModel,
      search: models.searchModel,
    },
  };

  if (!hasConfiguredKey()) {
    return {
      ...base,
      success: false,
      configured: false,
      verified: false,
      state: 'not_configured',
      httpStatus: 503,
      message: safeGroqMessage('not_configured'),
      components: [],
    };
  }

  if (!forceFresh && cachedVerificationStatus && Date.now() - cachedVerificationStatus.timestamp < SUCCESS_CACHE_TTL_MS) {
    return cachedVerificationStatus.status;
  }

  const startedAt = Date.now();
  const requestId = `req_${randomUUID()}`;
  const apiKey = getApiKey(requestId);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${GROQ_BASE_URL}/models`, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!response.ok) {
      const state = mapGroqStatus(response.status);
      return {
        ...base,
        success: false,
        configured: true,
        verified: false,
        state,
        httpStatus: statusToHttp(state),
        message: safeGroqMessage(state),
        requestId: response.headers.get('x-request-id') || requestId,
        components: [],
      };
    }

    const data = (await response.json()) as any;
    const available = new Set<string>((data?.data || []).map((item: any) => String(item?.id || '')));
    const required: Array<[GroqModelDiagnostic['role'], string]> = [
      ['tutor', models.tutorModel],
      ['primary', models.primaryEvaluatorModel],
      ['secondary', models.secondaryEvaluatorModel],
      ['search', models.searchModel],
    ];
    const missing = required.filter(([, model]) => !available.has(model));
    if (missing.length > 0) {
      const components = required.map(([role, model]) => modelDiagnostic(role, model, available.has(model) ? 'connected' : 'model_unavailable'));
      return {
        ...base,
        success: false,
        configured: true,
        verified: false,
        state: 'model_unavailable',
        httpStatus: 502,
        message: `Configured model unavailable: ${missing.map(([, model]) => model).join(', ')}.`,
        requestId,
        components,
      };
    }

    const checks = await Promise.allSettled([
      callGroqChat({
        model: models.primaryEvaluatorModel,
        systemPrompt: 'You are a connection test. Reply only with OK.',
        userPrompt: 'OK',
        temperature: 0,
        // GPT-OSS reasoning can consume a very small budget before emitting
        // visible text. Leave enough room for the probe's final "OK" token.
        maxTokens: 128,
        timeoutMs: 10000,
        maxRetries: 0,
      }),
      callGroqChat({
        model: models.secondaryEvaluatorModel,
        systemPrompt: 'You are a connection test. Reply only with OK.',
        userPrompt: 'OK',
        temperature: 0,
        maxTokens: 128,
        timeoutMs: 10000,
        maxRetries: 0,
      }),
    ]);
    const primaryState: GroqDiagnosticState = checks[0].status === 'fulfilled' ? 'connected' : diagnosticStateFromUnknown(checks[0].reason);
    const secondaryState: GroqDiagnosticState = checks[1].status === 'fulfilled' ? 'connected' : diagnosticStateFromUnknown(checks[1].reason);
    const components: GroqModelDiagnostic[] = [
      modelDiagnostic('tutor', models.tutorModel, primaryState, checks[0].status === 'fulfilled' ? checks[0].value.latencyMs : undefined),
      modelDiagnostic('primary', models.primaryEvaluatorModel, primaryState, checks[0].status === 'fulfilled' ? checks[0].value.latencyMs : undefined),
      modelDiagnostic('secondary', models.secondaryEvaluatorModel, secondaryState, checks[1].status === 'fulfilled' ? checks[1].value.latencyMs : undefined),
      modelDiagnostic('search', models.searchModel, 'connected'),
    ];
    const failedComponent = components.find((component) => !component.verified);
    if (failedComponent) {
      return {
        ...base,
        success: false,
        configured: true,
        verified: false,
        state: failedComponent.state,
        httpStatus: statusToHttp(failedComponent.state),
        message: failedComponent.message,
        requestId,
        latencyMs: Date.now() - startedAt,
        components,
      };
    }

    const verifiedAt = new Date().toISOString();
    const success: GroqConnectionStatus = {
      ...base,
      success: true,
      configured: true,
      verified: true,
      state: 'connected',
      httpStatus: 200,
      message: safeGroqMessage('connected'),
      latencyMs: Date.now() - startedAt,
      verifiedAt,
      components,
    };
    cachedVerificationStatus = { status: success, timestamp: Date.now() };
    return success;
  } catch (caught: any) {
    clearTimeout(timer);
    const state: GroqDiagnosticState = caught?.name === 'AbortError' ? 'timeout' : diagnosticStateFromUnknown(caught);
    return {
      ...base,
      success: false,
      configured: true,
      verified: false,
      state,
      httpStatus: statusToHttp(state),
      message: safeGroqMessage(state),
      requestId: caught instanceof GroqRequestError ? caught.requestId : requestId,
      latencyMs: Date.now() - startedAt,
      components: [],
    };
  }
}

export function diagnosticStateFromUnknown(error: unknown): GroqDiagnosticState {
  if (error instanceof GroqRequestError) return error.state;
  if ((error as any)?.name === 'AbortError') return 'timeout';
  return 'error';
}
