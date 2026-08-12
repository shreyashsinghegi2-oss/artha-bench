import Decimal from 'decimal.js';
import { DeterministicCheckResult, DeterministicEngineReport } from '../types';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export class FinanceMathEngine {
  /**
   * 1. Simple Interest
   */
  static calculateSimpleInterest(principal: number, rateDecimal: number, timeYears: number) {
    const P = new Decimal(principal);
    const r = new Decimal(rateDecimal);
    const t = new Decimal(timeYears);
    const interest = P.times(r).times(t);
    const totalAmount = P.plus(interest);
    return {
      interest: interest.toNumber(),
      totalAmount: totalAmount.toNumber(),
    };
  }

  /**
   * 2. Compound Future Value
   */
  static calculateCompoundFV(principal: number, annualRateDecimal: number, compoundsPerYear: number, timeYears: number) {
    const P = new Decimal(principal);
    const r = new Decimal(annualRateDecimal);
    const n = new Decimal(compoundsPerYear);
    const t = new Decimal(timeYears);

    const ratePerPeriod = r.div(n);
    const totalPeriods = n.times(t);
    const factor = new Decimal(1).plus(ratePerPeriod).pow(totalPeriods);
    const fv = P.times(factor);

    return fv.toNumber();
  }

  /**
   * 3. Present Value
   */
  static calculatePresentValue(futureValue: number, annualRateDecimal: number, compoundsPerYear: number, timeYears: number) {
    const FV = new Decimal(futureValue);
    const r = new Decimal(annualRateDecimal);
    const n = new Decimal(compoundsPerYear);
    const t = new Decimal(timeYears);

    const ratePerPeriod = r.div(n);
    const totalPeriods = n.times(t);
    const discountFactor = new Decimal(1).plus(ratePerPeriod).pow(totalPeriods);
    const pv = FV.div(discountFactor);

    return pv.toNumber();
  }

  /**
   * 4. Compound Annual Growth Rate (CAGR)
   */
  static calculateCAGR(initialValue: number, finalValue: number, years: number) {
    if (initialValue <= 0 || finalValue <= 0 || years <= 0) {
      throw new Error('Initial value, final value, and years must be positive.');
    }
    const V_i = new Decimal(initialValue);
    const V_f = new Decimal(finalValue);
    const n = new Decimal(years);

    const ratio = V_f.div(V_i);
    const exponent = new Decimal(1).div(n);
    const cagr = Decimal.pow(ratio, exponent).minus(1);

    return cagr.toNumber();
  }

  /**
   * 5. Effective Annual Rate (EAR)
   */
  static calculateEAR(nominalRateDecimal: number, compoundingPeriodsPerYear: number) {
    const r = new Decimal(nominalRateDecimal);
    const m = new Decimal(compoundingPeriodsPerYear);

    const factor = new Decimal(1).plus(r.div(m)).pow(m);
    const ear = factor.minus(1);

    return ear.toNumber();
  }

  /**
   * 6. Real Return (adjusted for inflation)
   */
  static calculateRealReturn(nominalReturnDecimal: number, inflationRateDecimal: number) {
    const r_nom = new Decimal(nominalReturnDecimal);
    const i_rate = new Decimal(inflationRateDecimal);

    const realReturn = new Decimal(1).plus(r_nom).div(new Decimal(1).plus(i_rate)).minus(1);

    return realReturn.toNumber();
  }

  /**
   * 7. Inflation-Adjusted Future Cost
   */
  static calculateInflationAdjustedCost(presentCost: number, inflationRateDecimal: number, years: number) {
    const P = new Decimal(presentCost);
    const i = new Decimal(inflationRateDecimal);
    const t = new Decimal(years);

    const factor = new Decimal(1).plus(i).pow(t);
    const futureCost = P.times(factor);

    return futureCost.toNumber();
  }

  /**
   * 8. Loan EMI / Periodic Payment
   */
  static calculateLoanEMI(principal: number, annualRateDecimal: number, totalPayments: number, paymentsPerYear = 12) {
    const P = new Decimal(principal);
    const r = new Decimal(annualRateDecimal).div(paymentsPerYear);
    const n = new Decimal(totalPayments);

    if (r.equals(0)) {
      return P.div(n).toNumber();
    }

    const factor = new Decimal(1).plus(r).pow(n);
    const emi = P.times(r).times(factor).div(factor.minus(1));

    return emi.toNumber();
  }

  /**
   * 9. Remaining Loan Balance after k payments
   */
  static calculateRemainingLoanBalance(principal: number, annualRateDecimal: number, totalPayments: number, kPayments: number, paymentsPerYear = 12) {
    const P = new Decimal(principal);
    const r = new Decimal(annualRateDecimal).div(paymentsPerYear);
    const n = new Decimal(totalPayments);
    const k = new Decimal(kPayments);

    const emi = new Decimal(this.calculateLoanEMI(principal, annualRateDecimal, totalPayments, paymentsPerYear));

    if (r.equals(0)) {
      return P.minus(emi.times(k)).toNumber();
    }

    const term1 = P.times(new Decimal(1).plus(r).pow(k));
    const term2Numerator = new Decimal(1).plus(r).pow(k).minus(1);
    const term2 = emi.times(term2Numerator).div(r);

    const balance = term1.minus(term2);
    return Decimal.max(0, balance).toNumber();
  }

  /**
   * 10. Future Value of Annuity (Regular or Due)
   */
  static calculateAnnuityFV(paymentAmount: number, periodicRateDecimal: number, totalPeriods: number, isDue = false) {
    const PMT = new Decimal(paymentAmount);
    const r = new Decimal(periodicRateDecimal);
    const n = new Decimal(totalPeriods);

    if (r.equals(0)) {
      return PMT.times(n).toNumber();
    }

    const factor = new Decimal(1).plus(r).pow(n).minus(1);
    let fv = PMT.times(factor).div(r);

    if (isDue) {
      fv = fv.times(new Decimal(1).plus(r));
    }

    return fv.toNumber();
  }

  /**
   * 11. Debt-to-Income Ratio (DTI %)
   */
  static calculateDTI(monthlyDebtPayments: number, grossMonthlyIncome: number) {
    if (grossMonthlyIncome <= 0) throw new Error('Gross monthly income must be positive.');
    return new Decimal(monthlyDebtPayments).div(new Decimal(grossMonthlyIncome)).times(100).toNumber();
  }

  /**
   * 12. Savings Rate (%)
   */
  static calculateSavingsRate(monthlySavings: number, netMonthlyIncome: number) {
    if (netMonthlyIncome <= 0) throw new Error('Net monthly income must be positive.');
    return new Decimal(monthlySavings).div(new Decimal(netMonthlyIncome)).times(100).toNumber();
  }

  /**
   * 13. Emergency Fund Coverage (Months)
   */
  static calculateEmergencyFundCoverage(liquidSavings: number, essentialMonthlyExpenses: number) {
    if (essentialMonthlyExpenses <= 0) throw new Error('Essential monthly expenses must be positive.');
    return new Decimal(liquidSavings).div(new Decimal(essentialMonthlyExpenses)).toNumber();
  }

  /**
   * 14. Debt-to-Equity Ratio
   */
  static calculateDebtToEquity(totalDebt: number, shareholderEquity: number) {
    if (shareholderEquity <= 0) throw new Error('Shareholder equity must be positive.');
    return new Decimal(totalDebt).div(new Decimal(shareholderEquity)).toNumber();
  }

  /**
   * 15. Weighted Average Cost of Capital (WACC)
   */
  static calculateWACC(
    equityValue: number,
    debtValue: number,
    costOfEquityDecimal: number,
    costOfDebtDecimal: number,
    taxRateDecimal: number
  ) {
    const E = new Decimal(equityValue);
    const D = new Decimal(debtValue);
    const V = E.plus(D);
    if (V.equals(0)) throw new Error('Total capital (E + D) cannot be zero.');

    const Re = new Decimal(costOfEquityDecimal);
    const Rd = new Decimal(costOfDebtDecimal);
    const Tc = new Decimal(taxRateDecimal);

    const equityWeight = E.div(V);
    const debtWeight = D.div(V);

    const wacc = equityWeight.times(Re).plus(debtWeight.times(Rd).times(new Decimal(1).minus(Tc)));
    return wacc.toNumber();
  }

  /**
   * 16. Portfolio Expected Return
   */
  static calculatePortfolioExpectedReturn(weights: number[], expectedReturnsDecimal: number[]) {
    if (weights.length !== expectedReturnsDecimal.length) {
      throw new Error('Weights array and expected returns array must have equal lengths.');
    }
    const weightSum = weights.reduce((acc, w) => acc + w, 0);
    if (Math.abs(weightSum - 1.0) > 0.001) {
      throw new Error(`Portfolio weights must sum to 1.0 (got ${weightSum.toFixed(4)}).`);
    }

    let expectedReturn = new Decimal(0);
    for (let i = 0; i < weights.length; i++) {
      expectedReturn = expectedReturn.plus(new Decimal(weights[i]).times(new Decimal(expectedReturnsDecimal[i])));
    }
    return expectedReturn.toNumber();
  }

  /**
   * 17. Portfolio Variance (2-asset)
   */
  static calculatePortfolioVariance2Asset(w1: number, w2: number, var1: number, var2: number, cov12: number) {
    const W1 = new Decimal(w1);
    const W2 = new Decimal(w2);
    const V1 = new Decimal(var1);
    const V2 = new Decimal(var2);
    const Cov = new Decimal(cov12);

    const term1 = W1.pow(2).times(V1);
    const term2 = W2.pow(2).times(V2);
    const term3 = new Decimal(2).times(W1).times(W2).times(Cov);

    return term1.plus(term2).plus(term3).toNumber();
  }

  /**
   * 18. Sharpe Ratio
   */
  static calculateSharpeRatio(portfolioReturnDecimal: number, riskFreeRateDecimal: number, portfolioStdDevDecimal: number) {
    if (portfolioStdDevDecimal <= 0) throw new Error('Portfolio standard deviation must be positive.');
    const Rp = new Decimal(portfolioReturnDecimal);
    const Rf = new Decimal(riskFreeRateDecimal);
    const Sigma = new Decimal(portfolioStdDevDecimal);

    return Rp.minus(Rf).div(Sigma).toNumber();
  }

  /**
   * 19. Break-even units
   */
  static calculateBreakEvenUnits(fixedCosts: number, pricePerUnit: number, variableCostPerUnit: number) {
    const contribution = new Decimal(pricePerUnit).minus(variableCostPerUnit);
    if (contribution.lte(0)) throw new Error('Price per unit must exceed variable cost per unit.');
    return new Decimal(fixedCosts).div(contribution).toNumber();
  }

  /**
   * 20. Percentage budget allocation
   */
  static calculateBudgetAllocation(income: number, percentages: number[]) {
    const total = percentages.reduce((sum, percentage) => sum + percentage, 0);
    if (Math.abs(total - 100) > 0.001) throw new Error('Budget percentages must total 100.');
    return percentages.map((percentage) => new Decimal(income).times(percentage).div(100).toNumber());
  }

  /**
   * Extract potential numerical values from an answer string
   */
  static extractNumericalCandidates(text: string): { value: number; raw: string; index: number }[] {
    const candidates: { value: number; raw: string; index: number }[] = [];
    // Matches numbers like $12,345.67, 12.35%, 1,234.5, 500000, etc.
    const regex = /(?:[\$₹£€]\s*)?([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(?:%|months|years|INR|USD|GBP|EUR)?/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const rawNum = match[1].replace(/,/g, '');
      const parsed = parseFloat(rawNum);
      if (!isNaN(parsed) && isFinite(parsed)) {
        candidates.push({
          value: parsed,
          raw: match[0],
          index: match.index,
        });
      }
    }
    return candidates;
  }

  /**
   * Exact and Tolerance-Based Matching
   */
  static verifyMatch(
    calculatedExpected: number,
    submittedAnswerText: string,
    options: {
      formulaName: string;
      absoluteTolerance?: number;
      relativeTolerance?: number;
      isPercentage?: boolean;
    }
  ): DeterministicCheckResult {
    const candidates = this.extractNumericalCandidates(submittedAnswerText);
    const absTol = options.absoluteTolerance ?? 0.01;
    const relTol = options.relativeTolerance ?? 0.001; // 0.1%
    const expected = calculatedExpected;

    let bestMatchCandidate: number | null = null;
    let smallestRelativeError = Infinity;
    let matchPassed = false;

    for (const c of candidates) {
      let candValue = c.value;
      // If expected is e.g. 0.0825 (8.25%) and candidate is 8.25 (percentage string), convert
      if (options.isPercentage && expected < 1 && candValue > 1) {
        candValue = candValue / 100;
      }

      const absErr = Math.abs(candValue - expected);
      const relErr = Math.abs(expected) > 1e-12 ? absErr / Math.abs(expected) : absErr;

      if (absErr <= absTol || relErr <= relTol) {
        matchPassed = true;
        bestMatchCandidate = c.value;
        smallestRelativeError = relErr;
        break;
      } else if (relErr < smallestRelativeError) {
        smallestRelativeError = relErr;
        bestMatchCandidate = c.value;
      }
    }

    const absError = bestMatchCandidate !== null ? Math.abs(bestMatchCandidate - expected) : undefined;

    return {
      formulaName: options.formulaName,
      expectedValue: expected,
      calculatedValue: expected,
      extractedValue: bestMatchCandidate ?? 'None detected',
      passed: matchPassed,
      absoluteError: absError,
      relativeError: smallestRelativeError < Infinity ? smallestRelativeError : undefined,
      toleranceUsed: absTol,
      details: matchPassed
        ? `Deterministic calculation matched! Calculated expected: ${expected}, extracted candidate: ${bestMatchCandidate}.`
        : candidates.length === 0
        ? `No numerical values found in submitted text to match formula ${options.formulaName}. Expected: ${expected}.`
        : `Numerical mismatch for ${options.formulaName}. Expected: ${expected}, best candidate in text: ${bestMatchCandidate} (relative error: ${(smallestRelativeError * 100).toFixed(2)}%).`,
    };
  }

  /**
   * Run automated formula checks based on question keywords or explicit request
   */
  static autoRunChecks(question: string, answerText: string): DeterministicEngineReport {
    const checks: DeterministicCheckResult[] = [];
    const notes: string[] = [];
    const qLower = question.toLowerCase();

    // Check 50/30/20 budgeting allocation, including Indian-number formatting.
    if (qLower.includes('50/30/20') || qLower.includes('50-30-20')) {
      const incomeMatch = question.match(/(?:earn|income|salary|take-home|take home)[^0-9]{0,20}(?:[\$₹£€]\s*)?([0-9,]+(?:\.[0-9]+)?)/i);
      if (incomeMatch) {
        const income = parseFloat(incomeMatch[1].replace(/,/g, ''));
        const [needs, wants, savings] = this.calculateBudgetAllocation(income, [50, 30, 20]);
        checks.push(
          this.verifyMatch(needs, answerText, { formulaName: '50/30/20 Needs Allocation', absoluteTolerance: 1 }),
          this.verifyMatch(wants, answerText, { formulaName: '50/30/20 Wants Allocation', absoluteTolerance: 1 }),
          this.verifyMatch(savings, answerText, { formulaName: '50/30/20 Savings Allocation', absoluteTolerance: 1 })
        );

        const debtMatch = question.match(/(?:debt|owe|balance)[^0-9]{0,20}(?:[\$₹£€]\s*)?([0-9,]+(?:\.[0-9]+)?)/i)
          || question.match(/(?:[\$₹£€]\s*)?([0-9,]+(?:\.[0-9]+)?)[^0-9]{0,35}(?:debt|credit card balance)/i);
        if (debtMatch) {
          const debt = parseFloat(debtMatch[1].replace(/,/g, ''));
          if (debt > savings) {
            notes.push(`The stated debt exceeds one month's 20% allocation by ${new Decimal(debt).minus(savings).toFixed(2)}.`);
          }
        }
      }
    }

    // Check Compound Interest / FV
    if (qLower.includes('compound') || qLower.includes('future value') || qLower.includes('fv')) {
      const pMatch = question.match(/(?:principal|amount|invests?|invested|deposit|of)\s*(?:[\$₹£€]\s*)?([0-9,]+(?:\.[0-9]+)?)/i);
      const rMatch = question.match(/([0-9]+(?:\.[0-9]+)?)\s*%/);
      const tMatch = question.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:years|yrs)/i);

      if (pMatch && rMatch && tMatch) {
        const P = parseFloat(pMatch[1].replace(/,/g, ''));
        const r = parseFloat(rMatch[1]) / 100;
        const t = parseFloat(tMatch[1]);
        const calculatedFV = this.calculateCompoundFV(P, r, 1, t);

        const check = this.verifyMatch(calculatedFV, answerText, {
          formulaName: 'Compound Interest FV (Annual)',
          absoluteTolerance: 1.0,
          relativeTolerance: 0.005,
        });
        checks.push(check);
      }
    }

    // Check Loan EMI
    if (qLower.includes('emi') || qLower.includes('loan payment') || qLower.includes('mortgage')) {
      const pMatch = question.match(/(?:loan|borrowed|amount|of)\s*(?:[\$₹£€]\s*)?([0-9,]+(?:\.[0-9]+)?)/i);
      const rMatch = question.match(/([0-9]+(?:\.[0-9]+)?)\s*%/);
      const tMatch = question.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:years|yrs|months)/i);

      if (pMatch && rMatch && tMatch) {
        const P = parseFloat(pMatch[1].replace(/,/g, ''));
        const r = parseFloat(rMatch[1]) / 100;
        let tMonths = parseFloat(tMatch[1]);
        if (question.toLowerCase().includes('year')) tMonths *= 12;

        const calculatedEMI = this.calculateLoanEMI(P, r, tMonths, 12);
        const check = this.verifyMatch(calculatedEMI, answerText, {
          formulaName: 'Loan Monthly EMI',
          absoluteTolerance: 1.0,
          relativeTolerance: 0.005,
        });
        checks.push(check);
      }
    }

    // Check CAGR
    if (qLower.includes('cagr') || qLower.includes('compound annual growth rate')) {
      const fromMatch = question.match(/(?:from|grew from|initial)\s*(?:[\$₹£€]\s*)?([0-9,]+(?:\.[0-9]+)?)/i);
      const toMatch = question.match(/(?:to|final|became)\s*(?:[\$₹£€]\s*)?([0-9,]+(?:\.[0-9]+)?)/i);
      const tMatch = question.match(/in\s*([0-9]+(?:\.[0-9]+)?)\s*(?:years|yrs)/i);

      if (fromMatch && toMatch && tMatch) {
        const vInitial = parseFloat(fromMatch[1].replace(/,/g, ''));
        const vFinal = parseFloat(toMatch[1].replace(/,/g, ''));
        const t = parseFloat(tMatch[1]);

        try {
          const cagr = this.calculateCAGR(vInitial, vFinal, t);
          const check = this.verifyMatch(cagr, answerText, {
            formulaName: 'CAGR',
            isPercentage: true,
            absoluteTolerance: 0.001,
            relativeTolerance: 0.005,
          });
          checks.push(check);
        } catch (e: any) {
          notes.push(`CAGR check skipped: ${e.message}`);
        }
      }
    }

    const overallMatch = checks.length === 0 ? true : checks.every((c) => c.passed);
    const status = checks.length === 0 ? 'skipped' : overallMatch ? 'passed' : 'failed';

    return {
      status,
      checksPerformed: checks,
      overallMatch,
      notes: notes.length > 0 ? notes : [checks.length === 0 ? 'No matching standard financial formula automatically extracted from question.' : 'Deterministic financial math check completed.'],
    };
  }
}
