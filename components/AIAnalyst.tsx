import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Minimize2, Maximize2, MessageSquare, Loader2 } from 'lucide-react';
import { Card } from './UIComponents';

const AIAnalyst: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: "Hello, I am the Cyber Sentinel AI Lead Analyst. How can I help you understand today's threat landscape?" }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isLoading) return;

        const userMsg = message.trim();
        setMessage('');
        const newHistory = [...messages, { role: 'user' as const, content: userMsg }];
        setMessages(newHistory);
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: userMsg, 
                    history: newHistory.filter(m => m.role !== 'assistant' || m.content.length > 0).slice(-5) 
                })
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
            } else {
                throw new Error("Analysis engine offline");
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "I am having trouble connecting to the analysis engine. Please ensure the backend is running." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 rounded-full bg-cyber-accent text-white shadow-lg hover:shadow-cyan-500/50 transition-all z-50 animate-bounce duration-2000"
                title="Chat with AI Analyst"
            >
                <Bot size={24} />
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 w-96 z-50 transition-all ${isMinimized ? 'h-14' : 'h-[500px]'}`}>
            <Card className="h-full flex flex-col p-0 overflow-hidden shadow-2xl border-cyber-accent/30 dark:bg-cyber-800">
                {/* Header */}
                <div className="bg-cyber-accent p-4 flex items-center justify-between text-white shrink-0">
                    <div className="flex items-center gap-2">
                        <Bot size={20} />
                        <span className="font-bold text-sm">AI Lead Analyst</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsMinimized(!isMinimized)} className="hover:text-gray-200">
                            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                        </button>
                        <button onClick={() => setIsOpen(false)} className="hover:text-gray-200">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {/* Messages Area */}
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-gray-50/50 dark:bg-black/10">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                        m.role === 'user' 
                                            ? 'bg-cyber-accent text-white rounded-tr-none shadow-md' 
                                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-tl-none shadow-sm'
                                    }`}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-gray-700 p-3 rounded-2xl rounded-tl-none border border-gray-200 dark:border-gray-600">
                                        <Loader2 className="w-4 h-4 animate-spin text-cyber-accent" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700 bg-white dark:bg-cyber-800 shrink-0">
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Ask for threat analysis..."
                                    className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-cyber-900 text-sm focus:ring-2 focus:ring-cyber-accent outline-none"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    disabled={isLoading}
                                />
                                <button 
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-cyber-accent hover:text-cyan-400 disabled:opacity-50"
                                    disabled={!message.trim() || isLoading}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </Card>
        </div>
    );
};

export default AIAnalyst;
