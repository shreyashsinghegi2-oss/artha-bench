import assert from 'node:assert/strict';
import test from 'node:test';
import { EvidenceService } from '../server/evidenceService';

const originalKey = process.env.GROQ_API_KEY;
const originalFetch = globalThis.fetch;

test.afterEach(() => {
  if (originalKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = originalKey;
  globalThis.fetch = originalFetch;
});

test('evidence service keeps only reachable URLs on allow-listed official domains', async () => {
  process.env.GROQ_API_KEY = 'unit-test-secret-value';
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.startsWith('https://api.groq.com/')) {
      const content = JSON.stringify({
        summary: 'Official guidance was located.',
        regulatoryVerified: true,
        sources: [
          {
            title: 'Reachable guidance',
            url: 'https://www.rbi.org.in/guidance',
            snippet: 'Official guidance.',
            authorityDomain: 'rbi.org.in',
          },
          {
            title: 'Invented path',
            url: 'https://www.sebi.gov.in/not-a-real-page',
            snippet: 'Unverified content.',
            authorityDomain: 'sebi.gov.in',
          },
          {
            title: 'Disallowed source',
            url: 'https://example.com/not-official',
            snippet: 'Not official.',
            authorityDomain: 'example.com',
          },
        ],
      });
      return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response('', { status: url.includes('/guidance') ? 200 : 404 });
  };

  const evidence = await EvidenceService.researchEvidence('IN', 'regulation', 'What is the current rule?');
  assert.equal(evidence.regulatoryVerified, true);
  assert.equal(evidence.sources.length, 1);
  assert.equal(evidence.sources[0].url, 'https://www.rbi.org.in/guidance');
});
