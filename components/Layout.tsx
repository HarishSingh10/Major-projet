import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  List, 
  PieChart, 
  ShieldAlert, 
  Menu, 
  X, 
  Sun, 
  Moon,
  RefreshCw,
  ScanSearch,
  Users,
  FileSearch
} from 'lucide-react';
import { useAppContext } from '../App';
import AIAnalyst from './AIAnalyst';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, toggleTheme, refreshData } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Overview', path: '/overview', icon: <LayoutDashboard size={20} /> },
    { name: 'Incident Feed', path: '/feed', icon: <List size={20} /> },
    { name: 'Visualizations', path: '/visualize', icon: <PieChart size={20} /> },
    { name: 'Vulnerability Scanner', path: '/scanner', icon: <ScanSearch size={20} /> },
    { name: 'Threat Intelligence', path: '/intelligence', icon: <Users size={20} /> },
    { name: 'FraudShield (Chat)', path: '/fraud-shield', icon: <FileSearch size={20} /> },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-cyber-900 text-gray-900 dark:text-gray-100">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:transform-none bg-white dark:bg-cyber-800 border-r border-gray-200 dark:border-gray-700 flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700 px-6">
          <ShieldAlert className="text-cyber-accent mr-3" size={32} />
          <span className="text-xl font-bold font-mono tracking-tighter">CYBER<span className="text-cyber-accent">SENTINEL</span></span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center px-4 py-3 rounded-lg transition-colors duration-200 font-medium
                ${isActive 
                  ? 'bg-cyber-accent/10 text-cyber-accent border-l-4 border-cyber-accent' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'}
              `}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
           <div className="text-xs text-center text-gray-500 dark:text-gray-500 font-mono">
              SYSTEM STATUS: ONLINE
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-cyber-800 border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={toggleSidebar} 
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
          >
            <Menu size={24} />
          </button>

          <h1 className="text-lg font-semibold lg:block hidden">
            {navItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
          </h1>

          <div className="flex items-center space-x-4">
            <button 
              onClick={refreshData}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-transform active:rotate-180"
              title="Refresh Data"
            >
              <RefreshCw size={20} />
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-yellow-500 dark:text-yellow-400"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="h-8 w-8 rounded-full bg-cyber-accent/20 flex items-center justify-center text-cyber-accent font-bold text-sm">
              AO
            </div>
          </div>
        </header>

        {/* Live Threat Ticker */}
        <div className="h-10 bg-cyber-accent/5 dark:bg-black/40 border-b border-cyber-accent/10 flex items-center overflow-hidden shrink-0">
            <div className="bg-cyber-accent/10 px-4 h-full flex items-center border-r border-cyber-accent/20 z-10 shrink-0">
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-cyber-accent animate-pulse whitespace-nowrap">
                   <ShieldAlert size={14} /> LIVE THREAT INTEL
                </span>
            </div>
            <div className="flex-1 overflow-hidden relative">
                <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-xs font-medium text-gray-600 dark:text-gray-400">
                    {useAppContext().incidents.slice(0, 5).map((inc, i) => (
                        <span key={i} className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${inc.severity === 'Critical' ? 'bg-red-500' : 'bg-orange-500'}`}></span>
                             <span className="font-mono text-cyber-accent">[{inc.id}]</span> {inc.title}
                        </span>
                    ))}
                    {/* Duplicate for seamless scrolling */}
                    {useAppContext().incidents.slice(0, 5).map((inc, i) => (
                        <span key={`dup-${i}`} className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${inc.severity === 'Critical' ? 'bg-red-500' : 'bg-orange-500'}`}></span>
                             <span className="font-mono text-cyber-accent">[{inc.id}]</span> {inc.title}
                        </span>
                    ))}
                </div>
            </div>
        </div>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scroll-smooth">
          {children}
        </main>
        <AIAnalyst />
      </div>
    </div>
  );
};

export default Layout;