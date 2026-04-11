import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, User, Wind } from 'lucide-react';

const DashboardLayout = ({ children, isBackendConnected }) => {
  const location = useLocation();

  return (
    <div className="flex flex-col h-screen bg-[var(--color-brand-900)] text-brand-50 font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <header className="h-16 flex-shrink-0 bg-[var(--color-brand-800)]/50 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-20 shadow-[0_5px_30px_rgba(0,0,0,0.5)]">
        
        {/* Logo & Main Nav Area */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Wind className="text-[var(--color-accent-blue)]" size={24} />
            <span className="font-bold text-lg tracking-widest text-white">Vortex-Gen</span>
          </div>

          <nav className="hidden md:flex items-center gap-3">
            <TopNavItem to="/dashboard" label="Simulation" currentPath={location.pathname} />
            <TopNavItem to="/profile" label="Profile" currentPath={location.pathname} />
            <TopNavItem to="/settings" label="Settings" currentPath={location.pathname} />
          </nav>
        </div>
        
        {/* Right Side Controls & Status */}
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-3 bg-black/40 px-4 py-1.5 rounded-full border border-white/5">
            <div className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-[var(--color-accent-neon)] shadow-[0_0_10px_var(--color-accent-neon)]' : 'bg-[var(--color-accent-pink)] shadow-[0_0_10px_var(--color-accent-pink)]'} animate-pulse`}></div>
            <span className="text-brand-300 font-mono text-xs tracking-wider">
              {isBackendConnected ? 'API_LINK_UP' : 'API_LINK_DOWN'}
            </span>
          </div>

          <div className="flex items-center gap-3">
             <Link to="/settings" className="p-2 text-brand-400 hover:text-[var(--color-accent-neon)] hover:bg-white/5 rounded-lg transition-all" title="Settings">
               <Settings size={20} />
             </Link>
             <Link to="/profile" className="p-2 text-brand-400 hover:text-[var(--color-accent-neon)] hover:bg-white/5 rounded-lg transition-all" title="User Profile">
               <User size={20} />
             </Link>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 relative">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.1),transparent)] pointer-events-none"></div>

        {/* Scrollable View Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-6 relative z-10 custom-scrollbar">
           {children}
        </div>
      </main>
    </div>
  );
};

const TopNavItem = ({ to, label, currentPath }) => {
  const isActive = currentPath.startsWith(to) || (currentPath === '/' && to === '/dashboard');
  
  return (
    <Link 
      to={to} 
      className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium text-[13px] tracking-widest uppercase
        ${isActive 
          ? 'bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-neon)] border border-[var(--color-accent-blue)]/30 shadow-[inset_0_0_12px_rgba(14,165,233,0.1)]' 
          : 'text-brand-300 hover:bg-white/5 hover:text-white border border-transparent'
        }` 
      }
    >
      {label}
    </Link>
  );
};

export default DashboardLayout;
