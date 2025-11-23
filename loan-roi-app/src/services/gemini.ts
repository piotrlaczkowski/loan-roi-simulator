import { GoogleGenerativeAI } from "@google/generative-ai";
import type { SimulationResult, LoanInputs, MultiScenarioResult, StrategyResult } from "../types";
import { kFormat } from "../utils/calculations";

export const listAvailableModels = async (apiKey: string): Promise<string[]> => {
    if (!apiKey) return [];

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            console.error("Error fetching models:", response.statusText);
            return [];
        }

        const data = await response.json();

        // Filter for models that support generateContent
        const generativeModels = data.models
            .filter((model: any) => model.supportedGenerationMethods?.includes('generateContent'))
            .map((model: any) => model.name.replace('models/', ''))
            .sort();

        return generativeModels;
    } catch (error: any) {
        console.error("Error listing models:", error);
        return [];
    }
};

export const generateAIAnalysis = async (apiKey: string, inputs: LoanInputs, result: SimulationResult): Promise<string> => {
    if (!apiKey) return "Please provide a Gemini API Key in settings.";

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const selectedModel = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
        const model = genAI.getGenerativeModel({ model: selectedModel });

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

export const generateDetailedBreakdown = async (
    apiKey: string,
    inputs: LoanInputs,
    result: SimulationResult,
    multiResults?: MultiScenarioResult[],
    strategies?: StrategyResult[]
): Promise<string> => {
    if (!apiKey) return "Please provide a Gemini API Key in settings.";

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const selectedModel = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
        const model = genAI.getGenerativeModel({ model: selectedModel });

        const prompt = `
      You are a financial education expert. Provide a DETAILED, educational breakdown of this real estate investment simulation.
      
      **INPUTS:**
      - Property Price: ${kFormat(inputs.propertyPrice)}
      - Down Payment: ${kFormat(inputs.manualDownPayment)} (${((inputs.manualDownPayment / inputs.propertyPrice) * 100).toFixed(1)}%)
      - Loan Amount: ${kFormat(result.borrowedPrincipal)}
      - Duration: ${inputs.creditYears} years
      - Interest Rate: ${inputs.interestRateSingle}%
      - Monthly Income: ${kFormat(inputs.monthlyIncome)}
      - Expected Rent: ${kFormat(inputs.monthlyRent)}
      - Occupancy: ${inputs.occupancyRate}%
      - Monthly Expenses: ${kFormat(inputs.monthlyExpenses)}
      - Property Tax: ${kFormat(inputs.propertyTax)}
      - Appreciation Rate: ${inputs.propertyAppreciationRate}%/year
      
      **OUTPUTS:**
      - Monthly Payment (Total): ${kFormat(result.finalMonthlyPayment)}
      - Debt Ratio: ${(result.debtRatio * 100).toFixed(2)}%
      - Monthly Cashflow: ${kFormat(result.netRentCashflow)}
      - Monthly Principal Paid: ${kFormat(result.monthlyPrincipalPaid)}
      - Monthly Appreciation: ${kFormat(result.monthlyAppreciation)}
      - **Total Economic Gain**: ${kFormat(result.totalMonthlyEconomicGain)}
      - Cashflow Break-Even: ${result.breakEvenYears} years
      - **Equity Break-Even**: ${result.equityBreakEvenYears} years
      - Total Interest Paid: ${kFormat(result.totalInterest)}
      - Final Property Value: ${kFormat(result.finalPropertyValue)}
      
      ${multiResults && multiResults.length > 0 ? `
      **ALTERNATIVE DURATIONS:**
      ${multiResults.map(r => `- ${r.duration} years: Payment ${kFormat(r.monthlyPayment)}, Total Interest ${kFormat(r.totalInterest)}, Cashflow ${kFormat(r.cashflow)}`).join('\n')}
      ` : ''}
      
      ${strategies && strategies.length > 0 ? `
      **OPTIMIZATION STRATEGIES:**
      ${strategies.map(s => `- ${s.name}: Saves ${kFormat(s.interestSaved)}, Payoff in ${(s.monthsCount / 12).toFixed(1)} years`).join('\n')}
      ` : ''}
      
      **YOUR TASK:**
      
      1. **Why is Cashflow Negative?**
         - Break down the math: Rent Income vs Total Monthly Costs
         - Explain what this means in simple terms
         
      2. **Why is Break-Even So Late?**
         - Explain the concept of "Total Cash Invested" (down payment + cumulative negative cashflow)
         - Explain why it takes time for equity to exceed this
         
      3. **The Hidden Profit: Economic Gain**
         - Explain the THREE components: Cashflow + Principal Paydown + Appreciation
         - Why this matters more than monthly cashflow
         - Use specific numbers from this simulation
         
      4. **Is This Still Worth It?**
         - Calculate the true annualized return
         - Compare to alternative investments (stocks, bonds, savings)
         - Discuss tax benefits (if applicable in France)
         
      5. **Actionable Recommendations**
         - What can be changed to improve cashflow?
         - What can be changed to reach break-even faster?
         - Should the investor proceed?
      
      Use clear headings, bullet points, and specific numbers. Make it educational and empowering.
    `;

        const resultGen = await model.generateContent(prompt);
        const response = await resultGen.response;
        return response.text();
    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return `Error generating breakdown: ${error.message || "Unknown error"}`;
    }
};

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export const chatWithGemini = async (
    apiKey: string,
    messages: ChatMessage[],
    inputs: LoanInputs,
    result: SimulationResult,
    multiResults?: MultiScenarioResult[],
    strategies?: StrategyResult[],
    onStream?: (chunk: string) => void
): Promise<string> => {
    if (!apiKey) return "Please provide a Gemini API Key in settings.";

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const selectedModel = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
        const model = genAI.getGenerativeModel({ model: selectedModel });

        // Build context
        const contextPrompt = `
      You are a helpful financial advisor assistant. You have access to the following simulation data:
      
      **Current Simulation:**
      - Property Price: ${kFormat(inputs.propertyPrice)}
      - Down Payment: ${kFormat(inputs.manualDownPayment)}
      - Loan: ${kFormat(result.borrowedPrincipal)} at ${inputs.interestRateSingle}% for ${inputs.creditYears} years
      - Monthly Payment: ${kFormat(result.finalMonthlyPayment)}
      - Monthly Cashflow: ${kFormat(result.netRentCashflow)}
      - Economic Gain: ${kFormat(result.totalMonthlyEconomicGain)}
      - Debt Ratio: ${(result.debtRatio * 100).toFixed(2)}%
      - Break-Even: ${result.equityBreakEvenYears} years
      - Total ROI: ${result.totalROI.toFixed(2)}%
      
      ${multiResults && multiResults.length > 0 ? `
      **Duration Comparison:**
      ${multiResults.map(r => `- ${r.duration} years: Payment ${kFormat(r.monthlyPayment)}, Interest ${kFormat(r.totalInterest)}, Cashflow ${kFormat(r.cashflow)}`).join('\n')}
      ` : ''}
      
      ${strategies && strategies.length > 0 ? `
      **Turbo Strategies:**
      ${strategies.map(s => `- ${s.name}: ${s.description}, Saves ${kFormat(s.interestSaved)}, Payoff in ${(s.monthsCount / 12).toFixed(1)} years`).join('\n')}
      ` : ''}
      
      Answer the user's questions clearly and concisely. Use the data above to provide specific, actionable advice.
      If asked about concepts, explain them simply. If asked for recommendations, be specific with numbers.
    `;

        // Build chat history
        const chatHistory = messages.map(msg => ({
            role: msg.role === 'user' ? 'user' as const : 'model' as const,
            parts: [{ text: msg.content }]
        }));

        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: contextPrompt }] },
                { role: 'model', parts: [{ text: 'I understand. I have access to your simulation data and I\'m ready to answer your questions about this investment.' }] },
                ...chatHistory
            ]
        });

        const lastMessage = messages[messages.length - 1];

        // Use streaming if callback provided
        if (onStream) {
            const result_stream = await chat.sendMessageStream(lastMessage.content);
            let fullText = '';

            for await (const chunk of result_stream.stream) {
                const chunkText = chunk.text();
                fullText += chunkText;
                onStream(chunkText);
            }

            return fullText;
        } else {
            // Non-streaming fallback
            const result_chat = await chat.sendMessage(lastMessage.content);
            const response = await result_chat.response;
            return response.text();
        }
    } catch (error: any) {
        console.error("Gemini Chat Error:", error);
        return `Error: ${error.message || "Unknown error"}`;
    }
};

