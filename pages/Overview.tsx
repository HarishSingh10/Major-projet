import React, { useMemo } from 'react';
import { useAppContext } from '../App';
import { Card, SeverityBadge } from '../components/UIComponents';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, CartesianGrid 
} from 'recharts';
import { AlertOctagon, TrendingUp, Activity, ShieldCheck } from 'lucide-react';
import { format, subDays } from 'date-fns';

const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  trend?: string; 
  icon: React.ReactNode; 
  color: string;
}> = ({ title, value, trend, icon, color }) => (
  <Card className="border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">{value}</h3>
        {trend && <p className="text-xs mt-1 text-gray-500">{trend}</p>}
      </div>
      <div className={`p-3 rounded-lg bg-opacity-10 ${color.replace('border-', 'bg-').replace('text-', 'bg-')} text-gray-700 dark:text-gray-200`}>
        {React.cloneElement(icon as React.ReactElement, { className: `w-6 h-6 ${color.replace('border-', 'text-')}` })}
      </div>
    </div>
  </Card>
);

const Overview: React.FC = () => {
  const { incidents } = useAppContext();

  // Stats Logic
  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter(i => i.severity === 'Critical').length;
  const resolvedCount = incidents.filter(i => i.status === 'Resolved').length;
  const highPriority = incidents.filter(i => i.severity === 'High').length;

  // Chart Data Preparation
  const trendData = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = subDays(new Date(), 13 - i);
      return { date: format(d, 'MMM dd'), fullDate: format(d, 'yyyy-MM-dd'), count: 0 };
    });

    incidents.forEach(inc => {
      const incDate = inc.date.split('T')[0];
      const day = last14Days.find(d => d.fullDate === incDate);
      if (day) day.count++;
    });

    return last14Days;
  }, [incidents]);

  const severityDistribution = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    incidents.forEach(i => counts[i.severity]++);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [incidents]);

  const recentIncidents = incidents.slice(0, 5);

  const riskScore = useMemo(() => {
    if (incidents.length === 0) return 0;
    const weights = { Critical: 100, High: 70, Medium: 40, Low: 10 };
    const sum = incidents.reduce((acc, curr) => acc + weights[curr.severity], 0);
    return Math.min(100, Math.round(sum / incidents.length / 0.8)); // Weighted average
  }, [incidents]);

  return (
    <div className="space-y-6">
      {/* Risk and Sector Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-1 bg-gradient-to-br from-cyber-800 to-black border-cyber-accent/20 flex flex-col items-center justify-center py-10 relative overflow-hidden group">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyber-accent/5 rounded-full blur-3xl group-hover:bg-cyber-accent/10 transition-colors"></div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Global Risk Index</div>
            <div className="relative w-40 h-40 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray={440} 
                        strokeDashoffset={440 - (440 * riskScore) / 100}
                        className={`${riskScore > 70 ? 'text-red-500' : riskScore > 40 ? 'text-orange-500' : 'text-cyber-accent'} transition-all duration-1000 ease-out`}
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold font-mono">{riskScore}%</span>
                    <span className="text-[10px] uppercase tracking-tighter text-gray-500">{riskScore > 70 ? 'Extreme' : 'Moderate'} Risk</span>
                 </div>
            </div>
         </Card>

         <Card className="lg:col-span-2 overflow-hidden bg-cyber-800/50 backdrop-blur-sm border-white/5">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Sector Vulnerability Heatmap</h3>
                <span className="text-[10px] bg-red-900/30 text-red-400 px-2 py-0.5 rounded border border-red-900/50">ACTIVE MONITORING</span>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {['Finance', 'Healthcare', 'Technology', 'Energy'].map(sector => {
                    const count = incidents.filter(i => i.sector === sector).length;
                    const level = Math.min(10, Math.ceil(count / 2));
                    return (
                        <div key={sector} className="p-3 bg-black/20 rounded-lg border border-white/5 hover:border-cyber-accent/30 transition-all">
                             <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">{sector}</div>
                             <div className="flex gap-1 h-1.5">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className={`flex-1 rounded-sm ${i < level ? (level > 7 ? 'bg-red-500' : 'bg-cyber-accent') : 'bg-gray-800'}`}></div>
                                ))}
                             </div>
                             <div className="mt-2 text-xl font-bold font-mono">{count}<span className="text-[10px] font-normal text-gray-500 ml-1">pts</span></div>
                        </div>
                    )
                 })}
             </div>
         </Card>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Incidents" 
          value={totalIncidents} 
          trend="+12% from last week" 
          icon={<Activity />} 
          color="text-blue-500" 
        />
        <StatCard 
          title="Critical Threats" 
          value={criticalCount} 
          trend="Requires attention" 
          icon={<AlertOctagon />} 
          color="text-red-500" 
        />
        <StatCard 
          title="High Priority" 
          value={highPriority} 
          trend="Stable" 
          icon={<TrendingUp />} 
          color="text-orange-500" 
        />
        <StatCard 
          title="Resolved" 
          value={resolvedCount} 
          trend="85% resolution rate" 
          icon={<ShieldCheck />} 
          color="text-green-500" 
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Line Chart */}
        <Card title="Incident Trend (14 Days)" className="lg:col-span-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f3f4f6' }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Area type="monotone" dataKey="count" stroke="#06b6d4" fillOpacity={1} fill="url(#colorCount)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Severity Bar Chart */}
        <Card title="Severity Distribution">
          <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} hide />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={60} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f3f4f6' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Incidents */}
      <Card title="Latest Critical & High Incidents">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Sector</th>
                <th className="px-6 py-3">Severity</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentIncidents.map((incident) => (
                <tr key={incident.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{incident.date.split('T')[0]}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{incident.title}</td>
                  <td className="px-6 py-4">{incident.sector}</td>
                  <td className="px-6 py-4"><SeverityBadge severity={incident.severity} /></td>
                  <td className="px-6 py-4 text-gray-500">{incident.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Overview;