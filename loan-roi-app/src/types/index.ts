export interface LoanInputs {
    propertyPrice: number;
    manualDownPayment: number;
    notaryFeesRate: number;
    insuranceYearlyRate: number;
    monthlyIncome: number;
    creditYears: number;
    interestRateSingle: number;
    paymentOverdrive: number;
    incomeInjection: number;
    propertyTax: number;
    monthlyRent: number;
    monthlyExpenses: number;
    occupancyRate: number;
    // New:
    rentIndexationRate: number; // Annual rent increase %
    propertyAppreciationRate: number; // Annual property value increase %
}

export interface PortfolioInputs {
    monthlyIncome: number;
    currentHomeValue: number;
    currentHomeMortgage: number;
    currentHomeRentIncome: number;
    invPrice: number;
    invDownPayment: number;
    invRate: number;
    invDuration: number;
    invRent: number;
    newLivingRent: number;
}

export interface SimulationResult {
    borrowedPrincipal: number;
    finalMonthlyPayment: number;
    totalPaid: number;
    totalInterest: number;
    debtRatio: number;
    timeline: TimelinePoint[];

    // Monthly Snapshot (Year 1)
    rentIncome: number;
    netRentCashflow: number; // Cash in pocket
    monthlyPrincipalPaid: number; // Equity built (avg year 1)
    monthlyAppreciation: number; // Value gain (avg year 1)
    totalMonthlyEconomicGain: number; // Cashflow + Principal + Appreciation

    rentROI: number; // Cash-on-Cash ROI
    totalROI: number; // (Economic Gain * 12) / Total Invested

    breakEvenYears: number | string; // Cashflow break-even (if negative starts)
    equityBreakEvenYears: number | string; // When Net Worth > Total Cash Put In

    maxLoan: number;
    finalPropertyValue: number;
    notaryFees: number;
    monthlyInsurance: number;
    totalCashInvested: number; // Down payment + Notary
}

export interface TimelinePoint {
    month: number;
    year: number;
    remainingBalance: number;
    paidInterest: number;
    paidPrincipal: number;

    propertyValue: number;
    equity: number; // Value - Debt

    monthlyCashflow: number;
    cumulativeCashflow: number; // Sum of all monthly cashflows (usually negative if subsidizing)

    totalCashInvestedSoFar: number; // Initial + Cumulative Negative Cashflow

    netResult: number; // Equity - TotalCashInvestedSoFar
}

export interface StrategyResult {
    overdrive: number;
    injection: number;
    monthsCount: number;
    totalInterest: number;
    netRentCashflow: number;
}

export interface MultiScenarioResult {
    duration: number;
    monthlyPayment: number;
    totalInterest: number;
    totalPaid: number;
    ratio: number;
    cashflow: number;
    isViable: boolean;
}

export interface PortfolioResult {
    totalIncome: number;
    totalExpenses: number;
    netCashflow: number;
    bankDebtRatio: number;
    netWorthProjection: { year: number; equity: number; debt: number }[];
}
