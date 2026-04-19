// ============================================================
// ThemeToggle — PART 7a common
// Dark / Light mode toggle with CSS transition
// ============================================================
import { Moon, Sun } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const ThemeToggle: React.FC = () => {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  return (
    <button
      id="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="
        relative w-9 h-9 rounded-xl
        bg-white/5
        border border-white/10
        hover:bg-white/10
        transition-all duration-300
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-app-accent
      "
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-400" />
      ) : (
        <Moon className="w-5 h-5 text-slate-600" />
      )}
    </button>
  );
};

export default ThemeToggle;
