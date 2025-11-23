import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Wallet, Home, Zap, Layers, Briefcase, BarChart3, Settings, Bot, Info, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { InputGroup } from './InputGroup';
import { ResultsCard } from './ResultsCard';
import { Charts } from './Charts';
import { SettingsModal } from './SettingsModal';
import type { LoanInputs, SimulationResult, MultiScenarioResult, PortfolioInputs, PortfolioResult, StrategyResult } from '../types';
import {
    calculateSimulation,
    kFormat,
    DEBT_RATIO_MAX,
    findStrategies,
    getRecommendations,
    calculateMultiScenarios,
    calculatePortfolio
} from '../utils/calculations';
import { generateAIAnalysis } from '../services/gemini';

const INITIAL_LOAN_STATE: LoanInputs = {
    propertyPrice: 250000,
    manualDownPayment: 25000,
    notaryFeesRate: 8,
    insuranceYearlyRate: 0.3,
    monthlyIncome: 4000,
    creditYears: 25,
    interestRateSingle: 3.7,
    paymentOverdrive: 10,
    incomeInjection: 0,
    propertyTax: 100,
    monthlyRent: 1200,
    monthlyExpenses: 150,
    occupancyRate: 90,
    rentIndexationRate: 1.0,
    propertyAppreciationRate: 1.0
};

const INITIAL_PORTFOLIO_STATE: PortfolioInputs = {
    monthlyIncome: 4000,
    currentHomeValue: 300000,
    currentHomeMortgage: 1000,
    currentHomeRentIncome: 1400,
    invPrice: 200000,
    invDownPayment: 20000,
    invRate: 3.8,
    invDuration: 20,
    invRent: 1100,
    newLivingRent: 1200
};

