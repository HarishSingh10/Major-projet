import React, { useMemo } from 'react';
import { useAppContext } from '../App';
import IncidentMap from '../components/Map';
import { Card } from '../components/UIComponents';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend 
} from 'recharts';

const Visualize: React.FC = () => {
  const { incidents } = useAppContext();

  // Data for Pie Chart (Type Distribution)
  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach(i => { counts[i.type] = (counts[i.type] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [incidents]);

  // Data for Radar Chart (Sector vs Average Impact)
  const impactData = useMemo(() => {
     const sectorImpact: Record<string, { total: number, count: number }> = {};
     incidents.forEach(i => {
         if (!sectorImpact[i.sector]) sectorImpact[i.sector] = { total: 0, count: 0 };
         sectorImpact[i.sector].total += i.impactScore;
         sectorImpact[i.sector].count += 1;
     });
     
     return Object.entries(sectorImpact).map(([subject, data]) => ({
         subject,
         A: Math.round(data.total / data.count),
         fullMark: 100
     }));
  }, [incidents]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Top Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Incident Types" className="h-[400px]">
            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={typeData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1500}
                        >
                            {typeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <RechartsTooltip 
                             contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f3f4f6', borderRadius: '8px' }}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>

        <Card title="Average Impact Score by Sector" className="h-[400px]">
            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={impactData}>
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar 
                            name="Impact Score" 
                            dataKey="A" 
                            stroke="#06b6d4" 
                            fill="#06b6d4" 
                            fillOpacity={0.5}
                            animationBegin={200}
                            animationDuration={1500}
                        />
                        <RechartsTooltip 
                             contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f3f4f6', borderRadius: '8px' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </Card>
      </div>

      {/* Bottom Row: Map */}
      <Card title="Global Threat Map" className="h-[500px] relative overflow-hidden">
        <div className="absolute inset-0 top-14 bg-gray-900">
           <IncidentMap incidents={incidents} />
        </div>
        <div className="absolute bottom-6 left-6 bg-white/90 dark:bg-black/70 backdrop-blur-md p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-xs z-[1000] shadow-2xl">
           <h4 className="font-bold mb-3 text-gray-900 dark:text-gray-100 uppercase tracking-widest text-[10px]">Severity Legend</h4>
           <div className="flex items-center gap-3 mb-2"><span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span> <span className="font-medium">Critical</span></div>
           <div className="flex items-center gap-3 mb-2"><span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span> <span className="font-medium">High</span></div>
           <div className="flex items-center gap-3 mb-2"><span className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"></span> <span className="font-medium">Medium</span></div>
           <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span> <span className="font-medium">Information</span></div>
        </div>
      </Card>
    </div>
  );
};

export default Visualize;