import React, { useState, useMemo } from 'react';
import { useAppContext } from '../App';
import { Card, SeverityBadge, Modal } from '../components/UIComponents';
import { Search, Filter, Calendar, MapPin, Globe, Shield, Terminal, Download } from 'lucide-react';
import { Incident, Severity, Sector } from '../types';

const Feed: React.FC = () => {
  const { incidents } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'All'>('All');
  const [sectorFilter, setSectorFilter] = useState<Sector | 'All'>('All');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Filtering Logic
  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            incident.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = severityFilter === 'All' || incident.severity === severityFilter;
      const matchesSector = sectorFilter === 'All' || incident.sector === sectorFilter;

      return matchesSearch && matchesSeverity && matchesSector;
    });
  }, [incidents, searchTerm, severityFilter, sectorFilter]);

  const exportToCSV = () => {
    const headers = ["ID", "Date", "Title", "Severity", "Type", "Sector", "Status", "City", "Country"];
    const rows = filteredIncidents.map(inc => [
      inc.id,
      inc.date,
      `"${inc.title.replace(/"/g, '""')}"`,
      inc.severity,
      inc.type,
      inc.sector,
      inc.status,
      inc.location.city,
      inc.location.country
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `cyber_incidents_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card>
        {/* Filters Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search ID, Title, or Description..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-cyber-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyber-accent focus:border-transparent outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <select 
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-cyber-800 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-cyber-accent"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as Severity | 'All')}
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select 
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-cyber-800 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-cyber-accent"
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value as Sector | 'All')}
            >
              <option value="All">All Sectors</option>
              <option value="Finance">Finance</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Technology">Technology</option>
              <option value="Government">Government</option>
              <option value="Retail">Retail</option>
              <option value="Energy">Energy</option>
            </select>

            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-cyber-accent hover:bg-cyan-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-cyan-500/20 text-sm whitespace-nowrap"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 font-semibold">ID</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Severity</th>
                <th className="px-6 py-4 font-semibold">Title</th>
                <th className="px-6 py-4 font-semibold">Sector</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredIncidents.length > 0 ? filteredIncidents.map((incident) => (
                <tr 
                  key={incident.id} 
                  className="bg-white dark:bg-cyber-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group cursor-pointer"
                  onClick={() => setSelectedIncident(incident)}
                >
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{incident.id}</td>
                  <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{incident.date.split('T')[0]}</td>
                  <td className="px-6 py-4"><SeverityBadge severity={incident.severity} /></td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{incident.title}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{incident.sector}</td>
                  <td className="px-6 py-4 text-gray-500">{incident.location.city}, {incident.location.country}</td>
                  <td className="px-6 py-4">
                    <button className="text-cyber-accent hover:text-cyan-400 font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No incidents found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-xs text-gray-500 text-center">
          Showing {filteredIncidents.length} incidents
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal 
        isOpen={!!selectedIncident} 
        onClose={() => setSelectedIncident(null)}
        title={selectedIncident?.title || 'Incident Details'}
      >
        {selectedIncident && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <SeverityBadge severity={selectedIncident.severity} />
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                {selectedIncident.sector}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                {selectedIncident.type}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                {selectedIncident.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                 <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 flex items-center gap-2">
                        <Calendar size={14} /> Date Detected
                    </h4>
                    <p className="text-sm">{new Date(selectedIncident.date).toLocaleString()}</p>
                 </div>
                 <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 flex items-center gap-2">
                        <MapPin size={14} /> Location
                    </h4>
                    <p className="text-sm">{selectedIncident.location.city}, {selectedIncident.location.country}</p>
                    <p className="text-xs font-mono text-gray-500 mt-1">Lat: {selectedIncident.location.lat.toFixed(4)}, Lng: {selectedIncident.location.lng.toFixed(4)}</p>
                 </div>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 flex items-center gap-2">
                        <Shield size={14} /> Threat Actor
                    </h4>
                    <p className="text-sm font-medium text-red-500">{selectedIncident.threatActor || 'Unknown / Unattributed'}</p>
                 </div>
                 <div>
                    <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1 flex items-center gap-2">
                        <Terminal size={14} /> Source
                    </h4>
                    <p className="text-sm">{selectedIncident.source}</p>
                 </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">Executive Summary</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {selectedIncident.description}
              </p>
            </div>
            
             <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <h4 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                 <Globe size={16} /> Recommended Action
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                 Immediate isolation of affected systems in the {selectedIncident.sector} subnet. Initiate incident response protocol ALPHA-2. Review logs from {selectedIncident.location.city} node.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Feed;