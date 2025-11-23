import type {
    LoanInputs,
    SimulationResult,
    TimelinePoint,
    StrategyResult,
    MultiScenarioResult,
    PortfolioInputs,
    PortfolioResult
} from '../types';

export const DEBT_RATIO_MAX = 0.37;

export const kFormat = (value: number): string => {
    if (Math.abs(value) >= 1000000) {
        return '€' + (value / 1000000).toFixed(2) + 'M';
    }
    if (Math.abs(value) >= 1000) {
        return '€' + (value / 1000).toFixed(1) + 'k';
    }
    return '€' + value.toFixed(2);
};

export const computeMonthlyPayment = (principal: number, annualInterestRate: number, creditYears: number): number => {
    const monthlyRate = annualInterestRate / 100 / 12;
    const numberOfMonths = creditYears * 12;
    if (monthlyRate === 0) return principal / numberOfMonths;
    return principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -numberOfMonths)));
};

export const calculateSimulation = (inputs: LoanInputs): SimulationResult => {
    const notaryFees = inputs.propertyPrice * (inputs.notaryFeesRate / 100);
    const borrowedPrincipal = Math.max(inputs.propertyPrice - inputs.manualDownPayment, 0);
    const initialCashInvested = inputs.manualDownPayment + notaryFees;

    // Baseline monthly P+I
    const monthlyPaymentPI = computeMonthlyPayment(borrowedPrincipal, inputs.interestRateSingle, inputs.creditYears);
    const monthlyPaymentPIOverdrive = monthlyPaymentPI * (1 + inputs.paymentOverdrive / 100);
    const monthlyInsurance = borrowedPrincipal * (inputs.insuranceYearlyRate / 100) / 12;
    const monthlyIncomeInjection = inputs.monthlyIncome * (inputs.incomeInjection / 100);

    const finalMonthlyPayment = monthlyPaymentPIOverdrive + monthlyInsurance + inputs.propertyTax + monthlyIncomeInjection;

    // Timeline Simulation
    const timeline: TimelinePoint[] = [];
    let monthsCount = 0;
    let remainingBalance = borrowedPrincipal;
    let totalInterest = 0;
    const monthlyRate = inputs.interestRateSingle / 100 / 12;

    let currentPropertyValue = inputs.propertyPrice;
    let currentRent = inputs.monthlyRent * (inputs.occupancyRate / 100);

    let totalCashInvestedSoFar = initialCashInvested;
    let equityBreakEvenMonth = -1;

    // Loop up to 50 years max
    while (remainingBalance > 0 && monthsCount < 600) {
        monthsCount++;
        const year = Math.ceil(monthsCount / 12);

        // 1. Interest & Principal
        const interestThisMonth = remainingBalance * monthlyRate;
        totalInterest += interestThisMonth;

        let principalPaid = (monthlyPaymentPIOverdrive + monthlyIncomeInjection) - interestThisMonth;
        // If standard payment covers more than interest, good. If not (negative amortization), handle it? 
        // Standard French loans don't usually allow negative amortization, so principalPaid >= 0.
        if (principalPaid < 0) principalPaid = 0;
        // Cap principal at remaining balance
        if (principalPaid > remainingBalance) principalPaid = remainingBalance;

        remainingBalance -= principalPaid;

        // 2. Rent Indexation (Annual)
        if (monthsCount > 1 && monthsCount % 12 === 1) {
            currentRent *= (1 + (inputs.rentIndexationRate || 0) / 100);
        }

        // 3. Property Appreciation (Monthly Compounding approximation)
        const monthlyAppreciationRate = (inputs.propertyAppreciationRate || 0) / 100 / 12;
        currentPropertyValue *= (1 + monthlyAppreciationRate);

        // 4. Cashflow
        // Cashflow = Rent - Expenses - Mortgage Payment
        // Expenses also likely increase with inflation, but let's keep it simple or index them too?
        // Let's assume expenses index same as rent for simplicity
        const currentExpenses = inputs.monthlyExpenses * (currentRent / (inputs.monthlyRent * (inputs.occupancyRate / 100) || 1));

        const monthlyCashflow = currentRent - currentExpenses - finalMonthlyPayment;

        // 5. Total Cash Invested Logic
        // If cashflow is negative, you pour money in. If positive, you get money back (reducing net invested).
        // However, "Break Even" usually means "When do I have more Equity than I put in?"
        // So we subtract positive cashflow from invested, add negative cashflow to invested.
        totalCashInvestedSoFar -= monthlyCashflow;

        // 6. Equity
        const equity = currentPropertyValue - remainingBalance;

        // 7. Net Result (Wealth Effect)
        const netResult = equity - totalCashInvestedSoFar;

        if (equityBreakEvenMonth === -1 && netResult > 0) {
            equityBreakEvenMonth = monthsCount;
        }

        timeline.push({
            month: monthsCount,
            year,
            remainingBalance,
            paidInterest: interestThisMonth,
            paidPrincipal: principalPaid,
            propertyValue: currentPropertyValue,
            equity,
            monthlyCashflow,
            cumulativeCashflow: -totalCashInvestedSoFar + initialCashInvested, // Just the cashflow part
            totalCashInvestedSoFar,
            netResult
        });

        if (remainingBalance <= 0.1) break; // Floating point tolerance
    }

    const totalInsurance = monthlyInsurance * monthsCount;
    const totalTax = inputs.propertyTax * monthsCount;
    const totalPI = (monthlyPaymentPIOverdrive + monthlyIncomeInjection) * monthsCount;
    const totalPaid = totalPI + totalInsurance + totalTax;

    const ratio = (inputs.monthlyIncome > 0) ? (finalMonthlyPayment / inputs.monthlyIncome) : 0;

    // Snapshot Metrics (Year 1 Average)
    const firstYearPoints = timeline.slice(0, 12);
    const avgMonthlyPrincipal = firstYearPoints.reduce((sum, p) => sum + p.paidPrincipal, 0) / firstYearPoints.length;
    const avgMonthlyAppreciation = (timeline[11]?.propertyValue - inputs.propertyPrice) / 12 || 0;
    const initialNetRentCashflow = (inputs.monthlyRent * (inputs.occupancyRate / 100)) - inputs.monthlyExpenses - finalMonthlyPayment;

    // Total Economic Gain = Cashflow + Principal + Appreciation
    const totalMonthlyEconomicGain = initialNetRentCashflow + avgMonthlyPrincipal + avgMonthlyAppreciation;

    // ROI Calculations
    const rentROI = finalMonthlyPayment > 0 ? (initialNetRentCashflow / finalMonthlyPayment) * 100 : 0;

    // Total ROI (Annualized based on Year 1 Economic Gain vs Initial Cash)
    const totalROI = initialCashInvested > 0 ? ((totalMonthlyEconomicGain * 12) / initialCashInvested) * 100 : 0;

    // Break Evens
    let cashflowBreakEvenMonth = timeline.findIndex(p => p.monthlyCashflow >= 0);
    const cashflowBreakEvenYears = cashflowBreakEvenMonth >= 0 ? (cashflowBreakEvenMonth / 12).toFixed(1) : 'Never';

    const equityBreakEvenYears = equityBreakEvenMonth >= 0 ? (equityBreakEvenMonth / 12).toFixed(1) : '> Term';

    const maxLoan = calcMaxLoan(inputs);

    return {
        borrowedPrincipal,
        finalMonthlyPayment,
        totalPaid,
        totalInterest,
        debtRatio: ratio,
        timeline,

        rentIncome: inputs.monthlyRent * (inputs.occupancyRate / 100),
        netRentCashflow: initialNetRentCashflow,
        monthlyPrincipalPaid: avgMonthlyPrincipal,
        monthlyAppreciation: avgMonthlyAppreciation,
        totalMonthlyEconomicGain,

        rentROI,
        totalROI,

        breakEvenYears: cashflowBreakEvenYears,
        equityBreakEvenYears,

        maxLoan,
        finalPropertyValue: timeline[timeline.length - 1]?.propertyValue || inputs.propertyPrice,
        notaryFees,
        monthlyInsurance,
        totalCashInvested: initialCashInvested
    };
};

