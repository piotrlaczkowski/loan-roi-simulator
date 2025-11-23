import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader, Sparkles, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../services/gemini';

interface ChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    onSendMessage: (message: string) => Promise<string>;
}

export const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, onSendMessage }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: '👋 Hello! I\'m your **AI Financial Advisor**. Ask me anything about your investment!'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const response = await onSendMessage(currentInput);
            const assistantMessage: ChatMessage = { role: 'assistant', content: response };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: '❌ Sorry, I encountered an error. Please check your API key in settings.'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
                onClick={onClose}
                style={{ animation: 'fadeIn 0.3s ease-out' }}
            />

            {/* Chat Window - Fixed Bottom Right */}
            <div
                className="fixed bottom-6 right-6 z-50 transition-all duration-300"
                style={{
                    width: isMinimized ? '320px' : '420px',
                    maxWidth: 'calc(100vw - 3rem)',
                    animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                <div
                    className="flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 shadow-2xl overflow-hidden"
                    style={{
                        borderRadius: '28px',
                        height: isMinimized ? 'auto' : '600px',
                        maxHeight: 'calc(100vh - 8rem)',
                        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.2)'
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 backdrop-blur-xl"
                        style={{ borderRadius: '28px 28px 0 0' }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 blur-lg opacity-75"
                                    style={{ borderRadius: '16px' }}
                                />
                                <div className="relative p-2.5 bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg"
                                    style={{ borderRadius: '16px' }}
                                >
                                    <Bot size={20} className="text-white" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                                    AI Advisor
                                    <Sparkles size={14} className="text-yellow-400" />
                                </h3>
                                <p className="text-xs text-slate-400 font-medium">Online</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                className="p-2 hover:bg-white/10 transition-all duration-200"
                                style={{ borderRadius: '12px' }}
                                type="button"
                                title={isMinimized ? "Expand" : "Minimize"}
                            >
                                <Minimize2 size={18} className="text-slate-400 hover:text-white transition-colors" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 transition-all duration-200"
                                style={{ borderRadius: '12px' }}
                                type="button"
                                title="Close"
                            >
                                <X size={18} className="text-slate-400 hover:text-white transition-colors" />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/50 custom-scrollbar">
                                {messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-slideIn`}
                                    >
                                        {/* Avatar */}
                                        <div
                                            className={`flex-shrink-0 w-7 h-7 flex items-center justify-center shadow-lg ${msg.role === 'user'
                                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                                                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                                                }`}
                                            style={{ borderRadius: '14px' }}
                                        >
                                            {msg.role === 'user' ? (
                                                <span className="text-white font-bold text-xs">U</span>
                                            ) : (
                                                <Bot size={14} className="text-white" />
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <div
                                            className={`max-w-[75%] px-4 py-3 ${msg.role === 'user'
                                                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/30'
                                                    : 'bg-slate-800/90 backdrop-blur-sm text-slate-100 border border-white/10 shadow-lg'
                                                }`}
                                            style={{ borderRadius: '20px' }}
                                        >
                                            {msg.role === 'assistant' ? (
                                                <div className="prose prose-invert prose-sm max-w-none prose-p:text-slate-200 prose-p:leading-relaxed prose-strong:text-white prose-code:text-blue-300 prose-code:bg-blue-950/50 prose-code:px-1 prose-code:py-0.5"
                                                    style={{ fontSize: '0.875rem' }}
                                                >
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-2 animate-slideIn">
                                        <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
                                            style={{ borderRadius: '14px' }}
                                        >
                                            <Bot size={14} className="text-white" />
                                        </div>
                                        <div className="bg-slate-800/90 backdrop-blur-sm border border-white/10 px-4 py-3 flex items-center gap-2 shadow-lg"
                                            style={{ borderRadius: '20px' }}
                                        >
                                            <Loader size={16} className="animate-spin text-blue-400" />
                                            <span className="text-sm text-slate-300 font-medium">Thinking...</span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-white/10 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl"
                                style={{ borderRadius: '0 0 28px 28px' }}
                            >
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        placeholder="Ask me anything..."
                                        className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 backdrop-blur-sm font-medium"
                                        style={{ borderRadius: '18px' }}
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={isLoading || !input.trim()}
                                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl hover:shadow-blue-500/30 disabled:hover:shadow-lg transform hover:scale-105 active:scale-95"
                                        style={{ borderRadius: '18px' }}
                                        type="button"
                                        title="Send"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 text-center font-medium">
                                    Press <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-400" style={{ borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>Enter</kbd> to send
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};