export const Dashboard: React.FC = () => {
    const [inputs, setInputs] = useState<LoanInputs>(INITIAL_LOAN_STATE);
    const [portfolioInputs, setPortfolioInputs] = useState<PortfolioInputs>(INITIAL_PORTFOLIO_STATE);

    const [result, setResult] = useState<SimulationResult | null>(null);
    const [multiResults, setMultiResults] = useState<MultiScenarioResult[]>([]);
    const [portfolioResult, setPortfolioResult] = useState<PortfolioResult | null>(null);
    const [recommendations, setRecommendations] = useState<string[]>([]);
    const [strategies, setStrategies] = useState<StrategyResult[]>([]);

    const [activeTab, setActiveTab] = useState<'single' | 'multi' | 'strategy' | 'portfolio'>('single');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const res = calculateSimulation(inputs);
        setResult(res);
        setRecommendations(getRecommendations(inputs, res));
        setAiAnalysis('');

        if (activeTab === 'strategy') {
            setStrategies(findStrategies(inputs));
        }
        if (activeTab === 'multi') {
            setMultiResults(calculateMultiScenarios(inputs));
        }
    }, [inputs, activeTab]);

    useEffect(() => {
        if (activeTab === 'portfolio') {
            setPortfolioResult(calculatePortfolio(portfolioInputs));
        }
    }, [portfolioInputs, activeTab]);

    const updateInput = (key: keyof LoanInputs, value: number) => {
        setInputs(prev => ({ ...prev, [key]: value }));
    };

    const updatePortfolioInput = (key: keyof PortfolioInputs, value: number) => {
        setPortfolioInputs(prev => ({ ...prev, [key]: value }));
    };

    const handleAnalyze = async () => {
        if (!result) return;
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            setIsSettingsOpen(true);
            return;
        }

        setIsAnalyzing(true);
        const analysis = await generateAIAnalysis(apiKey, inputs, result);
        setAiAnalysis(analysis);
        setIsAnalyzing(false);
    };

    if (!result) return null;

    return (
        <div className="container">
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onSave={() => { }}
            />

            <header className="flex justify-between items-center mb-6">
                <div className="flex-1 text-center">
                    <h1 className="text-4xl mb-2">
                        <span className="text-gradient">Loan & ROI Simulator</span>
                    </h1>
                    <p className="text-muted">Advanced Financial Modeling for Real Estate Investors</p>
                </div>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors"
                    title="Settings"
                >
                    <Settings size={24} />
                </button>
            </header>

            {/* Navigation */}
            <div className="nav-tabs">
                <button
                    className={`nav-link ${activeTab === 'single' ? 'active' : ''}`}
                    onClick={() => setActiveTab('single')}
                >
                    <Calculator size={18} /> Single Scenario
                </button>
                <button
                    className={`nav-link ${activeTab === 'multi' ? 'active' : ''}`}
                    onClick={() => setActiveTab('multi')}
                >
                    <Layers size={18} /> Comparison
                </button>
                <button
                    className={`nav-link ${activeTab === 'strategy' ? 'active' : ''}`}
                    onClick={() => setActiveTab('strategy')}
                >
                    <Zap size={18} /> Turbo Strategy
                </button>
                <button
                    className={`nav-link ${activeTab === 'portfolio' ? 'active' : ''}`}
                    onClick={() => setActiveTab('portfolio')}
                >
                    <Briefcase size={18} /> Rent-vesting
                </button>
            </div>

            {/* SINGLE SCENARIO TAB */}
            {activeTab === 'single' && (
                <div className="row">
                    {/* Left Column: Inputs */}
                    <div className="col-4">
                        <div className="card mb-4">
                            <div className="card-body">
                                <h5 className="section-header"><Wallet size={20} /> Loan Parameters</h5>
                                <InputGroup
                                    label="Property Price"
                                    value={inputs.propertyPrice}
                                    onChange={(v) => updateInput('propertyPrice', v)}
                                    prefix="€"
                                />
                                <InputGroup
                                    label="Down Payment"
                                    value={inputs.manualDownPayment}
                                    onChange={(v) => updateInput('manualDownPayment', v)}
                                    prefix="€"
                                />
                                <div className="row">
                                    <div className="col-6">
                                        <div className="mb-3">
                                            <label className="form-label">Duration</label>
                                            <select
                                                className="form-select"
                                                value={inputs.creditYears}
                                                onChange={(e) => updateInput('creditYears', parseInt(e.target.value))}
                                            >
                                                <option value="10">10 Years</option>
                                                <option value="15">15 Years</option>
                                                <option value="20">20 Years</option>
                                                <option value="25">25 Years</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <InputGroup
                                            label="Interest Rate"
                                            value={inputs.interestRateSingle}
                                            onChange={(v) => updateInput('interestRateSingle', v)}
                                            step={0.1}
                                            suffix="%"
                                        />
                                    </div>
                                </div>
                                <InputGroup
                                    label="Notary Fees"
                                    value={inputs.notaryFeesRate}
                                    onChange={(v) => updateInput('notaryFeesRate', v)}
                                    type="range" min={0} max={15} step={0.5} prefix="" suffix="%"
                                />
                                <InputGroup
                                    label="Insurance Rate"
                                    value={inputs.insuranceYearlyRate}
                                    onChange={(v) => updateInput('insuranceYearlyRate', v)}
                                    type="range" min={0} max={2} step={0.05} prefix="" suffix="%"
                                />
                            </div>
                        </div>

                        <div className="card mb-4">
                            <div className="card-body">
                                <h5 className="section-header"><Zap size={20} /> Financial Power</h5>
                                <InputGroup
                                    label="Net Monthly Income"
                                    value={inputs.monthlyIncome}
                                    onChange={(v) => updateInput('monthlyIncome', v)}
                                    prefix="€"
                                />
                                <InputGroup
                                    label="Payment Overdrive"
                                    value={inputs.paymentOverdrive}
                                    onChange={(v) => updateInput('paymentOverdrive', v)}
                                    type="range" min={0} max={100} step={5} prefix="" suffix="%"
                                    helperText="Increase monthly payment by %"
                                />
                                <InputGroup
                                    label="Income Injection"
                                    value={inputs.incomeInjection}
                                    onChange={(v) => updateInput('incomeInjection', v)}
                                    type="range" min={0} max={50} step={5} prefix="" suffix="%"
                                    helperText="% of income added to payment"
                                />
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-body">
                                <h5 className="section-header"><Home size={20} /> Rental Potential</h5>
                                <div className="row">
                                    <div className="col-6">
                                        <InputGroup
                                            label="Est. Rent"
                                            value={inputs.monthlyRent}
                                            onChange={(v) => updateInput('monthlyRent', v)}
                                            prefix="€"
                                        />
                                    </div>
                                    <div className="col-6">
                                        <InputGroup
                                            label="Expenses"
                                            value={inputs.monthlyExpenses}
                                            onChange={(v) => updateInput('monthlyExpenses', v)}
                                            prefix="€"
                                        />
                                    </div>
                                </div>
                                <InputGroup
                                    label="Property Tax"
                                    value={inputs.propertyTax}
                                    onChange={(v) => updateInput('propertyTax', v)}
                                    prefix="€"
                                    helperText="Monthly"
                                />
                                <InputGroup
                                    label="Occupancy Rate"
                                    value={inputs.occupancyRate}
                                    onChange={(v) => updateInput('occupancyRate', v)}
                                    type="range" min={50} max={100} step={5} prefix="" suffix="%"
                                />
                                <div className="row mt-2">
                                    <div className="col-6">
                                        <InputGroup
                                            label="Rent Indexation"
                                            value={inputs.rentIndexationRate}
                                            onChange={(v) => updateInput('rentIndexationRate', v)}
                                            suffix="%" step={0.1}
                                            helperText="Annual Increase"
                                        />
                                    </div>
                                    <div className="col-6">
                                        <InputGroup
                                            label="Appreciation"
                                            value={inputs.propertyAppreciationRate}
                                            onChange={(v) => updateInput('propertyAppreciationRate', v)}
                                            suffix="%" step={0.1}
                                            helperText="Annual Value Gain"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Results */}
                    <div className="col-8">
                        {/* Alerts */}
                        {result.debtRatio > DEBT_RATIO_MAX && (
                            <div className="alert alert-warning mb-4 p-4 rounded-lg bg-yellow-900/20 border border-yellow-600/50 text-yellow-500 flex items-center gap-2">
                                <AlertTriangle size={20} />
                                <span>Warning: Debt ratio is {(result.debtRatio * 100).toFixed(1)}%, which exceeds the 37% limit.</span>
                            </div>
                        )}

                        {/* Key Metrics */}
                        <div className="row mb-4">
                            <div className="col-4">
                                <ResultsCard
                                    label="Monthly Payment"
                                    value={result.finalMonthlyPayment}
                                    subValue={`Total Paid: ${kFormat(result.totalPaid)}`}
                                    icon={<Wallet size={16} />}
                                />
                            </div>
                            <div className="col-4">
                                <ResultsCard
                                    label="Monthly Cashflow"
                                    value={result.netRentCashflow}
                                    subValue={result.netRentCashflow < 0 ? "You pay this monthly" : "Profit in pocket"}
                                    icon={<Home size={16} />}
                                    color={result.netRentCashflow >= 0 ? 'success' : 'danger'}
                                />
                            </div>
                            <div className="col-4">
                                <ResultsCard
                                    label="Economic Gain"
                                    value={result.totalMonthlyEconomicGain}
                                    subValue="Cashflow + Equity + Appr."
                                    icon={<TrendingUp size={16} />}
                                    color="success"
                                />
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="card mb-4">
                            <div className="card-body">
                                <h5 className="section-header flex justify-between">
                                    <span>Wealth vs Invested</span>
                                    <span className="text-sm font-normal text-muted flex items-center gap-1">
                                        <Info size={14} /> When Green line crosses Yellow line, you are profitable.
                                    </span>
                                </h5>
                                <Charts data={result.timeline} type="wealth" />
                                <div className="text-center mt-4 text-muted">
                                    Real Profit Break-Even: <strong className="text-success">{result.equityBreakEvenYears}</strong> years
                                </div>
                            </div>
                        </div>

                        <div className="row mb-4">
                            <div className="col-6">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <h5 className="section-header">Balance & Interest</h5>
                                        <Charts data={result.timeline} type="balance" />
                                    </div>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="card h-100">
                                    <div className="card-body">
                                        <h5 className="section-header">Cumulative Cashflow</h5>
                                        <Charts data={result.timeline} type="roi" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Analysis */}
                        <div className="card mb-4 border-blue-500/30 bg-blue-900/10">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h5 className="section-header mb-0 border-0 text-blue-400">
                                        <Bot size={20} /> AI Financial Analyst
                                    </h5>
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing}
                                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50 transition-colors"
                                    >
                                        {isAnalyzing ? 'Analyzing...' : 'Analyze Scenario'}
                                    </button>
                                </div>

                                {aiAnalysis ? (
                                    <div className="prose prose-invert max-w-none text-sm text-slate-300">
                                        <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="text-muted text-sm">
                                        Click "Analyze Scenario" to get a professional assessment of this investment from Gemini AI.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="card mb-4">
                            <div className="card-body">
                                <h5 className="section-header">System Recommendations</h5>
                                <ul className="list-none p-0 m-0">
                                    {recommendations.map((rec, idx) => (
                                        <li key={idx} className="mb-2 pl-4 relative text-muted">
                                            <span className="absolute left-0 text-primary font-bold">•</span> {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Future Value */}
                        <div className="card">
                            <div className="card-body flex justify-between items-center">
                                <div>
                                    <div className="text-muted text-sm">Est. Property Value in {inputs.creditYears} years</div>
                                    <div className="text-2xl font-bold text-primary">{kFormat(result.finalPropertyValue)}</div>
                                </div>
                                <div>
                                    <div className="text-muted text-sm">Total Cash Invested</div>
                                    <div className="text-2xl font-bold text-warning">{kFormat(result.totalCashInvested)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* COMPARISON TAB */}
            {activeTab === 'multi' && (
                <div className="row">
                    <div className="col-12 mb-4">
                        <div className="card">
                            <div className="card-body">
                                <h3 className="mb-2">Duration Comparison</h3>
                                <p className="text-muted">Comparing loan terms (10, 15, 20, 25 years) with your current settings.</p>
                            </div>
                        </div>
                    </div>
                    {multiResults.map((res) => (
                        <div key={res.duration} className="col-6">
                            <div className={`card h-100 ${res.isViable ? 'border-success' : 'border-danger'}`} style={{ borderColor: res.isViable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)' }}>
                                <div className="card-body">
                                    <h5 className="text-primary flex items-center gap-2 mb-3">
                                        <BarChart3 size={20} /> {res.duration} Years
                                    </h5>
                                    <div className="row mb-2">
                                        <div className="col-6">
                                            <div className="text-sm text-muted">Monthly Pay</div>
                                            <div className="font-bold">{kFormat(res.monthlyPayment)}</div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-sm text-muted">Total Interest</div>
                                            <div className="font-bold">{kFormat(res.totalInterest)}</div>
                                        </div>
                                    </div>
                                    <div className="row mb-2">
                                        <div className="col-6">
                                            <div className="text-sm text-muted">Debt Ratio</div>
                                            <div className={`font-bold ${res.isViable ? 'text-success' : 'text-danger'}`}>
                                                {(res.ratio * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-sm text-muted">Cashflow</div>
                                            <div className={`font-bold ${res.cashflow >= 0 ? 'text-success' : 'text-danger'}`}>
                                                {kFormat(res.cashflow)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-gray-700">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted">Equity @ 10y</span>
                                            <span className="text-success font-bold">{kFormat(res.equityAt10Years)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* STRATEGY TAB */}
            {activeTab === 'strategy' && (
                <div className="row">
                    <div className="col-12 mb-4">
                        <div className="card">
                            <div className="card-body">
                                <h3 className="mb-2">Turbo Payoff Strategies</h3>
                                <p className="text-muted">
                                    We analyzed thousands of combinations to find the best strategies for you.
                                </p>
                            </div>
                        </div>
                    </div>

                    {strategies.length === 0 ? (
                        <div className="col-12">
                            <div className="alert alert-warning p-4 rounded-lg bg-yellow-900/20 border border-yellow-600/50 text-yellow-500">
                                No valid strategies found under the 37% debt ratio limit with current parameters.
                            </div>
                        </div>
                    ) : (
                        strategies.map((strat, idx) => (
                            <div key={idx} className="col-4">
                                <div className="card h-100 border-success" style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                                    <div className="card-body">
                                        <h5 className="text-success flex items-center gap-2 mb-2">
                                            <Zap size={20} /> {strat.name}
                                        </h5>
                                        <p className="text-xs text-muted mb-4 h-8">{strat.description}</p>

                                        <div className="flex justify-between mb-2 text-sm">
                                            <span className="text-muted">Overdrive</span>
                                            <span className="font-bold">{strat.overdrive}%</span>
                                        </div>
                                        <div className="flex justify-between mb-2 text-sm">
                                            <span className="text-muted">Injection</span>
                                            <span className="font-bold">{strat.injection}%</span>
                                        </div>

                                        <hr className="border-gray-700 my-3" />

                                        <div className="flex justify-between mb-2">
                                            <span className="text-muted">Payoff Time</span>
                                            <span className="font-bold text-primary">{(strat.monthsCount / 12).toFixed(1)} years</span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-muted">Interest Saved</span>
                                            <span className="font-bold text-success">{kFormat(strat.interestSaved)}</span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-muted">Monthly Pay</span>
                                            <span className="font-bold">{kFormat(strat.monthlyPayment)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* PORTFOLIO TAB */}
            {activeTab === 'portfolio' && (
                <div className="row">
                    <div className="col-4">
                        <div className="card mb-4">
                            <div className="card-body">
                                <h5 className="section-header text-gradient">Rent-vesting Setup</h5>

                                <h6 className="text-primary mt-3 mb-2 font-bold">1. Current Home (To Rent Out)</h6>
                                <InputGroup
                                    label="Est. Value"
                                    value={portfolioInputs.currentHomeValue}
                                    onChange={(v) => updatePortfolioInput('currentHomeValue', v)}
                                    prefix="€"
                                />
                                <InputGroup
                                    label="Existing Mortgage"
                                    value={portfolioInputs.currentHomeMortgage}
                                    onChange={(v) => updatePortfolioInput('currentHomeMortgage', v)}
                                    prefix="€"
                                />
                                <InputGroup
                                    label="Est. Rent Income"
                                    value={portfolioInputs.currentHomeRentIncome}
                                    onChange={(v) => updatePortfolioInput('currentHomeRentIncome', v)}
                                    prefix="€"
                                />

                                <h6 className="text-primary mt-4 mb-2 font-bold">2. New Investment Property</h6>
                                <InputGroup
                                    label="Price"
                                    value={portfolioInputs.invPrice}
                                    onChange={(v) => updatePortfolioInput('invPrice', v)}
                                    prefix="€"
                                />
                                <InputGroup
                                    label="Down Payment"
                                    value={portfolioInputs.invDownPayment}
                                    onChange={(v) => updatePortfolioInput('invDownPayment', v)}
                                    prefix="€"
                                />
                                <div className="row">
                                    <div className="col-6">
                                        <InputGroup
                                            label="Rate"
                                            value={portfolioInputs.invRate}
                                            onChange={(v) => updatePortfolioInput('invRate', v)}
                                            suffix="%" step={0.1}
                                        />
                                    </div>
                                    <div className="col-6">
                                        <InputGroup
                                            label="Years"
                                            value={portfolioInputs.invDuration}
                                            onChange={(v) => updatePortfolioInput('invDuration', v)}
                                        />
                                    </div>
                                </div>
                                <InputGroup
                                    label="Est. Rent Income"
                                    value={portfolioInputs.invRent}
                                    onChange={(v) => updatePortfolioInput('invRent', v)}
                                    prefix="€"
                                />

                                <h6 className="text-primary mt-4 mb-2 font-bold">3. New Living Situation</h6>
                                <InputGroup
                                    label="Rent You Pay"
                                    value={portfolioInputs.newLivingRent}
                                    onChange={(v) => updatePortfolioInput('newLivingRent', v)}
                                    prefix="€"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="col-8">
                        {portfolioResult && (
                            <>
                                <div className="card mb-4">
                                    <div className="card-body text-center">
                                        <h5 className="section-header justify-center">Portfolio Cashflow Snapshot</h5>
                                        <div className="row items-center">
                                            <div className="col-4" style={{ borderRight: '1px solid var(--card-border)' }}>
                                                <div className="text-sm text-muted">Total Income</div>
                                                <div className="text-2xl text-success font-bold">{kFormat(portfolioResult.totalIncome)}</div>
                                                <div className="text-xs text-muted">Salary + Rents</div>
                                            </div>
                                            <div className="col-4" style={{ borderRight: '1px solid var(--card-border)' }}>
                                                <div className="text-sm text-muted">Total Expenses</div>
                                                <div className="text-2xl text-danger font-bold">{kFormat(portfolioResult.totalExpenses)}</div>
                                                <div className="text-xs text-muted">Mortgages + Rent</div>
                                            </div>
                                            <div className="col-4">
                                                <div className="text-sm text-muted">Net Cashflow</div>
                                                <div className={`text-3xl font-bold ${portfolioResult.netCashflow >= 0 ? 'text-success' : 'text-danger'}`}>
                                                    {kFormat(portfolioResult.netCashflow)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            <span className={`inline-block px-3 py-1 rounded-full border ${portfolioResult.bankDebtRatio > 0.35 ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-green-500 bg-green-500/10 text-green-500'}`}>
                                                Bank Debt Ratio: {(portfolioResult.bankDebtRatio * 100).toFixed(2)}%
                                            </span>
                                            <div className="text-xs text-muted mt-1">(Mortgages / (Income + 70% Rent))</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="section-header">
                                            <TrendingUp size={20} /> 20-Year Net Worth Projection
                                        </h5>
                                        <Charts data={portfolioResult.netWorthProjection} type="portfolio" />
                                        <p className="text-muted text-sm mt-3 text-center">
                                            Projection assumes 2% annual property appreciation and linear principal paydown.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
