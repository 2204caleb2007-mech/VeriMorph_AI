import { Shield, Home, Upload, History, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {

  const location = useLocation();
  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/upload', label: 'Upload', icon: Upload },
    { to: '/chat', label: 'AI Chat', icon: MessageSquare },
    { to: '/history', label: 'History', icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3">
          <div className="relative">
            <Shield className="w-9 h-9 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-app-accent animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">
              VeriMorph AI
            </div>
            <div className="text-xs text-slate-400 leading-none mt-1">
              Explainable Document Forgery Detection
            </div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${location.pathname === to
                  ? 'bg-app-surface text-app-accent border border-white/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>


      </div>
    </header>
  );
}