export const calcMaxLoan = (inp: LoanInputs): number => {
    const maxRatioPayment = inp.monthlyIncome * DEBT_RATIO_MAX;
    let low = 0, high = 3000000, principal = 0;

    for (let i = 0; i < 50; i++) {
        const mid = (low + high) / 2;
        const monthlyPaymentPI = computeMonthlyPayment(mid, inp.interestRateSingle, inp.creditYears);
        const monthlyPaymentPIOverdrive = monthlyPaymentPI * (1 + inp.paymentOverdrive / 100);
        const monthlyInsurance = mid * (inp.insuranceYearlyRate / 100) / 12;
        const injection = inp.monthlyIncome * (inp.incomeInjection / 100);
        const finalPayment = monthlyPaymentPIOverdrive + monthlyInsurance + inp.propertyTax + injection;

        if (finalPayment > maxRatioPayment) {
            high = mid;
        } else {
            low = mid;
        }
        principal = low;
    }
    return principal;
};

export const findStrategies = (inp: LoanInputs): StrategyResult[] => {
    const borrowedPrincipal = Math.max(inp.propertyPrice - inp.manualDownPayment, 0);
    const combos: StrategyResult[] = [];

    for (let od = 0; od <= 100; od += 10) {
        for (let inj = 0; inj <= 50; inj += 5) {
            const monthlyPaymentPI = computeMonthlyPayment(borrowedPrincipal, inp.interestRateSingle, inp.creditYears);
            const monthlyPaymentPIOverdrive = monthlyPaymentPI * (1 + od / 100);
            const monthlyInsurance = borrowedPrincipal * (inp.insuranceYearlyRate / 100) / 12;
            const monthlyIncomeInjection = inp.monthlyIncome * (inj / 100);
            const finalMonthlyPayment = monthlyPaymentPIOverdrive + monthlyInsurance + inp.propertyTax + monthlyIncomeInjection;

            const ratio = (inp.monthlyIncome > 0) ? (finalMonthlyPayment / inp.monthlyIncome) : 0;

            if (ratio <= DEBT_RATIO_MAX) {
                // Quick sim
                let monthsCount = 0;
                let remainingBalance = borrowedPrincipal;
                let totalInterest = 0;
                const monthlyRate = inp.interestRateSingle / 100 / 12;
                while (remainingBalance > 0 && monthsCount < 600) {
                    monthsCount++;
                    const interestThisMonth = remainingBalance * monthlyRate;
                    totalInterest += interestThisMonth;
                    let principalPaid = monthlyPaymentPIOverdrive + monthlyIncomeInjection - interestThisMonth;
                    if (principalPaid < 0) principalPaid = 0;
                    remainingBalance -= principalPaid;
                }

                const rentIncome = inp.monthlyRent * (inp.occupancyRate / 100);
                const netRentCashflow = rentIncome - inp.monthlyExpenses - finalMonthlyPayment;

                combos.push({
                    overdrive: od,
                    injection: inj,
                    monthsCount,
                    totalInterest,
                    netRentCashflow
                });
            }
        }
    }

    combos.sort((a, b) => a.monthsCount - b.monthsCount);
    return combos.slice(0, 3);
};

