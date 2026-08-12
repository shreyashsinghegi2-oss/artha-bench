/**
 * Artha Bench Core Types & Interfaces
 */

export type CountryCode = 'IN' | 'US' | 'UK' | 'EU' | 'CA' | 'AU' | 'SG' | 'JP' | 'GLOBAL';

export type CurrencyCode = 'INR' | 'USD' | 'GBP' | 'EUR' | 'CAD' | 'AUD' | 'SGD' | 'JPY';

export type TopicCategory =
  | 'budgeting'
  | 'savings'
  | 'emergency_fund'
  | 'compound_interest'
  | 'loan_emi'
  | 'debt_repayment'
  | 'investment_risk'
  | 'retirement_planning'
  | 'insurance_safety'
  | 'inflation'
  | 'taxation'
  | 'financial_fraud'
  | 'privacy_leakage'
  | 'fiduciary_refusal'
  | 'prompt_injection'
  | 'numerical_hallucination'
  | 'localization';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type MetricStatus = 'pass' | 'warning' | 'fail' | 'not_applicable';

export type ReliabilityLevel = 'Excellent' | 'Good' | 'Moderate' | 'Weak' | 'Unsafe';

export type StrictnessLevel = 'Standard' | 'Conservative' | 'Research';

export interface MetricEvaluation {
  score: number;
  maximum: number;
  status: MetricStatus;
  explanation: string;
  detectedIssues: string[];
}

export interface EvaluatorSchemaOutput {
  numericalAccuracy: MetricEvaluation;
  reasoningConsistency: MetricEvaluation;
  safetyAndRiskAwareness: MetricEvaluation;
  explainability: MetricEvaluation;
  localizationAccuracy: MetricEvaluation;
  assumptionTransparency: MetricEvaluation;
  completeness: MetricEvaluation;
  overallReliabilityScore: number;
  reliabilityLevel: ReliabilityLevel;
  criticalWarnings: string[];
  missingInformation: string[];
  statedAssumptions: string[];
  unstatedAssumptions: string[];
  correctionsRequired: string[];
  correctedEducationalAnswer: string;
  researchSummary: string;
  confidence: number;
}

export interface DeterministicCheckResult {
  formulaName: string;
  expectedValue: number | string;
  calculatedValue: number | string;
  extractedValue?: number | string;
  passed: boolean;
  absoluteError?: number;
  relativeError?: number;
  toleranceUsed?: number;
  details: string;
}

export interface DeterministicEngineReport {
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  checksPerformed: DeterministicCheckResult[];
  overallMatch: boolean;
  notes: string[];
}

export interface EvidenceSource {
  title: string;
  url: string;
  snippet: string;
  authorityDomain: string;
  retrievedAt: string;
  effectiveDate?: string;
}

export interface EvidenceResearchResult {
  queryUsed: string;
  sources: EvidenceSource[];
  summary: string;
  regulatoryVerified: boolean;
}

export interface ComprehensiveEvaluationReport {
  id: string;
  runId: string;
  timestamp: string;
  question: string;
  submittedAnswer: string;
  metadata: {
    country: CountryCode;
    currency: CurrencyCode;
    topic: TopicCategory;
    difficulty: DifficultyLevel;
    riskLevel: RiskLevel;
    strictness: StrictnessLevel;
    userContext?: string;
  };
  overallScore: number;
  reliabilityLevel: ReliabilityLevel;
  agreementLevel: 'High' | 'Medium' | 'Low' | 'N/A (Single Model)';
  scoreSpread: number;
  degraded: boolean;
  metricScores: {
    numericalAccuracy: MetricEvaluation;
    reasoningConsistency: MetricEvaluation;
    safetyAndRiskAwareness: MetricEvaluation;
    explainability: MetricEvaluation;
    localizationAccuracy: MetricEvaluation;
    assumptionTransparency: MetricEvaluation;
    completeness: MetricEvaluation;
  };
  appliedCaps: string[];
  criticalWarnings: string[];
  missingInformation: string[];
  statedAssumptions: string[];
  unstatedAssumptions: string[];
  correctionsRequired: string[];
  correctedEducationalAnswer: string;
  deterministicReport: DeterministicEngineReport;
  evidenceResult?: EvidenceResearchResult;
  primaryModelOutput?: EvaluatorSchemaOutput;
  secondaryModelOutput?: EvaluatorSchemaOutput;
  providerMetadata: {
    primaryModel: string;
    secondaryModel: string;
    searchModel?: string;
    totalLatencyMs: number;
    primaryLatencyMs?: number;
    secondaryLatencyMs?: number;
    evaluatorDiagnostics?: EvaluatorComponentDiagnostic[];
  };
  reportHash?: string;
  verificationCode?: string;
}

export interface EvaluatorComponentDiagnostic {
  role: 'primary' | 'secondary';
  model: string;
  state: GroqDiagnosticState;
  requestId?: string;
  latencyMs?: number;
}

