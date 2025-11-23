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
    rentIndexationRate: number;
    propertyAppreciationRate: number;
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

    rentIncome: number;
    netRentCashflow: number;
    monthlyPrincipalPaid: number;
    monthlyAppreciation: number;
    totalMonthlyEconomicGain: number;

    rentROI: number;
    totalROI: number;

    breakEvenYears: number | string;
    equityBreakEvenYears: number | string;

    maxLoan: number;
    finalPropertyValue: number;
    notaryFees: number;
    monthlyInsurance: number;
    totalCashInvested: number;
}

export interface TimelinePoint {
    month: number;
    year: number;
    remainingBalance: number;
    paidInterest: number;
    paidPrincipal: number;
    propertyValue: number;
    equity: number;
    monthlyCashflow: number;
    cumulativeCashflow: number;
    totalCashInvestedSoFar: number;
    netResult: number;
}

export interface StrategyResult {
    name: string;
    description: string;
    overdrive: number;
    injection: number;
    monthlyPayment: number;
    monthsCount: number;
    totalInterest: number;
    interestSaved: number;
    yearsSaved: number;
    netRentCashflow: number;
    debtRatio: number;
}

export interface MultiScenarioResult {
    duration: number;
    monthlyPayment: number;
    totalInterest: number;
    totalPaid: number;
    ratio: number;
    cashflow: number;
    isViable: boolean;
    equityAt10Years: number;
}

export interface PortfolioResult {
    totalIncome: number;
    totalExpenses: number;
    netCashflow: number;
    bankDebtRatio: number;
    netWorthProjection: PortfolioTimelinePoint[];
}

export interface PortfolioTimelinePoint {
    year: number;
    equity: number;
    debt: number;
    assets: number;
}
