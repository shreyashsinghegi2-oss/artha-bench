import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mapGroqStatus,
  resetGroqVerificationCache,
  verifyGroqConnection,
} from '../server/groqClient';

const originalKey = process.env.GROQ_API_KEY;
const originalFetch = globalThis.fetch;

function modelList(excluded?: string) {
  const ids = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'groq/compound-mini'].filter((id) => id !== excluded);
  return new Response(JSON.stringify({ data: ids.map((id) => ({ id })) }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

test.afterEach(() => {
  if (originalKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = originalKey;
  globalThis.fetch = originalFetch;
  resetGroqVerificationCache();
});

test('missing secret returns 503 not_configured without a secret value', async () => {
  delete process.env.GROQ_API_KEY;
  const result = await verifyGroqConnection(true);
  assert.equal(result.httpStatus, 503);
  assert.equal(result.state, 'not_configured');
  assert.equal(result.configured, false);
  assert.doesNotMatch(JSON.stringify(result), /Authorization|Bearer/);
});

test('invalid credential is safely mapped', async () => {
  process.env.GROQ_API_KEY = 'unit-test-secret-value';
  globalThis.fetch = async () => new Response('{}', { status: 401 });
  const result = await verifyGroqConnection(true);
  assert.equal(result.httpStatus, 502);
  assert.equal(result.state, 'invalid_credentials');
  assert.doesNotMatch(JSON.stringify(result), /unit-test-secret-value/);
});

test('successful model list plus evaluator chat checks verifies the provider', async () => {
  process.env.GROQ_API_KEY = 'unit-test-secret-value';
  let calls = 0;
  globalThis.fetch = async (input) => {
    calls += 1;
    const url = String(input);
    if (url.endsWith('/models')) return modelList();
    return new Response(JSON.stringify({
      choices: [{ message: { content: 'OK' } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const result = await verifyGroqConnection(true);
  assert.equal(result.verified, true);
  assert.equal(result.state, 'connected');
  assert.equal(result.components?.filter((item) => item.verified).length, 4);
  assert.equal(calls, 3);
});

test('missing primary model is reported without running chat checks', async () => {
  process.env.GROQ_API_KEY = 'unit-test-secret-value';
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return modelList('openai/gpt-oss-120b');
  };
  const result = await verifyGroqConnection(true);
  assert.equal(result.state, 'model_unavailable');
  assert.equal(result.components?.find((item) => item.role === 'primary')?.verified, false);
  assert.equal(calls, 1);
});

test('rate limit and provider errors have stable safe states', () => {
  assert.equal(mapGroqStatus(400), 'invalid_request');
  assert.equal(mapGroqStatus(403), 'invalid_credentials');
  assert.equal(mapGroqStatus(404), 'model_unavailable');
  assert.equal(mapGroqStatus(429), 'rate_limited');
  assert.equal(mapGroqStatus(503), 'provider_unavailable');
});
