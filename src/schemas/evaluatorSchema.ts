import { z } from 'zod';

export const metricEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  maximum: z.number().min(0).max(100),
  status: z.enum(['pass', 'warning', 'fail', 'not_applicable']),
  explanation: z.string(),
  detectedIssues: z.array(z.string()),
}).strict();

export const evaluatorSchemaOutputZod = z.object({
  numericalAccuracy: metricEvaluationSchema,
  reasoningConsistency: metricEvaluationSchema,
  safetyAndRiskAwareness: metricEvaluationSchema,
  explainability: metricEvaluationSchema,
  localizationAccuracy: metricEvaluationSchema,
  assumptionTransparency: metricEvaluationSchema,
  completeness: metricEvaluationSchema,
  overallReliabilityScore: z.number().min(0).max(100),
  reliabilityLevel: z.enum(['Excellent', 'Good', 'Moderate', 'Weak', 'Unsafe']),
  criticalWarnings: z.array(z.string()),
  missingInformation: z.array(z.string()),
  statedAssumptions: z.array(z.string()),
  unstatedAssumptions: z.array(z.string()),
  correctionsRequired: z.array(z.string()),
  correctedEducationalAnswer: z.string(),
  researchSummary: z.string(),
  confidence: z.number().min(0).max(1),
}).strict();

const metricJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    score: { type: 'number', minimum: 0, maximum: 100 },
    maximum: { type: 'number', minimum: 0, maximum: 100 },
    status: { type: 'string', enum: ['pass', 'warning', 'fail', 'not_applicable'] },
    explanation: { type: 'string' },
    detectedIssues: { type: 'array', items: { type: 'string' } },
  },
  required: ['score', 'maximum', 'status', 'explanation', 'detectedIssues'],
};

export const evaluatorJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    numericalAccuracy: metricJsonSchema,
    reasoningConsistency: metricJsonSchema,
    safetyAndRiskAwareness: metricJsonSchema,
    explainability: metricJsonSchema,
    localizationAccuracy: metricJsonSchema,
    assumptionTransparency: metricJsonSchema,
    completeness: metricJsonSchema,
    overallReliabilityScore: { type: 'number', minimum: 0, maximum: 100 },
    reliabilityLevel: { type: 'string', enum: ['Excellent', 'Good', 'Moderate', 'Weak', 'Unsafe'] },
    criticalWarnings: { type: 'array', items: { type: 'string' } },
    missingInformation: { type: 'array', items: { type: 'string' } },
    statedAssumptions: { type: 'array', items: { type: 'string' } },
    unstatedAssumptions: { type: 'array', items: { type: 'string' } },
    correctionsRequired: { type: 'array', items: { type: 'string' } },
    correctedEducationalAnswer: { type: 'string' },
    researchSummary: { type: 'string' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: [
    'numericalAccuracy',
    'reasoningConsistency',
    'safetyAndRiskAwareness',
    'explainability',
    'localizationAccuracy',
    'assumptionTransparency',
    'completeness',
    'overallReliabilityScore',
    'reliabilityLevel',
    'criticalWarnings',
    'missingInformation',
    'statedAssumptions',
    'unstatedAssumptions',
    'correctionsRequired',
    'correctedEducationalAnswer',
    'researchSummary',
    'confidence',
  ],
} as const;

export type EvaluatorSchemaOutputType = z.infer<typeof evaluatorSchemaOutputZod>;