export const getRecommendations = (inputs: LoanInputs, result: SimulationResult): string[] => {
    const recs: string[] = [];

    if (inputs.manualDownPayment < (inputs.propertyPrice * 0.1)) {
        recs.push(`Down payment ${kFormat(inputs.manualDownPayment)} is low (<10%). Increasing it reduces risk and monthly payments.`);
    }

    if (result.debtRatio > DEBT_RATIO_MAX) {
        recs.push(`Debt Ratio Alert: ${(result.debtRatio * 100).toFixed(1)}% > 37%. You must lower the loan amount or increase income.`);
    }

    if (result.netRentCashflow < 0) {
        recs.push(`Negative Cashflow: You pay ${kFormat(Math.abs(result.netRentCashflow))} monthly from your pocket.`);
        if (result.totalMonthlyEconomicGain > 0) {
            recs.push(`HOWEVER: You are gaining ${kFormat(result.totalMonthlyEconomicGain)} in total wealth monthly (Equity + Appreciation). This is a "forced savings" plan.`);
        }
    } else {
        recs.push(`Positive Cashflow! You earn ${kFormat(result.netRentCashflow)} monthly.`);
    }

    recs.push(`Real Profit Break-Even: It takes ${result.equityBreakEvenYears} years for your Net Worth to exceed your Total Cash Invested.`);

    return recs;
};

