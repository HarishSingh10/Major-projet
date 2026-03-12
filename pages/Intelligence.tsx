import React, { useState } from 'react';
import { Card, SeverityBadge } from '../components/UIComponents';
import { ShieldAlert, Globe, Crosshair, Fingerprint, Activity, Zap, ExternalLink, Skull } from 'lucide-react';

const THREAT_GROUPS = [
    {
        name: "Lazarus Group",
        origin: "North Korea",
        severity: "Critical",
        motivation: "Financial / Espionage",
        targets: ["Banking", "Defense", "Cryptocurrency"],
        methods: ["Phishing", "Wiper Malware", "Zero-day exploitation"],
        notable: "2014 Sony Pictures hack, WannaCry ransomware"
    },
    {
        name: "LockBit",
        origin: "Russia",
        severity: "Critical",
        motivation: "Financial / Ransomware-as-a-Service",
        targets: ["Enterprise", "Critical Infrastructure"],
        methods: ["Ransomware", "Double Extortion", "Initial Access Brokers"],
        notable: "Most active ransomware group in 2023-2024"
    },
    {
        name: "APT28 (Fancy Bear)",
        origin: "Russia",
        severity: "High",
        motivation: "Geopolitical Espionage",
        targets: ["Government", "Media", "International Organizations"],
        methods: ["Spear Phishing", "OAuth Abuse", "Credential Stuffing"],
        notable: "2016 US Election hacking, German Parliament hack"
    },
    {
        name: "Volt Typhoon",
        origin: "China",
        severity: "High",
        motivation: "Strategic Positioning / Infrastructure Control",
        targets: ["US Critical Infrastructure", "Utility Providers"],
        methods: ["Living-off-the-land (LotL)", "Router Vulnerabilities"],
        notable: "Infiltration of Guam and US communication grids"
    }
];

const Intelligence: React.FC = () => {
    const [selectedGroup, setSelectedGroup] = useState(THREAT_GROUPS[0]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Lateral Sidebar List */}
                <div className="lg:col-span-1 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 px-2">Active Threat Actors</h3>
                    {THREAT_GROUPS.map(group => (
                        <button 
                            key={group.name}
                            onClick={() => setSelectedGroup(group)}
                            className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group 
                                ${selectedGroup.name === group.name 
                                    ? 'bg-cyber-accent text-white border-cyber-accent shadow-lg shadow-cyan-500/30 ring-2 ring-cyan-500/10' 
                                    : 'bg-white/5 border-white/5 hover:border-white/10 text-gray-400 font-medium'}
                            `}
                        >
                            <span className="flex items-center gap-3">
                                <Skull size={18} className={selectedGroup.name === group.name ? 'text-white' : 'text-gray-600'} />
                                <span>{group.name}</span>
                            </span>
                        </button>
                    ))}
                    
                    <div className="p-6 mt-12 bg-gradient-to-br from-red-500/10 to-transparent rounded-2xl border border-red-500/20">
                         <ShieldAlert className="text-red-500 mb-3" size={24} />
                         <h4 className="font-bold text-red-500 mb-1">Alert Center</h4>
                         <p className="text-xs text-red-400/80 leading-relaxed italic animate-pulse">Monitoring increased activity from "Volt Typhoon" nodes in SE Asia.</p>
                    </div>
                </div>

                {/* Profile Detail */}
                <Card className="lg:col-span-3 min-h-[600px] relative overflow-hidden bg-white/5 border-white/5">
                    <div className="flex flex-col md:flex-row justify-between gap-6 mb-12">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyber-accent group">
                                <Fingerprint size={32} className="group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold font-mono tracking-tighter mb-2">{selectedGroup.name}</h2>
                                <div className="flex flex-wrap gap-2">
                                     <SeverityBadge severity={selectedGroup.severity} />
                                     <span className="px-3 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold border border-blue-500/20 uppercase tracking-widest flex items-center gap-1.5 focus:ring-2">
                                         <Globe size={12} /> {selectedGroup.origin}
                                     </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex md:flex-col gap-4 text-right">
                             <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                 <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Motive Index</span>
                                 <span className="text-sm font-bold text-gray-100">{selectedGroup.motivation}</span>
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                         <div className="space-y-6">
                             <div>
                                 <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-cyber-accent mb-4">
                                     <Crosshair size={16} /> Targeted Sectors
                                 </h4>
                                 <div className="flex flex-wrap gap-3">
                                     {selectedGroup.targets.map(t => (
                                         <div key={t} className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-xs font-medium hover:bg-white/10 transition-colors shadow-sm">{t}</div>
                                     ))}
                                 </div>
                             </div>
                             <div>
                                 <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-cyber-accent mb-4">
                                     <Zap size={16} /> Attack Vectors
                                 </h4>
                                 <div className="space-y-3">
                                     {selectedGroup.methods.map(m => (
                                         <div key={m} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-white/5">
                                              <Activity size={14} className="text-gray-500" />
                                              <span className="text-xs font-medium">{m}</span>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         </div>

                         <div className="space-y-6">
                            <div className="h-full bg-black/40 rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center group">
                                <div className="p-4 bg-cyber-accent/10 rounded-full mb-4 shadow-[0_0_20px_rgba(6,182,212,0.1)] group-hover:bg-cyber-accent/20 transition-colors">
                                    <ExternalLink size={24} className="text-cyber-accent" />
                                </div>
                                <h4 className="text-sm font-bold uppercase tracking-widest mb-2 px-2">Notable Incident Record</h4>
                                <p className="text-sm text-gray-400 leading-relaxed italic max-w-[280px]">"{selectedGroup.notable}"</p>
                                <button className="mt-6 px-6 py-2 bg-white/5 rounded-full text-[10px] font-bold border border-white/10 hover:border-cyber-accent transition-colors">ACCESS ARCHIVE</button>
                            </div>
                         </div>
                    </div>

                    {/* Threat Heat Graph Simulation */}
                    <div className="p-6 bg-gradient-to-r from-cyan-900/10 to-transparent rounded-2xl border border-cyan-900/20">
                         <div className="flex items-center justify-between mb-4">
                             <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Activity Level Signal</div>
                             <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                                <span className="text-[10px] text-green-500 font-bold font-mono">LIVE TRACE</span>
                             </div>
                         </div>
                         <div className="h-12 flex items-end gap-1.5 overflow-hidden">
                             {[...Array(40)].map((_, i) => (
                                <div key={i} className="flex-1 bg-cyber-accent/30 rounded-t-sm" style={{ height: `${Math.random() * 100}%` }}></div>
                             ))}
                         </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Intelligence;