export interface GeneratedAnswerResponse {
  summary: string;
  calculationOrReasoning: string;
  assumptions: string[];
  risks: string[];
  missingInformation: string[];
  limitations: string;
  finalEducationalConclusion: string;
  provider: 'Groq';
  model: string;
}

export type GroqDiagnosticState =
  | 'connected'
  | 'not_configured'
  | 'invalid_request'
  | 'invalid_credentials'
  | 'model_unavailable'
  | 'rate_limited'
  | 'timeout'
  | 'provider_unavailable'
  | 'invalid_response'
  | 'error';

export interface GroqModelDiagnostic {
  role: 'tutor' | 'primary' | 'secondary' | 'search';
  model: string;
  state: GroqDiagnosticState;
  verified: boolean;
  latencyMs?: number;
  message?: string;
}

export interface GroqConnectionStatus {
  success?: boolean;
  configured: boolean;
  verified: boolean;
  state: GroqDiagnosticState;
  primaryModel: string;
  secondaryModel: string;
  tutorModel?: string;
  primaryEvaluatorModel?: string;
  secondaryEvaluatorModel?: string;
  searchModel: string;
  models?: {
    tutor: string;
    primaryEvaluator: string;
    secondaryEvaluator: string;
    search: string;
  };
  components?: GroqModelDiagnostic[];
  httpStatus?: number;
  requestId?: string;
  latencyMs?: number;
  verifiedAt?: string;
  message?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  groq: GroqConnectionStatus;
  deterministicEngine: {
    ready: true;
    version: string;
  };
  webSearchEnabled: boolean;
  timestamp: string;
}

export type TutorLanguage = 'English' | 'Hindi' | 'Hinglish';
export type TutorLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type TutorMode = 'Explain' | 'Step-by-step' | 'Socratic tutor' | 'Quiz' | 'Calculator lesson' | 'Compare concepts';
export type TutorDetail = 'Short' | 'Detailed';

export interface TutorHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface TutorChatInput {
  message: string;
  conversationId: string | null;
  history: TutorHistoryTurn[];
  country: CountryCode;
  currency: CurrencyCode;
  language: TutorLanguage;
  level: TutorLevel;
  mode: TutorMode;
  detail: TutorDetail;
  useSources: boolean;
}

export interface TutorAnswer {
  title: string;
  directExplanation: string;
  keyConcepts: string[];
  steps: string[];
  formula: string;
  workedExample: string;
  commonMistakes: string[];
  riskAndLimitations: string[];
  knowledgeCheck: string;
  suggestedFollowUps: string[];
  educationalDisclaimer: string;
}

export interface TutorCalculationInputs {
  principal: number | null;
  annualRatePercent: number | null;
  years: number | null;
  paymentsPerYear: number | null;
  payment: number | null;
  income: number | null;
  debt: number | null;
  expenses: number | null;
}

export interface TutorCalculation {
  used: boolean;
  formulaName: string;
  inputs: TutorCalculationInputs;
  result: number | null;
  formattedResult: string;
  verified: boolean;
  formula: string;
  substitution: string;
  interpretation: string;
  limitations: string;
}

export interface TutorEvidenceSource extends EvidenceSource {
  effectiveDate: string;
}

export interface TutorChatResponse {
  conversationId: string;
  answer: TutorAnswer;
  calculation: TutorCalculation;
  evidence: {
    used: boolean;
    sources: TutorEvidenceSource[];
    summary: string;
  };
  review: {
    usedSecondaryModel: boolean;
    status: 'passed' | 'corrected' | 'needs_clarification' | 'blocked';
    warnings: string[];
  };
  provider: {
    name: 'Groq';
    model: string;
    latencyMs: number;
    requestId: string;
  };
}

export interface SavedTutorConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  context: Omit<TutorChatInput, 'message' | 'history' | 'conversationId'>;
  turns: TutorHistoryTurn[];
}

export interface BenchmarkScenario {
  id: string;
  title: string;
  country: CountryCode;
  currency: CurrencyCode;
  topic: TopicCategory;
  difficulty: DifficultyLevel;
  riskLevel: RiskLevel;
  question: string;
  sampleAnswer?: string;
  context?: string;
  expectedReasoningCheckpoints: string[];
  expectedSafetyBehavior: string;
  deterministicFormula?: string;
  deterministicExpectedValue?: number;
  tags: string[];
  version: string;
}

export interface BatchRunItem {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  score?: number;
  reliabilityLevel?: ReliabilityLevel;
  error?: string;
  latencyMs?: number;
}

export interface BatchRunMetrics {
  exactMatch: number;
  precision: number;
  recall: number;
  f1Score: number;
  ece: number;
  brierScore: number;
  attackSuccessRate: number;
  appropriateRefusalRate: number;
  overRefusalRate: number;
  privacyLeakageRate: number;
  robustnessDegradation: number;
  averageScore: number;
}

export interface BatchJob {
  id: string;
  createdAt: string;
  status: 'created' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed';
  totalItems: number;
  completedItems: number;
  failedItems: number;
  concurrency: number;
  retryCount: number;
  items: BatchRunItem[];
  metrics?: BatchRunMetrics;
  logs: string[];
}
