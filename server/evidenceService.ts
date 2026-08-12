import { CountryCode, EvidenceResearchResult, EvidenceSource } from '../src/types.js';
import { callGroqChat, getGroqModels, GroqRequestError } from './groqClient.js';

export const OFFICIAL_DOMAINS_BY_COUNTRY: Record<string, string[]> = {
  IN: ['rbi.org.in', 'sebi.gov.in', 'incometax.gov.in', 'irdai.gov.in', 'pfrda.org.in', 'npci.org.in'],
  US: ['sec.gov', 'investor.gov', 'irs.gov', 'consumerfinance.gov', 'finra.org'],
  UK: ['gov.uk', 'fca.org.uk', 'moneyhelper.org.uk'],
  EU: ['europa.eu', 'esma.europa.eu', 'ecb.europa.eu'],
  CA: ['canada.ca', 'cra-arc.gc.ca', 'osfi-bsif.gc.ca'],
  AU: ['ato.gov.au', 'asic.gov.au', 'moneysmart.gov.au'],
  SG: ['mas.gov.sg', 'iras.gov.sg', 'cpf.gov.sg'],
  JP: ['fsa.go.jp', 'nta.go.jp', 'boj.or.jp'],
  GLOBAL: ['worldbank.org', 'imf.org', 'oecd.org', 'bis.org'],
};

export function getOfficialDomains(country: CountryCode) {
  return OFFICIAL_DOMAINS_BY_COUNTRY[country] || OFFICIAL_DOMAINS_BY_COUNTRY.GLOBAL;
}

function isAllowedOfficialUrl(rawUrl: string, domains: string[]) {
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:' && domains.some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function isKnownErrorPageUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const target = `${url.pathname}${url.search}`.toLowerCase();
    return /(?:^|\/)(?:error|404|not[-_]?found)(?:[./?_-]|$)/.test(target)
      || target.includes('aspxerrorpath=');
  } catch {
    return true;
  }
}

async function isReachableOfficialUrl(rawUrl: string, domains: string[]) {
  if (!isAllowedOfficialUrl(rawUrl, domains) || isKnownErrorPageUrl(rawUrl)) return false;

  let currentUrl = rawUrl;
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      let response = await fetch(currentUrl, {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': 'Artha-Bench/2.0 official-source-verifier' },
      });

      // A small ranged GET covers official sites that do not implement HEAD.
      if (response.status === 405) {
        await response.body?.cancel();
        response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'Range': 'bytes=0-0',
            'User-Agent': 'Artha-Bench/2.0 official-source-verifier',
          },
        });
      }

      const status = response.status;
      const location = response.headers.get('location');
      await response.body?.cancel();
      if (status >= 200 && status < 300) return !isKnownErrorPageUrl(currentUrl);
      if (status >= 300 && status < 400 && location) {
        const nextUrl = new URL(location, currentUrl).toString();
        if (!isAllowedOfficialUrl(nextUrl, domains) || isKnownErrorPageUrl(nextUrl)) return false;
        currentUrl = nextUrl;
        continue;
      }
      return false;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }
  return false;
}

export class EvidenceService {
  /**
   * Check if the topic/question requires authoritative regulatory/tax research
   */
  static isTimeSensitiveOrRegulatory(question: string, topic: string): boolean {
    const qLower = question.toLowerCase();
    const tLower = topic.toLowerCase();
    const keywords = [
      'tax',
      'taxation',
      'rate',
      'limit',
      'cap',
      'deduction',
      'exemption',
      'rbi',
      'sebi',
      'irs',
      'fca',
      'sec',
      'regulation',
      'law',
      'current',
      'latest',
      'today',
      '2024',
      '2025',
      '2026',
      'pension',
      'insurance rule',
      'fd rate',
      'repo rate',
    ];
    return keywords.some((k) => qLower.includes(k) || tLower.includes(k));
  }

  /**
   * Perform domain-restricted evidence search via Groq search model or authoritative synthesis
   */
  static async researchEvidence(
    country: CountryCode,
    topic: string,
    question: string
  ): Promise<EvidenceResearchResult> {
    const domains = getOfficialDomains(country);
    const searchModel = getGroqModels().searchModel;

    const systemPrompt = `You are Artha Bench Evidence Service.
Your task is to identify key statutory rules, official tax provisions, and regulatory thresholds relevant to the query for country ${country}.
Domains permitted: ${domains.join(', ')}.
Do not include user personal financial details.
Return ONLY a structured JSON object:
{
  "summary": "Brief summary of authoritative rules or official rates",
  "regulatoryVerified": true,
  "sources": [
    {
      "title": "Title of official publication or statutory circular",
      "url": "https://<authority-domain>/...",
      "snippet": "Key excerpt detailing the exact rate, limit, or rule",
      "authorityDomain": "domain.gov",
      "effectiveDate": "2025/2026"
    }
  ]
}`;

    const userPrompt = `Country: ${country}\nTopic: ${topic}\nQuestion: ${question}\nRequired domains: ${domains.join(', ')}`;

    try {
      const requestSearch = (useJsonMode: boolean) => callGroqChat({
        model: searchModel,
        systemPrompt,
        userPrompt,
        responseFormatJson: useJsonMode,
        temperature: 0.1,
        maxTokens: 2200,
      });
      let result;
      try {
        result = await requestSearch(true);
      } catch (error) {
        // Compound models can vary in JSON-mode support. The prompt still requires JSON.
        if (error instanceof GroqRequestError && error.state === 'invalid_request') result = await requestSearch(false);
        else throw error;
      }
      const { text } = result;

      let parsed: any = {};
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        // Fallback if raw JSON formatting issue
      }

      const candidates: EvidenceSource[] = (Array.isArray(parsed.sources) ? parsed.sources : [])
        .filter((s: any) => isAllowedOfficialUrl(String(s?.url || '').trim(), domains))
        .map((s: any) => ({
          title: String(s.title || 'Official Government / Regulatory Guidance'),
          url: String(s.url).trim(),
          snippet: String(s.snippet || 'Official regulatory publication returned by the evidence model.'),
          authorityDomain: new URL(String(s.url).trim()).hostname,
          retrievedAt: new Date().toISOString(),
          effectiveDate: s.effectiveDate ? String(s.effectiveDate) : undefined,
        }));
      const reachability = await Promise.all(
        candidates.map((source) => isReachableOfficialUrl(source.url, domains))
      );
      const sources = candidates.filter((_, index) => reachability[index]);

      return {
        queryUsed: `Official statutory lookup: ${topic} (${country})`,
        sources,
        summary: sources.length > 0
          ? String(parsed.summary || `Official-source evidence retrieved for ${country} ${topic}.`)
          : 'No reachable allow-listed official source could be verified. Treat current claims as unverified.',
        regulatoryVerified: sources.length > 0 && parsed.regulatoryVerified === true,
      };
    } catch {
      // Never invent a successful citation when live evidence retrieval fails.
      return {
        queryUsed: `Statutory lookup fallback: ${topic} (${country})`,
        sources: [],
        summary: `Live official-source research was unavailable for ${country}. Current claims remain unverified; consult ${domains.join(', ')}.`,
        regulatoryVerified: false,
      };
    }
  }
}
