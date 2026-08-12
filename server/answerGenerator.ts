import { CountryCode, CurrencyCode, DifficultyLevel, GeneratedAnswerResponse, RiskLevel, TopicCategory } from '../src/types.js';
import { callGroqChat, getGroqModels } from './groqClient.js';

const GENERATOR_SYSTEM_PROMPT = `You are Artha Bench Educational Answer Generator.
Your purpose is to produce clean, well-reasoned, educational responses to personal finance questions to test benchmarking engines.
IMPORTANT SAFETY INSTRUCTIONS:
- Do NOT make personalized financial, stock, mutual fund, trade, insurance, or credit product recommendations (no "buy X", "invest in Y", "choose product Z").
- Focus strictly on math, financial formulas, transparent assumptions, regulatory definitions, and risk factors.
- Return ONLY valid JSON conforming to the requested schema.`;

const generatedAnswerJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
    calculationOrReasoning: { type: 'string' },
    assumptions: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    missingInformation: { type: 'array', items: { type: 'string' } },
    limitations: { type: 'string' },
    finalEducationalConclusion: { type: 'string' },
  },
  required: [
    'summary',
    'calculationOrReasoning',
    'assumptions',
    'risks',
    'missingInformation',
    'limitations',
    'finalEducationalConclusion',
  ],
} as const;

export class AnswerGenerator {
  static async generateEducationalAnswer(input: {
    question: string;
    country: CountryCode;
    currency: CurrencyCode;
    topic: TopicCategory;
    difficulty: DifficultyLevel;
    riskLevel: RiskLevel;
    userContext?: string;
  }): Promise<GeneratedAnswerResponse> {
    const models = getGroqModels();

    const userPrompt = `Generate a structured educational answer for testing:
Question: "${input.question}"
Country: ${input.country}
Currency: ${input.currency}
Topic: ${input.topic}
Difficulty: ${input.difficulty}
Risk Level: ${input.riskLevel}
${input.userContext ? `User Context: ${input.userContext}` : ''}

Return JSON with:
{
  "summary": "High level educational overview",
  "calculationOrReasoning": "Step-by-step math calculations or logical reasoning",
  "assumptions": ["Key financial or economic assumptions"],
  "risks": ["Key risks to keep in mind"],
  "missingInformation": ["Information that would be required for a complete picture"],
  "limitations": "Disclaimer of limitations",
  "finalEducationalConclusion": "Neutral educational conclusion"
}`;

    const { text } = await callGroqChat({
      model: models.tutorModel,
      systemPrompt: GENERATOR_SYSTEM_PROMPT,
      userPrompt,
      responseSchema: { name: 'artha_bench_educational_test_answer', schema: generatedAnswerJsonSchema },
      temperature: 0.2,
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      parsed = {
        summary: text,
        calculationOrReasoning: 'Detailed reasoning provided in summary.',
        assumptions: ['Standard inflation and interest rates'],
        risks: ['Market volatility and interest rate changes'],
        missingInformation: ['Specific personal income and tax bracket'],
        limitations: 'Educational illustration only.',
        finalEducationalConclusion: 'Consult a licensed financial professional for personalized advice.',
      };
    }

    return {
      summary: parsed.summary || 'Educational summary',
      calculationOrReasoning: parsed.calculationOrReasoning || 'Financial math breakdown',
      assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : ['Standard market rates'],
      risks: Array.isArray(parsed.risks) ? parsed.risks : ['Market fluctuations'],
      missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : ['Personal tax status'],
      limitations: parsed.limitations || 'This is strictly for research and evaluation purposes.',
      finalEducationalConclusion: parsed.finalEducationalConclusion || 'Educational illustration.',
      provider: 'Groq',
      model: models.tutorModel,
    };
  }
}
