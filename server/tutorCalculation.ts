import Decimal from 'decimal.js';
import { FinanceMathEngine } from '../src/engine/financeMath';
import { CurrencyCode, TutorCalculation, TutorCalculationInputs } from '../src/types';

const emptyInputs = (): TutorCalculationInputs => ({
  principal: null,
  annualRatePercent: null,
  years: null,
  paymentsPerYear: null,
  payment: null,
  income: null,
  debt: null,
  expenses: null,
});

const unusedCalculation = (): TutorCalculation => ({
  used: false,
  formulaName: '',
  inputs: emptyInputs(),
  result: null,
  formattedResult: '',
  verified: false,
  formula: '',
  substitution: '',
  interpretation: '',
  limitations: '',
});

function parseAmount(raw?: string) {
  if (!raw) return null;
  const parsed = Number.parseFloat(raw.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function amountAfter(message: string, labels: string[]) {
  const expression = new RegExp(`(?:${labels.join('|')})[^0-9]{0,25}(?:[$₹£€]\\s*)?([0-9,]+(?:\\.[0-9]+)?)`, 'i');
  return parseAmount(message.match(expression)?.[1]);
}

function amountBefore(message: string, labels: string[]) {
  const expression = new RegExp(`(?:[$₹£€]\\s*)?([0-9,]+(?:\\.[0-9]+)?)[^0-9]{0,35}(?:${labels.join('|')})`, 'i');
  return parseAmount(message.match(expression)?.[1]);
}

function percent(message: string) {
  const raw = message.match(/([0-9]+(?:\.[0-9]+)?)\s*%/)?.[1];
  return raw ? Number.parseFloat(raw) : null;
}

function years(message: string) {
  const raw = message.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:years?|yrs?)/i)?.[1];
  return raw ? Number.parseFloat(raw) : null;
}

function currencyFormatter(currency: CurrencyCode) {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  });
}

function verified(input: Omit<TutorCalculation, 'used' | 'verified'>): TutorCalculation {
  return { ...input, used: true, verified: true };
}