export const calculateMultiScenarios = (inputs: LoanInputs): MultiScenarioResult[] => {
    const durations = [10, 15, 20, 25];
    const borrowedPrincipal = Math.max(inputs.propertyPrice - inputs.manualDownPayment, 0);

    return durations.map(dy => {
        const monthlyPaymentPI = computeMonthlyPayment(borrowedPrincipal, inputs.interestRateSingle, dy);
        const monthlyPaymentPIOverdrive = monthlyPaymentPI * (1 + inputs.paymentOverdrive / 100);
        const monthlyInsurance = borrowedPrincipal * (inputs.insuranceYearlyRate / 100) / 12;
        const monthlyIncomeInjection = inputs.monthlyIncome * (inputs.incomeInjection / 100);
        const finalMonthlyPayment = monthlyPaymentPIOverdrive + monthlyInsurance + inputs.propertyTax + monthlyIncomeInjection;

        const ratio = (inputs.monthlyIncome > 0) ? (finalMonthlyPayment / inputs.monthlyIncome) : 0;

        let totalInterest = 0;
        let monthsCount = 0;
        let remainingBalance = borrowedPrincipal;
        const monthlyRate = inputs.interestRateSingle / 100 / 12;

        while (remainingBalance > 0 && monthsCount < 600) {
            monthsCount++;
            const interestThisMonth = remainingBalance * monthlyRate;
            totalInterest += interestThisMonth;
            let principalPaid = monthlyPaymentPIOverdrive + monthlyIncomeInjection - interestThisMonth;
            if (principalPaid < 0) principalPaid = 0;
            remainingBalance -= principalPaid;
        }

        const totalInsurance = monthsCount * monthlyInsurance;
        const totalTax = monthsCount * inputs.propertyTax;
        const totalPI = monthsCount * (monthlyPaymentPIOverdrive + monthlyIncomeInjection);
        const totalPaid = totalPI + totalInsurance + totalTax;

        const rentIncome = inputs.monthlyRent * (inputs.occupancyRate / 100);
        const netRentCashflow = rentIncome - inputs.monthlyExpenses - finalMonthlyPayment;

        return {
            duration: dy,
            monthlyPayment: finalMonthlyPayment,
            totalInterest,
            totalPaid,
            ratio,
            cashflow: netRentCashflow,
            isViable: ratio <= DEBT_RATIO_MAX
        };
    });
};

export const calculatePortfolio = (inp: PortfolioInputs): PortfolioResult => {
    const weightedRentA = inp.currentHomeRentIncome * 0.7;
    const weightedRentB = inp.invRent * 0.7;
    const totalBankIncome = inp.monthlyIncome + weightedRentA + weightedRentB;

    const invPrincipal = Math.max(inp.invPrice - inp.invDownPayment, 0);
    const invMonthlyPI = computeMonthlyPayment(invPrincipal, inp.invRate, inp.invDuration);
    const invMonthlyTotal = invMonthlyPI;

    const totalDebtPayments = inp.currentHomeMortgage + invMonthlyTotal;
    const portfolioRatio = (totalBankIncome > 0) ? (totalDebtPayments / totalBankIncome) : 0;

    const totalIn = inp.monthlyIncome + inp.currentHomeRentIncome + inp.invRent;
    const totalOut = inp.currentHomeMortgage + invMonthlyTotal + inp.newLivingRent;
    const netCashflow = totalIn - totalOut;

    const netWorthProjection = [];
    let valA = inp.currentHomeValue;
    let valB = inp.invPrice;
    let debtB = invPrincipal;

    for (let y = 0; y <= 10; y++) {
        if (y > 0) {
            const interestB = debtB * (inp.invRate / 100);
            const principalB = (invMonthlyPI * 12) - interestB;
            debtB -= principalB;
            if (debtB < 0) debtB = 0;

            valA = valA * 1.02;
            valB = valB * 1.02;
        }

        netWorthProjection.push({
            year: y,
            equity: (valA + valB) - debtB,
            debt: debtB
        });
    }

    return {
        totalIncome: totalIn,
        totalExpenses: totalOut,
        netCashflow,
        bankDebtRatio: portfolioRatio,
        netWorthProjection
    };
};
