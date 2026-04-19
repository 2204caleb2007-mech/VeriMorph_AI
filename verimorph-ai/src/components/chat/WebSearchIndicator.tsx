// ============================================================
// PART 12 — Web Search Indicator
// Animated Tavily live-search indicator
// ============================================================
import { Globe } from 'lucide-react';

const WebSearchIndicator: React.FC = () => (
  <div className="flex items-center gap-2 text-sm text-app-accent animate-pulse px-4 py-2">
    <Globe className="w-4 h-4" />
    <span className="font-medium tracking-tight">Searching the web with Tavily...</span>
  </div>
);

export default WebSearchIndicator;
