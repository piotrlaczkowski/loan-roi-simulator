import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SimulationResult, LoanInputs } from "../types";
import { kFormat } from "../utils/calculations";

export const generateAIAnalysis = async (apiKey: string, inputs: LoanInputs, result: SimulationResult): Promise<string> => {
    if (!apiKey) return "Please provide a Gemini API Key in settings.";

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      Act as a senior financial advisor and real estate expert. Analyze the following real estate investment scenario and provide a concise, actionable report.
      
      **Investment Profile:**
      - Property Price: ${kFormat(inputs.propertyPrice)}
      - Down Payment: ${kFormat(inputs.manualDownPayment)}
      - Loan Duration: ${inputs.creditYears} years
      - Interest Rate: ${inputs.interestRateSingle}%
      - Monthly Income: ${kFormat(inputs.monthlyIncome)}
      
      **Simulation Results:**
      - Monthly Mortgage Payment: ${kFormat(result.finalMonthlyPayment)}
      - Debt Ratio: ${(result.debtRatio * 100).toFixed(2)}% (Limit: 37%)
      - Monthly Cashflow: ${kFormat(result.netRentCashflow)}
      - Total Economic Gain (Monthly): ${kFormat(result.totalMonthlyEconomicGain)}
      - Real Profit Break-Even: ${result.equityBreakEvenYears} years
      - Total ROI (Annualized): ${result.totalROI.toFixed(2)}%
      
      **Task:**
      1. **Verdict**: Is this a good investment? (Yes/No/Caution)
      2. **Risk Analysis**: Highlight key risks (cashflow, debt ratio, market).
      3. **Strategy**: Suggest 1-2 specific moves to improve this (e.g., "Increase down payment to X to turn cashflow positive" or "Use the Turbo Strategy to save Y in interest").
      4. **Explanation**: Briefly explain why the cashflow might be negative but the investment is still "profitable" (Economic Gain).
      
      Keep it professional, encouraging, but realistic. Format with Markdown.
    `;

        const resultGen = await model.generateContent(prompt);
        const response = await resultGen.response;
        return response.text();
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return `Error generating analysis: ${error.message || "Unknown error"}`;
    }
};
