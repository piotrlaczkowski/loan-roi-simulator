import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import { listAvailableModels } from '../services/gemini';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (apiKey: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
    const [apiKey, setApiKey] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const stored = localStorage.getItem('gemini_api_key');
            const storedModel = localStorage.getItem('gemini_model') || 'gemini-2.5-flash';
            if (stored) setApiKey(stored);
            setSelectedModel(storedModel);
        }
    }, [isOpen]);

    const handleFetchModels = async () => {
        if (!apiKey) {
            alert('Please enter your API key first');
            return;
        }

        setIsLoadingModels(true);
        const models = await listAvailableModels(apiKey);
        setAvailableModels(models);
        setIsLoadingModels(false);

        if (models.length > 0 && !selectedModel) {
            setSelectedModel(models[0]);
        }
    };

    const handleSave = () => {
        localStorage.setItem('gemini_api_key', apiKey);
        localStorage.setItem('gemini_model', selectedModel);
        onSave(apiKey);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="card w-full max-w-md p-6 relative bg-slate-900 border border-slate-700">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-4 text-white">Settings</h2>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Gemini API Key
                    </label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your Gemini API Key"
                        className="form-control w-full bg-slate-800 border-slate-600 text-white"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                        Your key is stored locally in your browser. Get one at{' '}
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                            Google AI Studio
                        </a>
                    </p>
                </div>

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-300">
                            Gemini Model
                        </label>
                        <button
                            onClick={handleFetchModels}
                            disabled={!apiKey || isLoadingModels}
                            className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 flex items-center gap-1"
                        >
                            <RefreshCw size={12} className={isLoadingModels ? 'animate-spin' : ''} />
                            {isLoadingModels ? 'Loading...' : 'Fetch Models'}
                        </button>
                    </div>

                    {availableModels.length > 0 ? (
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="form-select w-full bg-slate-800 border-slate-600 text-white"
                        >
                            {availableModels.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            placeholder="e.g., gemini-2.5-flash"
                            className="form-control w-full bg-slate-800 border-slate-600 text-white"
                        />
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                        {availableModels.length > 0
                            ? `${availableModels.length} models available`
                            : 'Click "Fetch Models" to see available models, or enter manually'}
                    </p>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!apiKey || !selectedModel}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} /> Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};
