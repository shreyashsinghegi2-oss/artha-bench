import { z } from 'zod';

const historyTurnSchema = z.object({
  role: z.string().max(20),
  content: z.string().max(6000),
}).strict();

export const tutorChatInputSchema = z.object({
  message: z.string().trim().min(1).max(6000),
  conversationId: z.string().max(120).nullable().default(null),
  history: z.array(historyTurnSchema).max(100).default([]),
  country: z.enum(['IN', 'US', 'UK', 'EU', 'CA', 'AU', 'SG', 'JP', 'GLOBAL']).default('GLOBAL'),
  currency: z.enum(['INR', 'USD', 'GBP', 'EUR', 'CAD', 'AUD', 'SGD', 'JPY']).default('USD'),
  language: z.enum(['English', 'Hindi', 'Hinglish']).default('English'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Beginner'),
  mode: z.enum(['Explain', 'Step-by-step', 'Socratic tutor', 'Quiz', 'Calculator lesson', 'Compare concepts']).default('Explain'),
  detail: z.enum(['Short', 'Detailed']).default('Detailed'),
  useSources: z.boolean().default(true),
}).strict();

export const tutorAnswerSchema = z.object({
  title: z.string(),
  directExplanation: z.string(),
  keyConcepts: z.array(z.string()),
  steps: z.array(z.string()),
  formula: z.string(),
  workedExample: z.string(),
  commonMistakes: z.array(z.string()),
  riskAndLimitations: z.array(z.string()),
  knowledgeCheck: z.string(),
  suggestedFollowUps: z.array(z.string()),
  educationalDisclaimer: z.string(),
}).strict();

export const tutorReviewSchema = z.object({
  status: z.enum(['passed', 'corrected', 'needs_clarification', 'blocked']),
  issues: z.array(z.string()),
  requiredCorrections: z.array(z.string()),
  safeAlternative: z.string(),
  confidence: z.number().min(0).max(1),
}).strict();

const nullableNumber = z.number().nullable();
export const tutorCalculationSchema = z.object({
  used: z.boolean(),
  formulaName: z.string(),
  inputs: z.object({
    principal: nullableNumber,
    annualRatePercent: nullableNumber,
    years: nullableNumber,
    paymentsPerYear: nullableNumber,
    payment: nullableNumber,
    income: nullableNumber,
    debt: nullableNumber,
    expenses: nullableNumber,
  }).strict(),
  result: nullableNumber,
  formattedResult: z.string(),
  verified: z.boolean(),
  formula: z.string(),
  substitution: z.string(),
  interpretation: z.string(),
  limitations: z.string(),
}).strict();

const tutorEvidenceSourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  snippet: z.string(),
  authorityDomain: z.string(),
  retrievedAt: z.string(),
  effectiveDate: z.string(),
}).strict();

export const tutorChatResponseSchema = z.object({
  conversationId: z.string(),
  answer: tutorAnswerSchema,
  calculation: tutorCalculationSchema,
  evidence: z.object({
    used: z.boolean(),
    sources: z.array(tutorEvidenceSourceSchema),
    summary: z.string(),
  }).strict(),
  review: z.object({
    usedSecondaryModel: z.boolean(),
    status: z.enum(['passed', 'corrected', 'needs_clarification', 'blocked']),
    warnings: z.array(z.string()),
  }).strict(),
  provider: z.object({
    name: z.literal('Groq'),
    model: z.string(),
    latencyMs: z.number().nonnegative(),
    requestId: z.string(),
  }).strict(),
}).strict();

export const tutorAnswerJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    directExplanation: { type: 'string' },
    keyConcepts: { type: 'array', items: { type: 'string' } },
    steps: { type: 'array', items: { type: 'string' } },
    formula: { type: 'string' },
    workedExample: { type: 'string' },
    commonMistakes: { type: 'array', items: { type: 'string' } },
    riskAndLimitations: { type: 'array', items: { type: 'string' } },
    knowledgeCheck: { type: 'string' },
    suggestedFollowUps: { type: 'array', items: { type: 'string' } },
    educationalDisclaimer: { type: 'string' },
  },
  required: [
    'title',
    'directExplanation',
    'keyConcepts',
    'steps',
    'formula',
    'workedExample',
    'commonMistakes',
    'riskAndLimitations',
    'knowledgeCheck',
    'suggestedFollowUps',
    'educationalDisclaimer',
  ],
} as const;

export const tutorReviewJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: { type: 'string', enum: ['passed', 'corrected', 'needs_clarification', 'blocked'] },
    issues: { type: 'array', items: { type: 'string' } },
    requiredCorrections: { type: 'array', items: { type: 'string' } },
    safeAlternative: { type: 'string' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: ['status', 'issues', 'requiredCorrections', 'safeAlternative', 'confidence'],
} as const;

export type TutorChatInputParsed = z.infer<typeof tutorChatInputSchema>;
export type TutorReviewParsed = z.infer<typeof tutorReviewSchema>;
