import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (apiKey: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('gemini_api_key');
        if (stored) setApiKey(stored);
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('gemini_api_key', apiKey);
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
                        Your key is stored locally in your browser. We use it to generate AI analysis of your simulation.
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
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 transition-colors"
                    >
                        <Save size={18} /> Save Key
                    </button>
                </div>
            </div>
        </div>
    );
};
