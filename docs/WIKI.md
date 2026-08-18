# Artha Bench — Research & Architecture Wiki

> **Purpose:** Technical documentation for the research-oriented AI financial reliability benchmark.

## 1. Overview

Artha Bench evaluates AI-generated personal-finance answers across numerical accuracy, safety, reasoning consistency, localization, transparency, explainability, and completeness. It is designed as a benchmark/research system rather than a general financial dashboard.

## 2. System Architecture

```mermaid
flowchart TB
    U[User / Researcher]

    subgraph UI[React + TypeScript Frontend]
      DASH[Dashboard]
      QUICK[Quick Check]
      LAB[Evaluation Lab]
      BATCH[Batch Runner]
      COMP[Comparison]
      TUTOR[Financial Tutor]
      METHOD[Methodology]
      HIST[History]
    end

    subgraph CORE[Evaluation Core]
      SCHEMA[Validated Evaluation Input]
      MATH[Deterministic Finance Math]
      MODEL[AI Evaluation / Review]
      RULES[Safety + Scoring Rules]
      CAL[Calibration Metrics]
    end

    subgraph OUT[Outputs]
      SCORE[Dimension Scores]
      REPORT[Evaluation Report]
      TRACE[Verification / Traceability]
    end

    U --> DASH
    DASH --> QUICK & LAB & BATCH & COMP & TUTOR & METHOD & HIST
    QUICK & LAB & BATCH & COMP --> SCHEMA
    SCHEMA --> MATH
    SCHEMA --> MODEL
    MATH --> RULES
    MODEL --> RULES
    RULES --> CAL
    CAL --> SCORE
    SCORE --> REPORT
    REPORT --> TRACE
```

## 3. Evaluation Lifecycle

```mermaid
sequenceDiagram
    actor User
    participant UI as Evaluation UI
    participant Input as Schema Validation
    participant Math as Finance Math Engine
    participant AI as Independent AI Review
    participant Score as Reliability Scoring
    participant Report as Report Layer

    User->>UI: Submit financial question / answer
    UI->>Input: Validate payload
    Input->>Math: Run deterministic checks
    Input->>AI: Run model-based review
    Math-->>Score: Numerical evidence
    AI-->>Score: Qualitative assessment
    Score->>Score: Apply weights + safety caps
    Score-->>Report: Reliability result
    Report-->>UI: Scores, findings, evidence
```

## 4. Evaluation Dimensions

| Dimension | Weight |
|---|---:|
| Numerical Accuracy | 25% |
| Safety & Risk Awareness | 20% |
| Reasoning Consistency | 15% |
| Localization Accuracy | 10% |
| Assumption Transparency | 10% |
| Explainability | 10% |
| Completeness | 10% |

Hard caps are applied for severe failures such as unsafe guaranteed-return language, numerical mismatches, localization failure, or prompt-injection/system-prompt disclosure behavior.

## 5. Deterministic Financial Engine

The project contains a dedicated engine at `src/engine/financeMath.ts` for financial calculations. This prevents the benchmark from using an LLM as the source of truth for mathematical validation.

```mermaid
flowchart LR
    INPUT[Question Data] --> PARSE[Parse Parameters]
    PARSE --> FORMULA[Deterministic Formula]
    FORMULA --> EXPECTED[Expected Numeric Result]
    MODEL[AI Answer] --> EXTRACT[Extract Claimed Number]
    EXPECTED --> CMP[Compare / Tolerance]
    EXTRACT --> CMP
    CMP --> RESULT[Accuracy Finding]
```

## 6. Major UI Areas

| Page | Role |
|---|---|
| `DashboardPage.tsx` | High-level benchmark overview |
| `QuickCheckPage.tsx` | Fast single-response reliability evaluation |
| `EvaluationLabPage.tsx` | Detailed evaluation workflow |
| `BatchPage.tsx` | Multi-item benchmark execution |
| `ComparisonPage.tsx` | Compare model/answer performance |
| `TutorPage.tsx` | Multilingual financial tutoring |
| `MethodologyPage.tsx` | Explain benchmark methodology |
| `ScenariosPage.tsx` | Curated benchmark scenarios |
| `HistoryPage.tsx` | Stored evaluation history |
| `ConnectionsPage.tsx` | Provider/model connectivity |

## 7. Research Flow

```mermaid
flowchart TB
    DATASET[Benchmark Scenarios] --> RUN[Run Evaluation]
    RUN --> NUM[Numeric Checks]
    RUN --> SAFE[Safety Checks]
    RUN --> REASON[Reasoning Review]
    RUN --> LOCAL[Localization Review]
    NUM & SAFE & REASON & LOCAL --> AGG[Weighted Aggregation]
    AGG --> CAP[Apply Hard Caps]
    CAP --> CAL[Calibration Metrics]
    CAL --> RES[Final Reliability Result]
```

## 8. Calibration

Batch evaluation includes calibration-oriented metrics such as Expected Calibration Error (ECE) and Brier Score. These help measure whether confidence aligns with observed correctness rather than only ranking answer quality.

## 9. Security Model

```mermaid
flowchart LR
    B[Browser] --> API[Server/API]
    ENV[Server Environment Secrets] --> API
    API --> PROVIDER[Model Provider]
    API --> ENGINE[Deterministic Engine]
    PROVIDER --> API
    ENGINE --> API
    API --> B
```

Provider credentials should remain server-side and never appear in committed code or browser responses.

## 10. Repository Structure

```text
artha-bench/
├── src/
│   ├── components/
│   ├── data/
│   ├── engine/
│   │   └── financeMath.ts
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── QuickCheckPage.tsx
│   │   ├── EvaluationLabPage.tsx
│   │   ├── BatchPage.tsx
│   │   ├── ComparisonPage.tsx
│   │   ├── TutorPage.tsx
│   │   └── MethodologyPage.tsx
│   ├── schemas/
│   └── types.ts
└── README.md
```

## 11. Position in the Project Family

```mermaid
flowchart LR
    AB[Artha Bench] -->|Research concepts + evaluation methodology| PRO[ArthaBench Pro]
    AB -->|Benchmarking ideas| FTB[FinTrustBench]
```

- **Artha Bench:** benchmark methodology and financial-AI reliability research
- **ArthaBench Pro:** broader product platform built around reliability-aware financial intelligence
- **FinTrustBench:** trustworthy personal-finance benchmarking and model comparison

## 12. Research Roadmap

- Larger benchmark scenario library
- Stronger ground-truth datasets
- Reproducible benchmark exports
- Model-to-model comparison experiments
- Better confidence calibration analysis
- Regulatory/localization test suites
- Citation-grounded evaluation for financial documents

## 13. Design Philosophy

> A finance benchmark should reward correctness and safety, not merely persuasive language.