export function detectTutorCalculation(message: string, currency: CurrencyCode): TutorCalculation {
  const lower = message.toLowerCase();
  const money = currencyFormatter(currency);
  const ratePercent = percent(message);
  const timeYears = years(message);

  if (lower.includes('50/30/20') || lower.includes('50-30-20')) {
    const income = amountAfter(message, ['earn', 'income', 'salary', 'take-home', 'take home']);
    if (income !== null) {
      const debt = amountAfter(message, ['debt', 'owe', 'balance'])
        ?? amountBefore(message, ['debt', 'credit card balance']);
      const [needs, wants, savings] = FinanceMathEngine.calculateBudgetAllocation(income, [50, 30, 20]);
      const shortfall = debt !== null && debt > savings ? new Decimal(debt).minus(savings).toNumber() : 0;
      return verified({
        formulaName: '50/30/20 Budget Allocation',
        inputs: { ...emptyInputs(), income, debt },
        result: income,
        formattedResult: `Needs ${money.format(needs)} · Wants ${money.format(wants)} · Savings/debt goals ${money.format(savings)}`,
        formula: 'Allocation = monthly net income × category percentage',
        substitution: `${money.format(income)} × 50% = ${money.format(needs)}; × 30% = ${money.format(wants)}; × 20% = ${money.format(savings)}`,
        interpretation: shortfall > 0
          ? `The debt is ${money.format(shortfall)} more than one month’s 20% allocation, so it cannot be fully covered from that category in one month.`
          : 'The three category amounts total the stated monthly net income.',
        limitations: '50/30/20 is an educational starting framework, not a rule that fits every household or debt situation.',
      });
    }
  }

  if ((lower.includes('compound') || lower.includes('future value')) && ratePercent !== null && timeYears !== null) {
    const principal = amountAfter(message, ['principal', 'amount', 'invest', 'invested', 'deposit', 'of']);
    if (principal !== null) {
      const result = FinanceMathEngine.calculateCompoundFV(principal, ratePercent / 100, 1, timeYears);
      return verified({
        formulaName: 'Compound Future Value (annual compounding)',
        inputs: { ...emptyInputs(), principal, annualRatePercent: ratePercent, years: timeYears, paymentsPerYear: 1 },
        result,
        formattedResult: money.format(result),
        formula: 'FV = P × (1 + r/n)^(n×t)',
        substitution: `${money.format(principal)} × (1 + ${ratePercent / 100}/1)^(1×${timeYears}) = ${money.format(result)}`,
        interpretation: `The calculated future value after ${timeYears} years is ${money.format(result)} before tax, fees and inflation.`,
        limitations: 'Assumes the stated annual rate stays constant and interest compounds annually.',
      });
    }
  }

  if ((lower.includes('simple interest') || lower.includes('simple-interest')) && ratePercent !== null && timeYears !== null) {
    const principal = amountAfter(message, ['principal', 'amount', 'loan', 'deposit', 'of']);
    if (principal !== null) {
      const result = FinanceMathEngine.calculateSimpleInterest(principal, ratePercent / 100, timeYears);
      return verified({
        formulaName: 'Simple Interest',
        inputs: { ...emptyInputs(), principal, annualRatePercent: ratePercent, years: timeYears },
        result: result.interest,
        formattedResult: `${money.format(result.interest)} interest; ${money.format(result.totalAmount)} total`,
        formula: 'I = P × r × t',
        substitution: `${money.format(principal)} × ${ratePercent / 100} × ${timeYears} = ${money.format(result.interest)}`,
        interpretation: `Simple interest is ${money.format(result.interest)} and the total is ${money.format(result.totalAmount)}.`,
        limitations: 'Assumes no compounding, fees, taxes or changing rate.',
      });
    }
  }

  if ((lower.includes('emi') || lower.includes('loan payment') || lower.includes('mortgage')) && ratePercent !== null) {
    const principal = amountAfter(message, ['loan', 'principal', 'borrowed', 'amount', 'of']);
    const monthMatch = message.match(/([0-9]+(?:\.[0-9]+)?)\s*months?/i)?.[1];
    const months = monthMatch ? Number.parseFloat(monthMatch) : timeYears !== null ? timeYears * 12 : null;
    if (principal !== null && months !== null) {
      const result = FinanceMathEngine.calculateLoanEMI(principal, ratePercent / 100, months, 12);
      const monthlyRate = ratePercent / 1200;
      return verified({
        formulaName: 'Reducing-balance Loan EMI',
        inputs: { ...emptyInputs(), principal, annualRatePercent: ratePercent, years: months / 12, paymentsPerYear: 12 },
        result,
        formattedResult: `${money.format(result)} per month`,
        formula: 'EMI = P × r × (1+r)^n / ((1+r)^n − 1)',
        substitution: `P=${money.format(principal)}, monthly r=${monthlyRate.toFixed(6)}, n=${months}; EMI=${money.format(result)}`,
        interpretation: `The verified monthly payment is approximately ${money.format(result)} for ${months} payments.`,
        limitations: 'Excludes fees, insurance, taxes, prepayments and rate changes; lender rounding may differ.',
      });
    }
  }

  if (lower.includes('cagr') && timeYears !== null) {
    const initial = amountAfter(message, ['from', 'initial', 'starting']);
    const final = amountAfter(message, ['to', 'final', 'ending', 'became']);
    if (initial !== null && final !== null) {
      const result = FinanceMathEngine.calculateCAGR(initial, final, timeYears) * 100;
      return verified({
        formulaName: 'Compound Annual Growth Rate (CAGR)',
        inputs: { ...emptyInputs(), principal: initial, years: timeYears },
        result,
        formattedResult: `${result.toFixed(2)}% per year`,
        formula: 'CAGR = (Ending value / Beginning value)^(1/t) − 1',
        substitution: `(${final}/${initial})^(1/${timeYears}) − 1 = ${(result / 100).toFixed(6)}`,
        interpretation: `The smoothed annual growth rate is ${result.toFixed(2)}%.`,
        limitations: 'CAGR hides volatility and cash flows and is not a guaranteed future return.',
      });
    }
  }

  if (lower.includes('savings rate')) {
    const savings = amountAfter(message, ['save', 'savings']);
    const income = amountAfter(message, ['income', 'earn', 'salary']);
    if (savings !== null && income !== null) {
      const result = FinanceMathEngine.calculateSavingsRate(savings, income);
      return verified({
        formulaName: 'Savings Rate',
        inputs: { ...emptyInputs(), payment: savings, income },
        result,
        formattedResult: `${result.toFixed(2)}%`,
        formula: 'Savings rate = monthly savings / net monthly income × 100',
        substitution: `${money.format(savings)} / ${money.format(income)} × 100 = ${result.toFixed(2)}%`,
        interpretation: `${result.toFixed(2)}% of the stated net income is being saved.`,
        limitations: 'The definition of savings should be applied consistently and may exclude debt principal payments.',
      });
    }
  }

  if (lower.includes('debt-to-income') || lower.includes('dti')) {
    const debt = amountAfter(message, ['debt payments', 'debt', 'emi']);
    const income = amountAfter(message, ['gross income', 'income', 'earn', 'salary']);
    if (debt !== null && income !== null) {
      const result = FinanceMathEngine.calculateDTI(debt, income);
      return verified({
        formulaName: 'Debt-to-Income Ratio',
        inputs: { ...emptyInputs(), debt, income },
        result,
        formattedResult: `${result.toFixed(2)}%`,
        formula: 'DTI = monthly debt payments / gross monthly income × 100',
        substitution: `${money.format(debt)} / ${money.format(income)} × 100 = ${result.toFixed(2)}%`,
        interpretation: `${result.toFixed(2)}% of the stated gross monthly income goes to debt payments.`,
        limitations: 'Lenders may define included debts and income differently.',
      });
    }
  }

  if (lower.includes('emergency fund') && lower.includes('month')) {
    const principal = amountAfter(message, ['fund', 'savings', 'saved']);
    const expenses = amountAfter(message, ['expenses', 'essential spending', 'monthly cost']);
    if (principal !== null && expenses !== null) {
      const result = FinanceMathEngine.calculateEmergencyFundCoverage(principal, expenses);
      return verified({
        formulaName: 'Emergency-fund Coverage',
        inputs: { ...emptyInputs(), principal, expenses },
        result,
        formattedResult: `${result.toFixed(2)} months`,
        formula: 'Coverage months = liquid emergency savings / essential monthly expenses',
        substitution: `${money.format(principal)} / ${money.format(expenses)} = ${result.toFixed(2)} months`,
        interpretation: `The stated liquid savings cover about ${result.toFixed(2)} months of essential expenses.`,
        limitations: 'Actual needs depend on income stability, dependants, insurance and expense volatility.',
      });
    }
  }

  return unusedCalculation();
}
