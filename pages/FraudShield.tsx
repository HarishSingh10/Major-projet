import React, { useState } from 'react';
import { Card, SeverityBadge } from '../components/UIComponents';
import { ShieldAlert, MessageSquare, Upload, AlertTriangle, CheckCircle2, Loader2, Info } from 'lucide-react';

const FraudShield: React.FC = () => {
    const [chatText, setChatText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setChatText(ev.target?.result as string);
            reader.readAsText(file);
        }
    };

    const analyzeChat = async () => {
        if (!chatText.trim()) return;
        setIsAnalyzing(true);
        setResult(null);

        try {
            const response = await fetch('http://localhost:5000/api/analyze-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatText })
            });
            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Section */}
                <Card className="flex flex-col">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                             <ShieldAlert className="text-red-500" /> FraudShield Chat Analyzer
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Upload or paste WhatsApp chats to detect scams, social engineering, and fraudulent patterns.</p>
                    </div>

                    <div className="space-y-4 flex-1 flex flex-col">
                         <div className="flex-1 flex flex-col">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Chat Contents</label>
                            <textarea 
                                className="flex-1 min-h-[300px] w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 focus:ring-2 focus:ring-red-500 outline-none font-mono text-xs resize-none"
                                placeholder="Paste your WhatsApp chat export here... (e.g., [12:04, 13/03/2026] +91 99... Hi, I am from your bank...)"
                                value={chatText}
                                onChange={(e) => setChatText(e.target.value)}
                            />
                         </div>

                         <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <input 
                                    type="file" 
                                    id="file-upload" 
                                    className="hidden" 
                                    accept=".txt"
                                    onChange={handleFileUpload}
                                />
                                <label 
                                    htmlFor="file-upload" 
                                    className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-red-500/50 flex items-center justify-center gap-2 cursor-pointer transition-all text-sm font-medium text-gray-500 hover:text-red-400"
                                >
                                    <Upload size={18} /> Upload .txt Export
                                </label>
                            </div>
                            <button 
                                onClick={analyzeChat}
                                disabled={isAnalyzing || !chatText.trim()}
                                className="flex-[0.5] py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                            >
                                {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <MessageSquare size={18} />}
                                {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                            </button>
                         </div>
                    </div>
                </Card>

                {/* Analysis Result Section */}
                <div className="space-y-6">
                    {!result && !isAnalyzing && (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-white/5 rounded-3xl border-2 border-dashed border-white/5 opacity-50">
                             <Info size={48} className="text-gray-600 mb-4" />
                             <h3 className="font-bold text-gray-400">Ready for Scrutiny</h3>
                             <p className="text-xs text-gray-500 max-w-[250px] mt-2">Paste a suspicious chat and click 'Run Analysis' to see AI forensic results here.</p>
                        </div>
                    )}

                    {isAnalyzing && (
                         <Card className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
                              <Loader2 className="animate-spin text-red-500 mb-4" size={48} />
                              <h3 className="font-bold">Breaking Down Speech Patterns</h3>
                              <p className="text-xs text-gray-500 mt-2">Our AI is cross-referencing known fraud playbooks...</p>
                         </Card>
                    )}

                    {result && (
                        <Card className="animate-in zoom-in-95 duration-300">
                             <div className="flex justify-between items-start mb-6">
                                 <div>
                                     <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-lg">Forensic Report</h3>
                                        <SeverityBadge severity={result.riskLevel} />
                                     </div>
                                     <p className="text-xs text-gray-500 tracking-wider">AI AGENT: SENTINEL-X7</p>
                                 </div>
                                 <div className="text-right">
                                     <div className={`text-3xl font-bold ${result.fraudProbability > 60 ? 'text-red-500' : 'text-green-500'}`}>{result.fraudProbability}%</div>
                                     <div className="text-[10px] uppercase font-bold text-gray-500">FRAUD PROBABILITY</div>
                                 </div>
                             </div>

                             <div className="space-y-4">
                                  <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                                      <h4 className="text-[10px] text-gray-500 uppercase font-bold mb-2 flex items-center gap-1.5 underline">
                                          <AlertTriangle size={12} className="text-yellow-500" /> Detected Scam Patterns
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                          {result.detectedPatterns.map((p: string) => (
                                              <span key={p} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded-md border border-red-500/20 font-bold">
                                                  {p}
                                              </span>
                                          ))}
                                      </div>
                                  </div>

                                  <div>
                                      <h4 className="text-sm font-bold mb-2 flex items-center gap-2">
                                          Expert Analysis
                                      </h4>
                                      <p className="text-sm text-gray-400 leading-relaxed bg-white/5 p-4 rounded-2xl italic">
                                          {result.expertAnalysis}
                                      </p>
                                  </div>

                                  <div className="space-y-2">
                                      <h4 className="text-[10px] text-gray-500 uppercase font-bold px-2">Specific Red Flags</h4>
                                      <div className="space-y-2">
                                          {result.redFlags.map((f: any, i: number) => (
                                              <div key={i} className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 transition-transform hover:scale-[1.01]">
                                                  <p className="text-xs font-mono text-red-200 mb-1">"{f.text}"</p>
                                                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-tight">Detect: {f.reason}</p>
                                              </div>
                                          ))}
                                      </div>
                                  </div>

                                  <div className="mt-6 p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                                       <h4 className="text-sm font-bold text-green-400 flex items-center gap-2 mb-1">
                                           <CheckCircle2 size={16} /> Recommended Action
                                       </h4>
                                       <p className="text-sm text-green-300/80 leading-snug">{result.recommendation}</p>
                                  </div>
                             </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FraudShield;
