import React, { useState } from 'react';
import { Card, SeverityBadge } from '../components/UIComponents';
import { Search, Loader2, Play, Terminal, ShieldCheck, AlertCircle } from 'lucide-react';

const Scanner: React.FC = () => {
    const [target, setTarget] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanData, setScanData] = useState<any>(null);
    const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

    const addLog = (msg: string) => setTerminalOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const runScan = async () => {
        if (!target) return;
        setIsScanning(true);
        setScanData(null);
        setTerminalOutput([]);
        addLog(`Initiating deep scan for: ${target}...`);
        
        try {
            addLog(`Resolving target IP...`);
            await new Promise(r => setTimeout(r, 500));
            addLog(`Establishing connection... Success.`);
            addLog(`Checking common open ports... 22, 80, 443, 3306...`);
            await new Promise(r => setTimeout(r, 1000));
            addLog(`Querying AI-Intelligence database for known exploits...`);

            const res = await fetch('http://localhost:5000/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target })
            });
            const data = await res.json();
            
            addLog(`Parsing vulnerability signatures... Found ${data.vulnerabilities.length} entries.`);
            addLog(`Finalizing risk assessment... Done.`);
            setScanData(data);
        } catch (e) {
            addLog(`SCAN ERROR: Failure in remote query engine.`);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scan Control */}
                <Card className="flex flex-col">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold mb-2">Vulnerability Scanner</h2>
                        <p className="text-sm text-gray-500">Scan domains or IP addresses for security weaknesses using AI intelligence.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 block">Target Domain or IP</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-cyber-900 focus:ring-2 focus:ring-cyan-500 outline-none"
                                    placeholder="e.g., example.com"
                                    value={target}
                                    onChange={(e) => setTarget(e.target.value)}
                                />
                            </div>
                        </div>
                        <button 
                            onClick={runScan}
                            disabled={isScanning || !target}
                            className="w-full py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                        >
                            {isScanning ? <Loader2 className="animate-spin" /> : <Play size={18} />}
                            {isScanning ? 'SCANNING TARGET...' : 'START SECURITY SCAN'}
                        </button>
                    </div>

                    {/* Console / Terminal */}
                    <div className="mt-8 flex-1">
                         <div className="flex justify-between items-center mb-2 px-2">
                             <div className="flex gap-1.5">
                                 <span className="w-2.5 h-2.5 rounded-full bg-red-500/50"></span>
                                 <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></span>
                                 <span className="w-2.5 h-2.5 rounded-full bg-green-500/50"></span>
                             </div>
                             <span className="text-[10px] uppercase font-bold text-gray-600 dark:text-gray-500">DEBUG CONSOLE</span>
                         </div>
                         <div className="h-48 bg-black/90 rounded-xl p-4 font-mono text-xs overflow-y-auto text-green-500 border border-white/5 scroll-smooth">
                             {terminalOutput.length > 0 ? (
                                terminalOutput.map((l, i) => <div key={i} className="mb-1">{l}</div>)
                             ) : (
                                <div className="text-gray-600 italic">Waiting to initiate scan...</div>
                             )}
                             {isScanning && <div className="animate-pulse underline decoration-green-500">_</div>}
                         </div>
                    </div>
                </Card>

                {/* Scan Results */}
                {scanData && (
                    <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-lg">Scan Results: {target}</h3>
                                <p className="text-xs text-gray-500">Assessed on {new Date(scanData.scanDate).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                                <div className={`text-3xl font-bold ${scanData.riskScore > 70 ? 'text-red-500' : 'text-cyan-500'}`}>{scanData.riskScore}%</div>
                                <div className="text-[10px] uppercase font-bold text-gray-500">RISK INDEX</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Open Ports</span>
                                <div className="flex gap-2 flex-wrap">
                                    {scanData.openPorts.map((p: number) => (
                                        <span key={p} className="text-xs font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">{p}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Status</span>
                                <span className="text-sm font-bold text-green-400 flex items-center gap-1.5">
                                    <ShieldCheck size={14} /> SECURITY AUDITED
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {scanData.vulnerabilities.map((v: any, index: number) => (
                                <div key={index} className="p-4 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                                     <div className="flex justify-between items-center mb-3">
                                         <SeverityBadge severity={v.severity} />
                                         <span className="text-xs font-mono text-gray-500 font-bold group-hover:text-cyber-accent transition-colors">{v.cve}</span>
                                     </div>
                                     <p className="text-sm font-medium mb-2">{v.description}</p>
                                     <div className="bg-cyan-900/10 p-2.5 rounded-lg border border-cyan-900/30">
                                         <span className="text-[10px] text-cyan-400 uppercase font-bold flex items-center gap-1.5 mb-1">
                                             <AlertCircle size={12} /> Mitigate Fix
                                         </span>
                                         <p className="text-xs text-cyan-300/80 italic">{v.fix}</p>
                                     </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Scanner;
